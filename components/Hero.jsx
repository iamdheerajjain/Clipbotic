"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Authentication from "@/components/Authentication";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useAuthContext } from "@/app/providers";
import { useRouter } from "next/navigation";

export default function Hero() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center relative animate-fade-in pt-16">
      <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
        <div className="absolute inset-0 bg-[radial-gradient(800px_400px_at_20%_10%,color-mix(in_oklab,var(--brand-from)_18%,transparent),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_450px_at_80%_20%,color-mix(in_oklab,var(--brand-to)_16%,transparent),transparent_60%)]" />
      </div>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight">
            <span className="bg-clip-text text-transparent bg-[linear-gradient(135deg,var(--brand-from),var(--brand-to))]">
              Create Stunning Short Videos
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Generate AI-crafted YouTube shorts in seconds with premium visuals,
            voice and captions.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 animate-slide-up">
          {!loading && (
            <>
              {!user ? (
                // Show "Get Started" for non-authenticated users
                <Authentication>
                  <Button size="lg" className="w-full sm:w-80 px-8">
                    Get Started
                  </Button>
                </Authentication>
              ) : (
                // Show "Go to Dashboard" for authenticated users
                <Button
                  size="lg"
                  className="w-full sm:w-80 px-8"
                  onClick={handleGoToDashboard}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </>
          )}

          <a
            href="#why-clipbotic"
            className="inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="h-6 w-6" />
          </a>
        </div>
      </div>
    </section>
  );
}
