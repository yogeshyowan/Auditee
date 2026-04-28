import { Link } from "wouter";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";
import { POSTS, allTags } from "@/content/blog";
import { SEO, SITE_URL, breadcrumbsLd } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";

export default function Blog() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tags = useMemo(() => allTags(), []);
  const visible = useMemo(
    () => (activeTag ? POSTS.filter((p) => p.tags.includes(activeTag)) : POSTS),
    [activeTag],
  );

  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Auditee Blog",
    url: `${SITE_URL}/blog`,
    description:
      "Practitioner research on AI-native requirements management, compliance automation, audit, and software lifecycle modernization.",
    blogPost: POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.date,
      dateModified: p.updated ?? p.date,
      author: { "@type": "Person", name: p.author },
      keywords: p.tags.join(", "),
    })),
  };

  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title="Blog — AI Requirements, Compliance & Audit Insights"
        description="Auditee's research blog on AI-native requirements management, compliance automation (HIPAA, IEC 62304, SOC 2, ISO 27001, ASPICE), audit workflows, and legacy modernization."
        path="/blog"
        keywords={[
          "AI requirements management blog",
          "compliance automation blog",
          "audit automation",
          "HIPAA compliance",
          "IEC 62304",
          "SOC 2",
          "ISO 27001",
          "DOORS alternatives",
          "legacy modernization",
        ]}
        jsonLd={[
          blogLd,
          breadcrumbsLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />
      <Navigation />
      <main className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <header className="mb-12 max-w-3xl">
          <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">Blog</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Practitioner research on AI-native PDLC
          </h1>
          <p className="text-lg text-slate-600">
            Buyer's guides, standards walkthroughs, modernization playbooks, and field notes from teams shipping
            requirements, compliance and audit work end-to-end with Auditee.
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-10" data-testid="blog-tag-filter">
          <button
            onClick={() => setActiveTag(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !activeTag
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
            }`}
            data-testid="tag-all"
          >
            All posts
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeTag === t
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
              }`}
              data-testid={`tag-${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {visible.map((p) => (
            <article
              key={p.slug}
              className="group border border-slate-200 rounded-xl p-6 hover:border-primary/40 hover:shadow-lg transition-all bg-white"
              data-testid={`blog-card-${p.slug}`}
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {p.tags.slice(0, 3).map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px] font-normal">
                    <Tag className="h-2.5 w-2.5 mr-1" />
                    {t}
                  </Badge>
                ))}
              </div>
              <h2 className="font-display text-xl font-semibold text-slate-900 mb-3 leading-tight group-hover:text-primary transition-colors">
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </h2>
              <p className="text-sm text-slate-600 mb-4 line-clamp-3">{p.excerpt}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <time dateTime={p.date}>
                      {new Date(p.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {p.readingTimeMin} min read
                  </span>
                </div>
                <Link
                  href={`/blog/${p.slug}`}
                  className="inline-flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all"
                  data-testid={`blog-link-${p.slug}`}
                >
                  Read <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {visible.length === 0 && (
          <p className="text-slate-500 text-sm">No posts match this filter yet.</p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
