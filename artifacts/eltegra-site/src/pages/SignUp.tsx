import { SignUp } from "@clerk/react";
import { SEO } from "@/components/SEO";
import { ClerkLoadGate } from "@/components/ClerkLoadGate";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function SignUpPage() {
  return (
    <>
      <SEO
        title="Create your account"
        description="Create your Auditee workspace and start your free plan."
        path="/sign-up"
        noindex
      />
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
        <ClerkLoadGate>
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
            forceRedirectUrl={`${basePath}/app/billing`}
            signInForceRedirectUrl={`${basePath}/app/billing`}
          />
        </ClerkLoadGate>
      </div>
    </>
  );
}
