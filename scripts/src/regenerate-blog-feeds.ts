import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { POSTS } from "../../artifacts/eltegra-site/src/content/blog/index.ts";

const SITE = "https://auditee.site";
const PUB_DIR = resolve(import.meta.dirname, "../../artifacts/eltegra-site/public");

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(iso: string): string {
  return new Date(iso).toUTCString();
}

const sortedDesc = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
const newest = sortedDesc[0]!;

// ---------- sitemap.xml: blog section ----------
const blogUrls = sortedDesc.map((p) => {
  const lastmod = (p.updated ?? p.date).slice(0, 10);
  const img = p.heroImage
    ? `\n    <image:image><image:loc>${SITE}${p.heroImage}</image:loc><image:title>${xmlEscape(p.title)}</image:title></image:image>`
    : "";
  return `  <url>
    <loc>${SITE}/blog/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>${img}
  </url>`;
}).join("\n");

// Read existing sitemap.xml, replace section between BLOG markers (or all blog URLs)
import { readFileSync } from "node:fs";
const sitemapPath = resolve(PUB_DIR, "sitemap.xml");
let sitemap = readFileSync(sitemapPath, "utf8");
// Strip every existing <url>…/blog/…</url> block
sitemap = sitemap.replace(/\s*<url>[\s\S]*?<loc>https:\/\/auditee\.site\/blog\/[^<]+<\/loc>[\s\S]*?<\/url>/g, "");
// Insert before </urlset>
sitemap = sitemap.replace("</urlset>", `${blogUrls}\n</urlset>`);
writeFileSync(sitemapPath, sitemap);

// ---------- rss.xml ----------
const rssItems = sortedDesc.map((p) => `    <item>
      <title>${xmlEscape(p.title)}</title>
      <link>${SITE}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${p.slug}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${xmlEscape(p.description)}</description>
      <author>noreply@auditee.site (${xmlEscape(p.author)})</author>
${p.tags.map((t) => `      <category>${xmlEscape(t)}</category>`).join("\n")}
    </item>`).join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Auditee Blog</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Practitioner research on AI-native requirements management, compliance automation, audit, and software lifecycle modernization.</description>
    <language>en</language>
    <lastBuildDate>${rfc822(newest.date)}</lastBuildDate>
    <generator>Auditee RSS generator</generator>
${rssItems}
  </channel>
</rss>
`;
writeFileSync(resolve(PUB_DIR, "rss.xml"), rss);

// ---------- atom.xml ----------
const atomEntries = sortedDesc.map((p) => `  <entry>
    <title>${xmlEscape(p.title)}</title>
    <id>${SITE}/blog/${p.slug}</id>
    <link rel="alternate" type="text/html" href="${SITE}/blog/${p.slug}" />
    <updated>${new Date(p.updated ?? p.date).toISOString()}</updated>
    <published>${new Date(p.date).toISOString()}</published>
    <author><name>${xmlEscape(p.author)}</name></author>
    <summary type="text">${xmlEscape(p.description)}</summary>
${p.tags.map((t) => `    <category term="${xmlEscape(t)}" />`).join("\n")}
  </entry>`).join("\n");

const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
  <title>Auditee Blog</title>
  <subtitle>Practitioner research on AI-native requirements management, compliance automation, audit, and software lifecycle modernization.</subtitle>
  <link rel="self" type="application/atom+xml" href="${SITE}/atom.xml" />
  <link rel="alternate" type="text/html" href="${SITE}/blog" />
  <id>${SITE}/atom.xml</id>
  <updated>${new Date(newest.date).toISOString()}</updated>
  <generator uri="${SITE}" version="1.0">Auditee Atom generator</generator>
  <icon>${SITE}/favicon.svg</icon>
  <logo>${SITE}/logo.svg</logo>
  <rights>© 2026 Eltegra Technologies Pvt. Ltd.</rights>
${atomEntries}
</feed>
`;
writeFileSync(resolve(PUB_DIR, "atom.xml"), atom);

