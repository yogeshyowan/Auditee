#!/usr/bin/env node
/**
 * Build-time sitemap.xml generator for the Auditee marketing site.
 *
 * Reads the canonical route list below and the blog post catalogue from
 * src/content/blog/, and writes public/sitemap.xml so every published URL is
 * discoverable by crawlers. Runs automatically as a `prebuild` step and can
 * also be invoked manually after adding a blog post.
 */
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SITE = "https://auditee.eltegra.ai";
const today = new Date().toISOString().slice(0, 10);

// Canonical marketing routes. KEEP IN SYNC with src/App.tsx.
const STATIC_ROUTES = [
  { path: "/", priority: 1.0, changefreq: "weekly" },
  { path: "/features", priority: 0.9, changefreq: "weekly" },
  { path: "/ai-product-development", priority: 0.85, changefreq: "monthly" },
  { path: "/automated-compliance", priority: 0.85, changefreq: "monthly" },
  { path: "/ai-requirements-management", priority: 0.85, changefreq: "monthly" },
  { path: "/missing-requirements-analysis", priority: 0.8, changefreq: "monthly" },
  { path: "/test-case-generation", priority: 0.8, changefreq: "monthly" },
  { path: "/pricing", priority: 0.9, changefreq: "monthly" },
  { path: "/roi-calculator", priority: 0.8, changefreq: "monthly" },
  { path: "/about", priority: 0.6, changefreq: "monthly" },
  { path: "/contact", priority: 0.7, changefreq: "monthly" },
  { path: "/blog", priority: 0.95, changefreq: "weekly" },
];

async function loadBlogPosts() {
  const dir = path.join(root, "src/content/blog");
  const files = await fs.readdir(dir);
  const posts = [];
  for (const f of files) {
    if (f === "index.ts" || !f.endsWith(".ts")) continue;
    const src = await fs.readFile(path.join(dir, f), "utf8");
    const slug = pick(src, /slug:\s*"([^"]+)"/);
    const date = pick(src, /\bdate:\s*"([^"]+)"/);
    const updated = pick(src, /\bupdated:\s*"([^"]+)"/);
    if (slug && date) posts.push({ slug, date, lastmod: updated || date });
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

async function main() {
  const posts = await loadBlogPosts();

  const entries = [
    ...STATIC_ROUTES.map((r) => {
      const images =
        r.path === "/"
          ? [
              { loc: `${SITE}/opengraph.jpg`, title: "Auditee — AI-native enterprise PDLC platform" },
              { loc: `${SITE}/hero-network.png`, title: "Auditee living knowledge graph" },
            ]
          : [];
      return urlEntry(`${SITE}${r.path}`, today, r.changefreq, r.priority, images);
    }),
    ...posts.map((p) => urlEntry(`${SITE}/blog/${p.slug}`, p.lastmod, "monthly", 0.7)),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join("\n")}
</urlset>
`;

  const out = path.join(root, "public/sitemap.xml");
  await fs.writeFile(out, xml, "utf8");
  console.log(`[sitemap] wrote ${entries.length} URLs to ${path.relative(root, out)}`);
}

main().catch((err) => {
  console.error("[sitemap] failed:", err);
  process.exit(1);
});
