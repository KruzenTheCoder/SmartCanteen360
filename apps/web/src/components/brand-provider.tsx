"use client";

import { createContext, useContext, useEffect } from "react";

import { DEFAULT_BRAND, type Brand } from "@/lib/branding";

const BrandContext = createContext<Brand>(DEFAULT_BRAND);

export function useBrand() {
  return useContext(BrandContext);
}

/**
 * Provides white-label branding to the client tree and applies the tenant's
 * primary colour as a CSS variable so accents follow the brand.
 */
export function BrandProvider({ brand, children }: { brand: Brand; children: React.ReactNode }) {
  useEffect(() => {
    if (brand.primaryColor) {
      document.documentElement.style.setProperty("--brand-primary", brand.primaryColor);
    }
  }, [brand.primaryColor]);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}
