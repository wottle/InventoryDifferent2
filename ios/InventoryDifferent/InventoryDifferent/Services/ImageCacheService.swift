import UIKit

actor ImageCacheService {
    static let shared = ImageCacheService()

    private let memoryCache = NSCache<NSString, UIImage>()
    private let cacheDirectory: URL
    private let staleDuration: TimeInterval = 7 * 24 * 60 * 60   // 7 days

    private init() {
        let caches = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        cacheDirectory = caches.appendingPathComponent("ThumbnailCache", isDirectory: true)
        try? FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
        memoryCache.countLimit = 200
    }

    func loadImage(for url: URL) async -> UIImage? {
        let key = cacheKey(for: url)

        // 1. Memory cache (instant)
        if let cached = memoryCache.object(forKey: key as NSString) {
            return cached
        }

        // 2. Disk cache
        let fileURL = cacheDirectory.appendingPathComponent(key)
        if let image = loadFromDisk(at: fileURL) {
            memoryCache.setObject(image, forKey: key as NSString)
            // Refresh in background if stale
            if isStale(fileURL: fileURL) {
                Task { await downloadAndCache(url: url, key: key) }
            }
            return image
        }

        // 3. Network
        return await downloadAndCache(url: url, key: key)
    }

    @discardableResult
    private func downloadAndCache(url: URL, key: String) async -> UIImage? {
        guard let (data, _) = try? await URLSession.shared.data(from: url),
              let image = UIImage(data: data) else { return nil }
        memoryCache.setObject(image, forKey: key as NSString)
        let fileURL = cacheDirectory.appendingPathComponent(key)
        try? data.write(to: fileURL)
        return image
    }

    private func loadFromDisk(at fileURL: URL) -> UIImage? {
        guard let data = try? Data(contentsOf: fileURL) else { return nil }
        return UIImage(data: data)
    }

    private func isStale(fileURL: URL) -> Bool {
        guard let attrs = try? FileManager.default.attributesOfItem(atPath: fileURL.path),
              let modified = attrs[.modificationDate] as? Date else { return true }
        return Date().timeIntervalSince(modified) > staleDuration
    }

    func sweepUnused(keeping activeURLs: Set<URL>) {
        let activeKeys = Set(activeURLs.map { cacheKey(for: $0) })
        guard let files = try? FileManager.default.contentsOfDirectory(atPath: cacheDirectory.path) else { return }
        for file in files where !activeKeys.contains(file) {
            try? FileManager.default.removeItem(at: cacheDirectory.appendingPathComponent(file))
            memoryCache.removeObject(forKey: file as NSString)
        }
    }

    func removeImage(for url: URL) {
        let key = cacheKey(for: url)
        memoryCache.removeObject(forKey: key as NSString)
        let fileURL = cacheDirectory.appendingPathComponent(key)
        try? FileManager.default.removeItem(at: fileURL)
    }

    private func cacheKey(for url: URL) -> String {
        url.absoluteString
            .replacingOccurrences(of: "://", with: "_")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: ":", with: "_")
    }
}
