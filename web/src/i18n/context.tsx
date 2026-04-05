"use client";

import { createContext, useContext } from "react";
import type { Translations } from "./translations/en";
import { en } from "./translations/en";

interface TranslationContextValue {
  t: Translations;
  locale: string;
}

const TranslationContext = createContext<TranslationContextValue>({ t: en, locale: "en" });

export function TranslationProvider({
  translations,
  locale,
  children,
}: {
  translations: Translations;
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <TranslationContext.Provider value={{ t: translations, locale }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useT(): Translations {
  return useContext(TranslationContext).t;
}

export function useLocale(): string {
  return useContext(TranslationContext).locale;
}
