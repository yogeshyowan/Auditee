import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

export default function NotFound() {
  return (
    <>
      <SEO
        title="Page not found"
        description="The page you were looking for doesn't exist."
        path="/404"
        noindex
      />
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">404 — Page Not Found</h1>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              The page you were looking for doesn&apos;t exist or has moved.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Back to home
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/features">Explore features</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/blog">Read the blog</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
