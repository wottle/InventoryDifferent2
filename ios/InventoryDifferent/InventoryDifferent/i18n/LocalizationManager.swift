// LocalizationManager.swift
//
// Singleton ObservableObject that provides the active Translations instance.
//
// Language resolution order:
//   1. UserDefaults key "app_language" set by the iOS Settings app (or in-app picker)
//   2. If "system" (or unset), use the device's preferred language if supported
//   3. Fall back to English
//
// Currency resolution order:
//   1. UserDefaults key "app_currency" set by the iOS Settings app
//   2. If "system" (or unset), use the default currency for the current language
//
// Views inject this via @EnvironmentObject and access strings as `lm.t.someKey`.
// For currency-aware formatting, use lm.effectiveCurrencyCode, lm.effectiveLocale,
// and lm.effectiveCurrencySymbol instead of lm.t.common.currencyCode.

import Foundation
import Combine
import SwiftUI

final class LocalizationManager: ObservableObject {

    static let shared = LocalizationManager()

    /// The key used in UserDefaults and the Settings.bundle Root.plist.
    static let userDefaultsKey = "app_language"

    /// The UserDefaults key for the currency override.
    static let currencyDefaultsKey = "app_currency"

    /// Languages the app has full translations for.
    static let supported = ["en", "de", "fr", "es", "it"]

    /// Currency codes available in Settings (first entry means "use language default").
    static let supportedCurrencies = ["system", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "MXN", "ARS", "CLP"]

    /// The active translations object. Views observe this via @EnvironmentObject.
    @Published private(set) var t: Translations

    /// The resolved language code ("en", "de", etc.).
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
        switch lang {
        case "de": return .de
        case "fr": return .fr
        case "es": return .es
        case "it": return .it
        default: return .en
        }
    }

    // MARK: - Effective currency (may be overridden independently of language)

    /// The ISO 4217 currency code to use for formatting. Reads the Settings override;
    /// falls back to the language-default code stored in t.common.currencyCode.
    var effectiveCurrencyCode: String {
        let stored = UserDefaults.standard.string(forKey: Self.currencyDefaultsKey) ?? "system"
        if stored != "system" && Self.supportedCurrencies.contains(stored) { return stored }
        return t.common.currencyCode
    }

    /// The BCP-47 / POSIX locale identifier for number formatting (e.g. "en_US", "fr_FR").
    /// Always reflects the current language — currency placement follows language, not currency.
    var effectiveLocale: String { t.common.locale }

    /// The currency symbol for the effective currency code in the current locale.
    var effectiveCurrencySymbol: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: effectiveLocale)
        formatter.currencyCode = effectiveCurrencyCode
        return formatter.currencySymbol ?? effectiveCurrencyCode
    }

    // MARK: - Reload on UserDefaults change

    private func reload() {
        let lang = Self.resolveLanguage()
        if lang != currentLanguage {
            currentLanguage = lang
            t = Self.translations(for: lang)
        } else {
            // Language unchanged — but currency override may have changed; trigger re-render.
            objectWillChange.send()
        }
    }
}
