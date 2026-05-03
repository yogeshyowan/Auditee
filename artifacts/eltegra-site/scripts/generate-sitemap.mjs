#!/usr/bin/env node
/**
 * Build-time sitemap.xml generator for the Auditee marketing site.
 *
 * SINGLE SOURCE OF TRUTH for the sitemap. Reads the canonical route list
 * below and the blog post catalogue from src/content/blog/, and writes
 * public/sitemap.xml so every published URL is discoverable. Also emits
 * <image:image> entries for the homepage and any blog post that declares
 * a heroImage. Runs automatically as a `prebuild` step and can be invoked
 * manually with `pnpm --filter @workspace/eltegra-site run sitemap`.
 *
 * KEEP IN SYNC with src/App.tsx whenever a new public marketing route is
 * added. App-internal routes under /app/* and auth routes are excluded
 * (they are noindex via robots.txt + per-page meta).
 */
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SITE = "https://auditee.site";
const today = new Date().toISOString().slice(0, 10);

// Canonical marketing routes. Sub-arrays declare known aliases so the
// generator can collapse them to the canonical URL only (aliases get a
// 301 from the SPA via wouter; we don't want both indexed). The first
// entry of each `aliases` group is the canonical.
const STATIC_ROUTES = [
  // ---- core ----
  { path: "/",                         priority: 1.00, changefreq: "weekly" },
  { path: "/features",                 priority: 0.90, changefreq: "weekly" },
  { path: "/pricing",                  priority: 0.95, changefreq: "weekly" },
  { path: "/roi-calculator",           priority: 0.80, changefreq: "monthly" },
  { path: "/about",                    priority: 0.60, changefreq: "monthly" },
  { path: "/contact",                  priority: 0.70, changefreq: "monthly" },
  { path: "/security",                 priority: 0.85, changefreq: "monthly" },

  // ---- products ----
  { path: "/ai-product-development",         priority: 0.85, changefreq: "monthly" },
  { path: "/automated-compliance",           priority: 0.85, changefreq: "monthly" },
  { path: "/ai-requirements-management",     priority: 0.85, changefreq: "monthly" },
  { path: "/ai-requirements-generation",     priority: 0.80, changefreq: "monthly" },
  { path: "/missing-requirements-analysis",  priority: 0.80, changefreq: "monthly" },
  { path: "/test-case-generation",           priority: 0.80, changefreq: "monthly" },
  { path: "/requirements-linked-test-cases", priority: 0.75, changefreq: "monthly" },
  { path: "/requirements-management",        priority: 0.85, changefreq: "monthly" },
  { path: "/intelligent-document-analysis",  priority: 0.75, changefreq: "monthly" },
  { path: "/brd-generation",                 priority: 0.80, changefreq: "monthly" },
  { path: "/qa-and-compliance",              priority: 0.80, changefreq: "monthly" },

  // ---- industries ----
  { path: "/industries",         priority: 0.85, changefreq: "monthly" },
  { path: "/ai-for-healthcare",  priority: 0.85, changefreq: "monthly" },
  { path: "/ai-for-finance",     priority: 0.85, changefreq: "monthly" },
  { path: "/ai-for-automotive",  priority: 0.85, changefreq: "monthly" },
  { path: "/ai-for-telecom",     priority: 0.85, changefreq: "monthly" },

  // ---- roles ----
  { path: "/cpo",                priority: 0.75, changefreq: "monthly" },
  { path: "/cto",                priority: 0.75, changefreq: "monthly" },
  { path: "/business-analyst",   priority: 0.75, changefreq: "monthly" },

  // ---- comparisons ----
  { path: "/compare",            priority: 0.85, changefreq: "monthly" },
  { path: "/compare/doors",      priority: 0.85, changefreq: "monthly" },
  { path: "/compare/jama",       priority: 0.85, changefreq: "monthly" },
  { path: "/compare/polarion",   priority: 0.85, changefreq: "monthly" },

  // ---- resources ----
  { path: "/blog",          priority: 0.95, changefreq: "weekly" },
  { path: "/integrations",  priority: 0.85, changefreq: "monthly" },
  { path: "/glossary",      priority: 0.75, changefreq: "monthly" },
  { path: "/case-studies",  priority: 0.85, changefreq: "monthly" },
  { path: "/customers",     priority: 0.75, changefreq: "monthly" },
  { path: "/use-cases",     priority: 0.85, changefreq: "monthly" },
  { path: "/whitepapers",   priority: 0.80, changefreq: "monthly" },
  { path: "/changelog",     priority: 0.70, changefreq: "weekly" },
  { path: "/trust",         priority: 0.80, changefreq: "monthly" },
  { path: "/developers",    priority: 0.85, changefreq: "monthly" },
  { path: "/partners",      priority: 0.75, changefreq: "monthly" },
  { path: "/status",        priority: 0.60, changefreq: "daily"   },
  { path: "/demo-videos",   priority: 0.80, changefreq: "monthly" },
  { path: "/faqs",          priority: 0.80, changefreq: "monthly" },

  // ---- company ----
  { path: "/roadmap",            priority: 0.75, changefreq: "monthly" },
  { path: "/careers",            priority: 0.70, changefreq: "weekly"  },
  { path: "/newsroom",           priority: 0.65, changefreq: "monthly" },
  { path: "/brand",              priority: 0.50, changefreq: "yearly"  },
  { path: "/webinars",           priority: 0.75, changefreq: "weekly"  },
  { path: "/help",               priority: 0.70, changefreq: "monthly" },
  { path: "/migrations",         priority: 0.85, changefreq: "monthly" },
  { path: "/affiliates",         priority: 0.65, changefreq: "monthly" },
  { path: "/free-tools",         priority: 0.80, changefreq: "monthly" },
  { path: "/templates",          priority: 0.80, changefreq: "monthly" },
  { path: "/for-startups",       priority: 0.75, changefreq: "monthly" },
  { path: "/for-enterprise",     priority: 0.85, changefreq: "monthly" },
  { path: "/customers",          priority: 0.80, changefreq: "monthly" },
  { path: "/standards",          priority: 0.85, changefreq: "monthly" },
  { path: "/teams",              priority: 0.75, changefreq: "monthly" },
  { path: "/vdp",                priority: 0.50, changefreq: "yearly"  },
  { path: "/sitemap",            priority: 0.45, changefreq: "monthly" },
  { path: "/community",          priority: 0.65, changefreq: "monthly" },
  { path: "/accessibility",      priority: 0.50, changefreq: "yearly"  },
  { path: "/refund-policy",      priority: 0.40, changefreq: "yearly"  },
  { path: "/cancellation-policy",priority: 0.40, changefreq: "yearly"  },
  { path: "/shipping-policy",    priority: 0.40, changefreq: "yearly"  },
  { path: "/aspice",                   priority: 0.90, changefreq: "monthly" },
  { path: "/iec-62304",                priority: 0.90, changefreq: "monthly" },
  { path: "/fda-qmsr",                 priority: 0.90, changefreq: "monthly" },
  { path: "/integrations/jira",        priority: 0.85, changefreq: "monthly" },
  { path: "/integrations/azure-devops",priority: 0.85, changefreq: "monthly" },

  // ---- legal ----
  { path: "/privacy-policy",     priority: 0.40, changefreq: "yearly" },
  { path: "/terms-of-service",   priority: 0.40, changefreq: "yearly" },
  { path: "/cookie-policy",      priority: 0.40, changefreq: "yearly" },
  { path: "/sla",                priority: 0.55, changefreq: "yearly" },
  { path: "/dpa",                priority: 0.55, changefreq: "yearly" },
  { path: "/sub-processors",     priority: 0.55, changefreq: "monthly" },
  { path: "/aup",                priority: 0.45, changefreq: "yearly" },
];

