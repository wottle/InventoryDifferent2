const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
};

export function localeFromLang(lang: string): string {
  return LOCALE_MAP[lang] ?? 'en-US';
}

export function formatDate(
  dateString: string | null | undefined,
  lang: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(localeFromLang(lang), options);
}

export function formatDateTime(
  dateString: string | null | undefined,
  lang: string,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString(localeFromLang(lang), options);
}
