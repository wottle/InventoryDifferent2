import SwiftUI

struct CachedThumbnailImage: View {
    let url: URL?

    @State private var uiImage: UIImage?

    var body: some View {
        Group {
            if let uiImage {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else {
                ZStack {
                    Color(.systemGray5)
                    Image(systemName: "photo")
                        .foregroundColor(.secondary)
                }
            }
        }
        .task(id: url) {
            guard let url else { return }
            uiImage = await ImageCacheService.shared.loadImage(for: url)
        }
    }
}