// Per-route image attachments for image-sitemap entries (Google Images).
const ROUTE_IMAGES = {
  "/": [
    { loc: `${SITE}/opengraph.jpg`,    title: "Auditee — AI-native enterprise PDLC platform" },
    { loc: `${SITE}/hero-network.png`, title: "Auditee living knowledge graph" },
  ],
  "/features":     [{ loc: `${SITE}/opengraph.jpg`, title: "Auditee feature set" }],
  "/pricing":      [{ loc: `${SITE}/opengraph.jpg`, title: "Auditee pricing" }],
  "/security":     [{ loc: `${SITE}/opengraph.jpg`, title: "Auditee security & trust" }],
  "/trust":        [{ loc: `${SITE}/opengraph.jpg`, title: "Auditee Trust Center" }],
  "/developers":   [{ loc: `${SITE}/opengraph.jpg`, title: "Auditee for developers" }],
  "/use-cases":    [{ loc: `${SITE}/opengraph.jpg`, title: "Auditee use cases" }],
  "/case-studies": [{ loc: `${SITE}/opengraph.jpg`, title: "Auditee case studies" }],
};

async function loadBlogPosts() {
  const dir = path.join(root, "src/content/blog");
  const files = await fs.readdir(dir);
  const posts = [];
  for (const f of files) {
    if (f === "index.ts" || !f.endsWith(".ts")) continue;
    const src = await fs.readFile(path.join(dir, f), "utf8");
    const slug = pick(src, /\bslug:\s*"([^"]+)"/);
    const date = pick(src, /\bdate:\s*"([^"]+)"/);
    const updated = pick(src, /\bupdated:\s*"([^"]+)"/);
    const title = pick(src, /\btitle:\s*"([^"]+)"/);
    const heroImage = pick(src, /\bheroImage:\s*"([^"]+)"/);
    if (slug && date) posts.push({ slug, date, lastmod: updated || date, title, heroImage });
  }
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function pick(src, re) {
  const m = src.match(re);
  return m ? m[1] : null;
}

