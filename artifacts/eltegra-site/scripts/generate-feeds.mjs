#!/usr/bin/env node
// Generates /public/rss.xml and /public/llms-full.txt from the blog content.
// Run via: pnpm --filter @workspace/eltegra-site run generate:feeds
import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const BLOG_DIR = resolve(ROOT, "src/content/blog");
const PUBLIC_DIR = resolve(ROOT, "public");
const SITE_URL = "https://auditee.site";

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function pickField(src, field) {
  // Match  field: "value"  or  field: 'value'  or  field: `value`
  const reStr = new RegExp(`\\b${field}\\s*:\\s*(["\\'\`])([\\s\\S]*?)\\1`, "m");
  const m = src.match(reStr);
  if (m) return m[2];
  return undefined;
}

function pickArray(src, field) {
  const re = new RegExp(`\\b${field}\\s*:\\s*\\[([\\s\\S]*?)\\]`, "m");
  const m = src.match(re);
  if (!m) return [];
  return [...m[1].matchAll(/(["'`])([^"'`]+)\1/g)].map((x) => x[2]);
}

function pickNumber(src, field) {
  const re = new RegExp(`\\b${field}\\s*:\\s*([0-9]+)`, "m");
  const m = src.match(re);
  return m ? Number(m[1]) : undefined;
}

async function loadPosts() {
  const files = (await readdir(BLOG_DIR)).filter(
    (f) => f.endsWith(".ts") && f !== "index.ts",
  );
  const posts = [];
  for (const f of files) {
    const src = await readFile(resolve(BLOG_DIR, f), "utf8");
    const post = {
      slug: pickField(src, "slug"),
      title: pickField(src, "title"),
      description: pickField(src, "description"),
      date: pickField(src, "date"),
      updated: pickField(src, "updated"),
      author: pickField(src, "author"),
      tags: pickArray(src, "tags"),
      readingTimeMin: pickNumber(src, "readingTimeMin"),
      excerpt: pickField(src, "excerpt"),
    };
    if (!post.slug || !post.title || !post.date) {
      console.warn(`[generate-feeds] Skipping ${f}: missing required field`);
      continue;
    }
    posts.push(post);
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}

function rfc822(iso) {
  return new Date(iso).toUTCString();
}

function buildRss(posts) {
  const lastBuild = rfc822(posts[0]?.date ?? new Date().toISOString());
  const items = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <description>${escapeXml(p.description ?? p.excerpt ?? "")}</description>
      <author>noreply@auditee.site (${escapeXml(p.author ?? "Auditee")})</author>
${(p.tags ?? []).map((t) => `      <category>${escapeXml(t)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Auditee Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Practitioner research on AI-native requirements management, compliance automation, audit, and software lifecycle modernization.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <generator>Auditee RSS generator</generator>
${items}
  </channel>
</rss>
`;
}

function buildLlmsFull(posts) {
  const header = `# Auditee — Full Content (llms-full.txt)
# Site: ${SITE_URL}
# Last generated: ${new Date().toISOString().slice(0, 10)}
# Convention: https://llmstxt.org
#
# This file consolidates the long-form public content of Auditee for
# convenient ingestion by AI answer engines. The signed-in product at /app/*
# is private and is NOT included.

`;
  const blog = posts
    .map(
      (p) => `## ${p.title}
URL: ${SITE_URL}/blog/${p.slug}
Date: ${p.date}${p.updated ? ` (updated ${p.updated})` : ""}
Author: ${p.author ?? "Auditee"}
Tags: ${(p.tags ?? []).join(", ")}
Reading time: ${p.readingTimeMin ?? "?"} min

${p.excerpt ?? p.description ?? ""}
`,
    )
    .join("\n---\n\n");
  return `${header}# Blog (${posts.length} posts)\n\n${blog}\n`;
}

const posts = await loadPosts();
await writeFile(resolve(PUBLIC_DIR, "rss.xml"), buildRss(posts));
await writeFile(resolve(PUBLIC_DIR, "llms-full.txt"), buildLlmsFull(posts));
console.log(
  `[generate-feeds] Wrote rss.xml and llms-full.txt with ${posts.length} blog posts`,
);
