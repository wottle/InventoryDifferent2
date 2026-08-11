import { en } from "./translations/en";
import { de } from "./translations/de";
import { fr } from "./translations/fr";
import { es } from "./translations/es";
import { it } from "./translations/it";

export type { Translations } from "./translations/en";

const translations = { en, de, fr, es, it } as const;

export type SupportedLanguage = keyof typeof translations;

export function getTranslations(lang?: string | null) {
  const key = (lang ?? "en") as SupportedLanguage;
  const base = translations[key] ?? en;

  const currencyOverride = process.env.CURRENCY;
  if (!currencyOverride) return base;

  const symbolOverride = new Intl.NumberFormat(base.common.locale, {
    style: "currency",
    currency: currencyOverride,
  })
    .formatToParts(1)
    .find((p) => p.type === "currency")?.value ?? currencyOverride;

  return {
    ...base,
    common: { ...base.common, currencyCode: currencyOverride, currencySymbol: symbolOverride },
  };
}
