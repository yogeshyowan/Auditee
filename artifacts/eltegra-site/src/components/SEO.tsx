import { useEffect } from "react";
import { useCanonicalOverride } from "@/contexts/CanonicalContext";

export const SITE_URL = "https://auditee.site";
export const SITE_NAME = "Auditee";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`;

export interface SEOProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: "website" | "article";
  keywords?: string[];
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  articleTags?: string[];
  /** Override the canonical URL path. Use when a page is served at multiple
   *  alias routes and only the primary canonical should be declared. */
  canonicalPath?: string;
}

const MANAGED_ATTR = "data-seo-managed";

/** Truncate at word boundary to keep under `max` characters. */
function truncateAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + "\u2026";
}

/** Return a title that fits Google's ~60-char display limit. */
function buildTitle(rawTitle: string): string {
  const branded = rawTitle.includes(SITE_NAME) ? rawTitle : `${rawTitle} | ${SITE_NAME}`;
  if (branded.length <= 60) return branded;
  // Try the raw title without the site name suffix
  if (rawTitle.length <= 60) return rawTitle;
  // Truncate at word boundary preserving the site name if possible
  return truncateAtWord(rawTitle, 57) + " | " + SITE_NAME.slice(0, 0) || truncateAtWord(branded, 60);
}

/** Return a description that fits the ~160-char meta description limit. */
function buildDescription(desc: string): string {
  return truncateAtWord(desc, 160);
}

// Claim ANY existing tag matching the key (managed or static from index.html)
// so we don't end up with duplicate description / canonical / og:url / hreflang
// blocks at runtime. Semrush flags duplicate canonical and hreflang tags as
// High-severity issues. If no existing tag is found, create + mark managed.
function setMeta(_selector: string, attrName: "name" | "property", key: string, content: string) {
  const liveSelector = `meta[${attrName}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(liveSelector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, key);
    document.head.appendChild(el);
  }
  el.setAttribute(MANAGED_ATTR, "true");
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string, extraAttr?: { name: string; value: string }) {
  const liveSelector = extraAttr
    ? `link[rel="${rel}"][${extraAttr.name}="${extraAttr.value}"]`
    : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(liveSelector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (extraAttr) el.setAttribute(extraAttr.name, extraAttr.value);
    document.head.appendChild(el);
  }
  el.setAttribute(MANAGED_ATTR, "true");
  el.setAttribute("href", href);
}

function clearManaged() {
  document.head.querySelectorAll(`[${MANAGED_ATTR}]`).forEach((n) => n.remove());
}

