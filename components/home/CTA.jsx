"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Authentication from "@/components/Authentication";

export default function CTA() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <div className="space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-[linear-gradient(135deg,var(--brand-from),var(--brand-to))]">
              Start creating premium shorts today
            </span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Log in with Google and generate your first AI‑powered short in
            minutes.
          </p>
          <div className="flex justify-center pt-4">
            <Authentication>
              <Button size="lg" className="px-8 py-3 text-lg">
                Get Started
              </Button>
            </Authentication>
          </div>
        </div>
      </div>
    </section>
  );
}
