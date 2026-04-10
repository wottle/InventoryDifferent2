import { en } from "./translations/en";
import { de } from "./translations/de";
import { fr } from "./translations/fr";
import { es } from "./translations/es";

export type { Translations } from "./translations/en";

const translations = { en, de, fr, es } as const;

export type SupportedLanguage = keyof typeof translations;

export function getTranslations(lang?: string | null) {
  const key = (lang ?? "en") as SupportedLanguage;
  return translations[key] ?? en;
}
