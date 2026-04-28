import { Link, useRoute } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Calendar, Clock, User, Tag } from "lucide-react";
import { getPost, getRelatedPosts } from "@/content/blog";
import { SEO, articleLd, breadcrumbsLd, DEFAULT_OG_IMAGE, SITE_URL } from "@/components/SEO";
import { Navigation, SiteFooter } from "@/components/site/Chrome";
import { Badge } from "@/components/ui/badge";
import NotFound from "@/pages/not-found";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const post = params?.slug ? getPost(params.slug) : undefined;

  if (!post) return <NotFound />;

  const related = getRelatedPosts(post.slug, 3);

  return (
    <div className="theme-landing min-h-screen bg-white font-sans text-slate-900">
      <SEO
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        ogType="article"
        ogImage={post.heroImage ?? DEFAULT_OG_IMAGE}
        keywords={post.tags}
        publishedTime={post.date}
        modifiedTime={post.updated ?? post.date}
        author={post.author}
        articleTags={post.tags}
        jsonLd={[
          articleLd({
            title: post.title,
            description: post.description,
            slug: post.slug,
            image: post.heroImage ?? DEFAULT_OG_IMAGE,
            datePublished: post.date,
            dateModified: post.updated,
            authorName: post.author,
            tags: post.tags,
          }),
          breadcrumbsLd([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <Navigation />
      <main className="max-w-3xl mx-auto px-6 md:px-12 py-12 md:py-20">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary mb-8"
          data-testid="link-back-to-blog"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All articles
        </Link>

        <nav aria-label="Breadcrumb" className="text-xs text-slate-500 mb-6">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/blog" className="hover:text-primary">
                Blog
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-slate-700 truncate max-w-[200px] md:max-w-none" aria-current="page">
              {post.title}
            </li>
          </ol>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px] font-normal">
                <Tag className="h-2.5 w-2.5 mr-1" />
                {t}
              </Badge>
            ))}
          </div>
          <h1
            className="font-display text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-5 leading-tight"
            data-testid="text-blog-post-title"
          >
            {post.title}
          </h1>
          <p className="text-lg text-slate-600 mb-6">{post.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-y border-slate-200 py-4">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> {post.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {post.readingTimeMin} min read
            </span>
          </div>
        </header>

        <article
          className="prose prose-slate prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-table:text-sm"
          data-testid="blog-post-body"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown>
        </article>

        <hr className="my-16 border-slate-200" />

        <section aria-labelledby="cta-heading" className="bg-slate-50 border border-slate-200 rounded-xl p-8 mb-16">
          <h2 id="cta-heading" className="font-display text-xl font-semibold text-slate-900 mb-2">
            See Auditee in your stack
          </h2>
          <p className="text-slate-600 mb-5">
            Generate standards-aware requirements, run compliance audits, and close findings in one platform.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-md font-medium hover:bg-primary/90"
              data-testid="link-cta-demo"
            >
              Book a demo
            </Link>
            <Link
              href="/roi-calculator"
              className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-5 py-2.5 rounded-md font-medium hover:bg-white"
              data-testid="link-cta-roi"
            >
              ROI calculator
            </Link>
          </div>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="font-display text-2xl font-semibold text-slate-900 mb-6">
              Related reading
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="block border border-slate-200 rounded-lg p-5 hover:border-primary/40 transition-colors"
                  data-testid={`link-related-${r.slug}`}
                >
                  <h3 className="font-semibold text-slate-900 text-sm mb-2 leading-snug">{r.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{r.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />

      {/* Plain text URL exposed for crawlers as a redundant signal */}
      <div className="sr-only" aria-hidden="true">
        Permanent URL: {SITE_URL}/blog/{post.slug}
      </div>
    </div>
  );
}
