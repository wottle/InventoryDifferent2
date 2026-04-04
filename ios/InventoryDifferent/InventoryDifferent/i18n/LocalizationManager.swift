// LocalizationManager.swift
//
// Singleton ObservableObject that provides the active Translations instance.
//
// Language resolution order:
//   1. UserDefaults key "app_language" set by the iOS Settings app (or in-app picker)
//   2. If "system" (or unset), use the device's preferred language if supported
//   3. Fall back to English
//
// Views inject this via @EnvironmentObject and access strings as `lm.t.someKey`.

import Foundation
import Combine
import SwiftUI

final class LocalizationManager: ObservableObject {

    static let shared = LocalizationManager()

    /// The key used in UserDefaults and the Settings.bundle Root.plist.
    static let userDefaultsKey = "app_language"

    /// Languages the app has full translations for.
    static let supported = ["en", "de"]

    /// The active translations object. Views observe this via @EnvironmentObject.
    @Published private(set) var t: Translations

    /// The resolved language code ("en" or "de").
    @Published private(set) var currentLanguage: String

    private var cancellable: AnyCancellable?

    private init() {
        let lang = Self.resolveLanguage()
        currentLanguage = lang
        t = Self.translations(for: lang)

        // Re-evaluate whenever UserDefaults change (covers Settings app changes
        // as well as any in-app picker that writes to UserDefaults).
        cancellable = NotificationCenter.default
            .publisher(for: UserDefaults.didChangeNotification)
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in self?.reload() }
    }

    // MARK: - Language resolution

    static func resolveLanguage() -> String {
        let stored = UserDefaults.standard.string(forKey: userDefaultsKey) ?? "system"
        if stored == "system" {
            // Use the first preferred device language that the app supports.
            for langCode in Locale.preferredLanguages {
                let prefix = String(langCode.prefix(2))
                if supported.contains(prefix) { return prefix }
            }
            return "en"
        }
        return supported.contains(stored) ? stored : "en"
    }

    static func translations(for lang: String) -> Translations {
        lang == "de" ? .de : .en
    }

    // MARK: - Reload on UserDefaults change

    private func reload() {
        let lang = Self.resolveLanguage()
        guard lang != currentLanguage else { return }
        currentLanguage = lang
        t = Self.translations(for: lang)
    }
}