// ---------- feed.json ----------
const feedJson = {
  version: "https://jsonfeed.org/version/1.1",
  title: "Auditee Blog",
  home_page_url: `${SITE}/blog`,
  feed_url: `${SITE}/feed.json`,
  description: "Practitioner research on AI-native requirements management, compliance automation, audit, and software lifecycle modernization.",
  icon: `${SITE}/logo.svg`,
  favicon: `${SITE}/favicon.svg`,
  language: "en",
  authors: [{ name: "Auditee", url: SITE }],
  items: sortedDesc.map((p) => ({
    id: `${SITE}/blog/${p.slug}`,
    url: `${SITE}/blog/${p.slug}`,
    title: p.title,
    content_text: p.excerpt,
    summary: p.description,
    date_published: new Date(p.date).toISOString(),
    date_modified: new Date(p.updated ?? p.date).toISOString(),
    authors: [{ name: p.author, url: SITE }],
    tags: p.tags,
    language: "en",
  })),
};
writeFileSync(resolve(PUB_DIR, "feed.json"), JSON.stringify(feedJson, null, 2) + "\n");

// ---------- sitemap-news.xml (last 30 days only per Google News spec) ----------
const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
const newsItems = sortedDesc
  .filter((p) => new Date(p.date).getTime() >= cutoff)
  .map((p) => `  <url>
    <loc>${SITE}/blog/${p.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Auditee Blog</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${p.date.slice(0, 10)}</news:publication_date>
      <news:title>${xmlEscape(p.title)}</news:title>
    </news:news>
  </url>`).join("\n");

const newsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${newsItems}
</urlset>
`;
writeFileSync(resolve(PUB_DIR, "sitemap-news.xml"), newsXml);

// ---------- llms.txt: rebuild Resources > Blog section ----------
const llmsPath = resolve(PUB_DIR, "llms.txt");
let llms = readFileSync(llmsPath, "utf8");
const blogList = sortedDesc.map((p) =>
  `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`
).join("\n");
const blogBlock = `\n### Blog posts\n${blogList}\n`;
// Insert blogBlock right after the existing Blog line in Resources section
if (llms.includes("### Blog posts")) {
  llms = llms.replace(/\n### Blog posts\n[\s\S]*?(?=\n## |\n#[^#])/, blogBlock + "\n");
} else {
  llms = llms.replace(
    /(- \[Blog\]\(https:\/\/auditee\.site\/blog\)[^\n]*\n)/,
    `$1${blogBlock}`,
  );
}
writeFileSync(llmsPath, llms);

// ---------- llms-full.txt: rebuild Blog section ----------
const llmsFullPath = resolve(PUB_DIR, "llms-full.txt");
let llmsFull = readFileSync(llmsFullPath, "utf8");
const today = new Date().toISOString().slice(0, 10);

const blogFullEntries = sortedDesc.map((p) => {
  const dateLine = p.updated && p.updated !== p.date
    ? `Date: ${p.date.slice(0, 10)} (updated ${p.updated.slice(0, 10)})`
    : `Date: ${p.date.slice(0, 10)}`;
  return `## ${p.title}
URL: ${SITE}/blog/${p.slug}
${dateLine}
Author: ${p.author}
Tags: ${p.tags.join(", ")}
Reading time: ${p.readingTimeMin} min

${p.excerpt}

${p.body}

---`;
}).join("\n\n");

const blogFullSection = `# Blog (${sortedDesc.length} posts)

${blogFullEntries}
`;

// Replace from "# Blog (...)" header through end of file (Blog is the last section)
const blogHeaderMatch = llmsFull.match(/^# Blog \(\d+ posts?\)/m);
if (blogHeaderMatch && blogHeaderMatch.index !== undefined) {
  llmsFull = llmsFull.slice(0, blogHeaderMatch.index) + blogFullSection;
} else {
  llmsFull += "\n\n" + blogFullSection;
}
// Refresh "Last generated" header line if present
llmsFull = llmsFull.replace(/^# Last generated: \d{4}-\d{2}-\d{2}/m, `# Last generated: ${today}`);
writeFileSync(llmsFullPath, llmsFull);

console.log(`✅ Regenerated SEO feeds for ${sortedDesc.length} blog posts`);
console.log(`   sitemap.xml      — ${sortedDesc.length} blog URLs`);
console.log(`   rss.xml          — ${sortedDesc.length} items`);
console.log(`   atom.xml         — ${sortedDesc.length} entries`);
console.log(`   feed.json        — ${sortedDesc.length} items`);
console.log(`   sitemap-news.xml — ${newsItems.split("<url>").length - 1} items (last 30d)`);
console.log(`   llms.txt         — Blog posts section refreshed`);
console.log(`   llms-full.txt    — Full content for ${sortedDesc.length} posts`);
