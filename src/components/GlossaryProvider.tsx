"use client";

import { createContext, useContext } from "react";
import type { Glossary } from "@/lib/content";

const GlossaryContext = createContext<Glossary>({});

export default function GlossaryProvider({
  glossary,
  children,
}: {
  glossary: Glossary;
  children: React.ReactNode;
}) {
  return <GlossaryContext.Provider value={glossary}>{children}</GlossaryContext.Provider>;
}

export function useGlossary(): Glossary {
  return useContext(GlossaryContext);
}
