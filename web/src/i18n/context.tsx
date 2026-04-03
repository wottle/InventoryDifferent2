"use client";

import { createContext, useContext } from "react";
import type { Translations } from "./translations/en";
import { en } from "./translations/en";

const TranslationContext = createContext<Translations>(en);

export function TranslationProvider({
  translations,
  children,
}: {
  translations: Translations;
  children: React.ReactNode;
}) {
  return (
    <TranslationContext.Provider value={translations}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useT(): Translations {
  return useContext(TranslationContext);
}