function xmlEscape(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);
}

function urlEntry(loc, lastmod, changefreq, priority, images = []) {
  const imgXml = images
    .map(
      (im) =>
        `    <image:image><image:loc>${xmlEscape(im.loc)}</image:loc>${
          im.title ? `<image:title>${xmlEscape(im.title)}</image:title>` : ""
        }</image:image>`,
    )
    .join("\n");
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(2)}</priority>${imgXml ? `\n${imgXml}` : ""}
  </url>`;
}

function absoluteImage(src) {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return src;
  return `${SITE}${src.startsWith("/") ? "" : "/"}${src}`;
}

async function main() {
  const posts = await loadBlogPosts();

  const entries = [
    ...STATIC_ROUTES.map((r) =>
      urlEntry(`${SITE}${r.path}`, today, r.changefreq, r.priority, ROUTE_IMAGES[r.path] ?? []),
    ),
    ...posts.map((p) => {
      const images = [];
      const hero = absoluteImage(p.heroImage);
      if (hero) images.push({ loc: hero, title: p.title ?? `Auditee blog: ${p.slug}` });
      return urlEntry(`${SITE}/blog/${p.slug}`, p.lastmod, "monthly", 0.7, images);
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;

  const out = path.join(root, "public/sitemap.xml");
  await fs.writeFile(out, xml, "utf8");
  console.log(
    `[sitemap] wrote ${entries.length} URLs (${STATIC_ROUTES.length} static + ${posts.length} posts) to ${path.relative(root, out)}`,
  );

  // ---------- Google News sitemap ----------
  // Google News only accepts articles published in the last 48 hours. We
  // still emit the file (with the most recent posts even if older) so the
  // index reference is always valid; Google will simply ignore older
  // entries. Submitting this in Google Publisher Center makes the blog
  // eligible for the News carousel and Top Stories.
  const NEWS_WINDOW_DAYS = 2;
  const cutoff = new Date(Date.now() - NEWS_WINDOW_DAYS * 86400_000);
  const newsPosts = posts.filter((p) => new Date(p.date) >= cutoff);
  // Always include at least the most recent post so the file isn't empty
  // (an empty <urlset> trips Google Search Console's validator).
  const newsForXml = newsPosts.length > 0 ? newsPosts : posts.slice(0, 1);
  const newsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${newsForXml
  .map(
    (p) => `  <url>
    <loc>${xmlEscape(`${SITE}/blog/${p.slug}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>Auditee Blog</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${p.date}</news:publication_date>
      <news:title>${xmlEscape(p.title ?? p.slug)}</news:title>
    </news:news>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
  const newsOut = path.join(root, "public/sitemap-news.xml");
  await fs.writeFile(newsOut, newsXml, "utf8");
  console.log(`[sitemap] wrote news sitemap with ${newsForXml.length} entries`);

  // ---------- Sitemap index ----------
  // Wraps the main and news sitemaps. Google Search Console + Bing
  // Webmaster Tools accept a single sitemap-index URL and discover
  // child sitemaps from it.
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE}/sitemap-news.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE}/sitemap-video.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE}/sitemap-images.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`;
  const indexOut = path.join(root, "public/sitemap-index.xml");
  await fs.writeFile(indexOut, indexXml, "utf8");
  console.log(`[sitemap] wrote sitemap index`);
}

main().catch((err) => {
  console.error("[sitemap] failed:", err);
  process.exit(1);
});
