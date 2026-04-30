import { SignIn } from "@clerk/react";
import { SEO } from "@/components/SEO";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignInPage() {
  return (
    <>
      <SEO
        title="Sign in"
        description="Sign in to your Auditee workspace."
        path="/sign-in"
        noindex
      />
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          forceRedirectUrl={`${basePath}/app/billing`}
          signUpForceRedirectUrl={`${basePath}/app/billing`}
        />
      </div>
    </>
  );
}
