import { en } from "./translations/en";
import { de } from "./translations/de";

export type { Translations } from "./translations/en";

const translations = { en, de } as const;

export type SupportedLanguage = keyof typeof translations;

export function getTranslations(lang?: string | null) {
  const key = (lang ?? "en") as SupportedLanguage;
  return translations[key] ?? en;
}
