import { useEffect } from "react";

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
}

const MANAGED_ATTR = "data-seo-managed";

function setMeta(selector: string, attrName: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrName, key);
    el.setAttribute(MANAGED_ATTR, "true");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"][${MANAGED_ATTR}]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute(MANAGED_ATTR, "true");
    document.head.appendChild(el);
  }
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

  useEffect(() => {
    const fullUrl = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

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

    setMeta(`meta[name="description"][${MANAGED_ATTR}]`, "name", "description", description);
    if (keywords && keywords.length > 0) {
      setMeta(`meta[name="keywords"][${MANAGED_ATTR}]`, "name", "keywords", keywords.join(", "));
    }

    // Open Graph
    setMeta(`meta[property="og:type"][${MANAGED_ATTR}]`, "property", "og:type", ogType);
    setMeta(`meta[property="og:title"][${MANAGED_ATTR}]`, "property", "og:title", fullTitle);
    setMeta(`meta[property="og:description"][${MANAGED_ATTR}]`, "property", "og:description", description);
    setMeta(`meta[property="og:url"][${MANAGED_ATTR}]`, "property", "og:url", fullUrl);
    setMeta(`meta[property="og:image"][${MANAGED_ATTR}]`, "property", "og:image", ogImage);
    setMeta(`meta[property="og:site_name"][${MANAGED_ATTR}]`, "property", "og:site_name", SITE_NAME);

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
      description,
    );
    setMeta(`meta[name="twitter:image"][${MANAGED_ATTR}]`, "name", "twitter:image", ogImage);

    // Canonical + hreflang
    setLink("canonical", fullUrl);

    // JSON-LD
    const lds = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
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
      item: `${SITE_URL}${it.path.startsWith("/") ? it.path : `/${it.path}`}`,
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
