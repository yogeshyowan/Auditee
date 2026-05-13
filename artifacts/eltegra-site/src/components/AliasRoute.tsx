import { type ComponentType } from "react";
import { Route } from "wouter";
import { CanonicalContext } from "@/contexts/CanonicalContext";

interface AliasRouteProps {
  /** The alias path this route is mounted at (e.g. "/customers"). */
  path: string;
  /** The canonical URL path search engines should index (e.g. "/case-studies"). */
  canonical: string;
  /** The page component to render. */
  component: ComponentType;
}

/**
 * Drop-in replacement for <Route> on alias URLs.
 *
 * Renders the page component inside a CanonicalContext.Provider so that
 * SEO.tsx automatically sets <link rel="canonical"> to the primary URL
 * even when the user or a bot lands on the alias path.
 *
 * nginx already issues 301 redirects for server-side crawls; this handles
 * client-side SPA navigation and provides a defence-in-depth safety net.
 */
export function AliasRoute({ path, canonical, component: Component }: AliasRouteProps) {
  return (
    <Route path={path}>
      <CanonicalContext.Provider value={canonical}>
        <Component />
      </CanonicalContext.Provider>
    </Route>
  );
}
