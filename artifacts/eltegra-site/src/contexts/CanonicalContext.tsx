import { createContext, useContext } from "react";

/**
 * Provides the canonical URL path for pages rendered at alias routes.
 * When a page is mounted at an alias (e.g. /customers → /case-studies),
 * this context carries the canonical path so SEO.tsx can set the correct
 * <link rel="canonical"> even if the page's own `path` prop is overridden
 * or if someone forgets to pass `canonicalPath` explicitly.
 */
export const CanonicalContext = createContext<string | null>(null);

export function useCanonicalOverride(): string | null {
  return useContext(CanonicalContext);
}