export function SEO(props: SEOProps) {
  const {
    title,
    description,
    path,
    canonicalPath,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = "website",
    keywords,
    noindex,
    jsonLd,
    publishedTime,
    modifiedTime,
    author,
    articleTags,
  } = props;

  // Context-provided canonical takes effect when this component is rendered
  // inside an <AliasRoute>. The explicit prop always wins; context is the
  // defence-in-depth fallback; finally fall back to the page's own path.
  const contextCanonical = useCanonicalOverride();

  useEffect(() => {
    const safePath = typeof path === "string" && path.length > 0 ? path : "/";
    const resolvedCanonical = canonicalPath ?? contextCanonical ?? null;
    const canonSafePath = resolvedCanonical
      ? (resolvedCanonical.startsWith("/") ? resolvedCanonical : `/${resolvedCanonical}`)
      : safePath;

    const fullUrl = `${SITE_URL}${safePath.startsWith("/") ? safePath : `/${safePath}`}`;
    const canonicalUrl = `${SITE_URL}${canonSafePath}`;

    const fullTitle = buildTitle(title);
    const safeDescription = buildDescription(description);

    document.title = fullTitle;

    // Robots — explicit per-page so app routes (or any future) can be deindexed.
    setMeta(
      `meta[name="robots"][${MANAGED_ATTR}]`,
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    );

    setMeta(`meta[name="description"][${MANAGED_ATTR}]`, "name", "description", safeDescription);
    if (keywords && keywords.length > 0) {
      setMeta(`meta[name="keywords"][${MANAGED_ATTR}]`, "name", "keywords", keywords.join(", "));
    }

    // Open Graph
    setMeta(`meta[property="og:type"][${MANAGED_ATTR}]`, "property", "og:type", ogType);
    setMeta(`meta[property="og:title"][${MANAGED_ATTR}]`, "property", "og:title", fullTitle);
    setMeta(`meta[property="og:description"][${MANAGED_ATTR}]`, "property", "og:description", safeDescription);
    setMeta(`meta[property="og:url"][${MANAGED_ATTR}]`, "property", "og:url", canonicalUrl);
    setMeta(`meta[property="og:image"][${MANAGED_ATTR}]`, "property", "og:image", ogImage);
    setMeta(`meta[property="og:site_name"][${MANAGED_ATTR}]`, "property", "og:site_name", SITE_NAME);
    setMeta(`meta[property="og:locale"][${MANAGED_ATTR}]`, "property", "og:locale", "en_US");

    // Article-specific
    if (ogType === "article") {
      if (publishedTime) {
        setMeta(
          `meta[property="article:published_time"][${MANAGED_ATTR}]`,
          "property",
          "article:published_time",
          publishedTime,
        );
      }
      if (modifiedTime) {
        setMeta(
          `meta[property="article:modified_time"][${MANAGED_ATTR}]`,
          "property",
          "article:modified_time",
          modifiedTime,
        );
      }
      if (author) {
        setMeta(`meta[property="article:author"][${MANAGED_ATTR}]`, "property", "article:author", author);
      }
      (articleTags || []).forEach((tag, i) => {
        const sel = `meta[property="article:tag"][data-seo-tag-index="${i}"]`;
        let el = document.head.querySelector<HTMLMetaElement>(sel);
        if (!el) {
          el = document.createElement("meta");
          el.setAttribute("property", "article:tag");
          el.setAttribute("data-seo-tag-index", String(i));
          el.setAttribute(MANAGED_ATTR, "true");
          document.head.appendChild(el);
        }
        el.setAttribute("content", tag);
      });
    }

    // Twitter
    setMeta(
      `meta[name="twitter:card"][${MANAGED_ATTR}]`,
      "name",
      "twitter:card",
      "summary_large_image",
    );
    setMeta(`meta[name="twitter:title"][${MANAGED_ATTR}]`, "name", "twitter:title", fullTitle);
    setMeta(
      `meta[name="twitter:description"][${MANAGED_ATTR}]`,
      "name",
      "twitter:description",
      safeDescription,
    );
    setMeta(`meta[name="twitter:image"][${MANAGED_ATTR}]`, "name", "twitter:image", ogImage);
    setMeta(
      `meta[name="twitter:image:alt"][${MANAGED_ATTR}]`,
      "name",
      "twitter:image:alt",
      fullTitle,
    );
    setMeta(`meta[name="twitter:site"][${MANAGED_ATTR}]`, "name", "twitter:site", "@auditee_ai");
    setMeta(
      `meta[name="twitter:creator"][${MANAGED_ATTR}]`,
      "name",
      "twitter:creator",
      "@auditee_ai",
    );
    setMeta(`meta[name="twitter:url"][${MANAGED_ATTR}]`, "name", "twitter:url", canonicalUrl);
    setMeta(
      `meta[property="og:image:alt"][${MANAGED_ATTR}]`,
      "property",
      "og:image:alt",
      fullTitle,
    );

    // Canonical + per-page hreflang. The site is single-language English so we
    // only emit a self-referencing `en` and `x-default` (per Google guidance —
    // declaring en-US/en-GB/en-IN/en-AU/en-CA all pointing at the same URL is
    // low-signal and Semrush/Ahrefs flag it as redundant).
    setLink("canonical", canonicalUrl);
    setLink("alternate", canonicalUrl, { name: "hreflang", value: "en" });
    setLink("alternate", canonicalUrl, { name: "hreflang", value: "x-default" });

    // JSON-LD
    const userLds = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

    // Auto-emit BreadcrumbList for any non-root page that didn't already
    // declare one. Derives crumb labels from URL segments (kebab-case →
    // Title Case). Google surfaces the breadcrumb trail in SERP snippets
    // instead of the raw URL when this is present, and AI answer engines
    // use it for site-hierarchy context. Skipped on "/" (just Home is
    // noise) and skipped if the page already provides a BreadcrumbList
    // (e.g. Pricing) to avoid duplicates. Same shape as breadcrumbsLd().
    const trimmedPath = canonSafePath.replace(/^\/+|\/+$/g, "");
    const hasUserBreadcrumb = userLds.some(
      (d) => (d as Record<string, unknown>)["@type"] === "BreadcrumbList",
    );
    const autoBreadcrumb: Record<string, unknown>[] = [];
    if (trimmedPath && !hasUserBreadcrumb) {
      const segments = trimmedPath.split("/").filter(Boolean);
      const crumbs: { name: string; url: string }[] = [
        { name: "Home", url: `${SITE_URL}/` },
      ];
      let acc = "";
      for (const seg of segments) {
        acc += `/${seg}`;
        const name = seg
          .split("-")
          .map((w) =>
            /^(ai|api|sso|qa|sla|saas|pdlc|capa|aspice|iso|iec|fda|cmmi|hipaa|soc|brd|crm|erp|kpi|csv|json|xml|html|css|js|ts|cto|cpo|ceo|cio|ciso)$/i.test(w)
              ? w.toUpperCase()
              : w.charAt(0).toUpperCase() + w.slice(1),
          )
          .join(" ");
        crumbs.push({ name, url: `${SITE_URL}${acc}` });
      }
      autoBreadcrumb.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          item: {
            "@type": "Thing",
            "@id": c.url,
          },
        })),
      });
    }
    const lds = [...autoBreadcrumb, ...userLds];

    lds.forEach((data, i) => {
      const id = `seo-jsonld-${i}`;
      let el = document.head.querySelector<HTMLScriptElement>(`script#${id}`);
      if (!el) {
        el = document.createElement("script");
        el.type = "application/ld+json";
        el.id = id;
        el.setAttribute(MANAGED_ATTR, "true");
        document.head.appendChild(el);
      }
      el.textContent = JSON.stringify(data);
    });

    return () => {
      clearManaged();
    };
  }, [
    title,
    description,
    path,
    canonicalPath,
    ogImage,
    ogType,
    keywords?.join("|"),
    noindex,
    JSON.stringify(jsonLd ?? null),
    publishedTime,
    modifiedTime,
    author,
    articleTags?.join("|"),
  ]);

  return null;
}

export function breadcrumbsLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: {
        "@type": "Thing",
        "@id": `${SITE_URL}${it.path.startsWith("/") ? it.path : `/${it.path}`}`,
      },
    })),
  };
}

export function faqLd(qa: { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

export function articleLd(opts: {
  title: string;
  description: string;
  slug: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  tags?: string[];
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    image: [opts.image],
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: { "@type": "Person", name: opts.authorName },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${opts.slug}` },
    keywords: (opts.tags ?? []).join(", "),
  };
}
