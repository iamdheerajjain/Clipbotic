"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    title: "Describe your topic",
    desc: "Tell the AI what to create. Choose style and preferred voice.",
  },
  {
    step: "02",
    title: "Generate assets",
    desc: "We craft script, voiceover, visuals, and captions automatically.",
  },
  {
    step: "03",
    title: "Render & export",
    desc: "Preview in the browser and download the final MP4 in one click.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 md:mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-[linear-gradient(135deg,var(--brand-from),var(--brand-to))]">
            How it works
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            From idea to polished short in minutes
          </p>
        </div>

        <div className="grid gap-4 md:gap-5">
          {steps.map((s, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start gap-5">
                  <div className="shrink-0 text-[--brand-from] text-xl md:text-2xl font-semibold">
                    {s.step}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base md:text-lg font-medium">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
