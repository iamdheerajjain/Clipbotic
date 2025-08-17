"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  AudioLines,
  Image as ImageIcon,
  Captions,
  Layers,
  Rocket,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI Script Generation",
    desc: "High‑quality, concise scripts tailored to your topic in seconds.",
  },
  {
    icon: AudioLines,
    title: "Premium Voiceovers",
    desc: "Studio‑grade voices with natural pacing and clarity.",
  },
  {
    icon: ImageIcon,
    title: "Cinematic Visuals",
    desc: "Auto‑generated images in multiple modern art styles.",
  },
  {
    icon: Captions,
    title: "Smart Captions",
    desc: "Auto captions timed to your voiceover for max engagement.",
  },
  {
    icon: Layers,
    title: "Remotion Engine",
    desc: "Smooth compositions powered by a robust rendering pipeline.",
  },
  {
    icon: Rocket,
    title: "One‑Click Export",
    desc: "Generate and download vertical MP4s optimized for Shorts.",
  },
];

export default function Features() {
  return (
    <section id="why-clipbotic" className="py-12 md:py-16 animate-fade-in">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-[linear-gradient(135deg,var(--brand-from),var(--brand-to))] mb-4">
            Why Clipbotic
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Create premium, vertical shorts faster than ever with AI‑powered
            tooling
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <Card key={idx} className="h-full group">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center justify-center size-12 rounded-xl border border-border bg-secondary group-hover:bg-secondary/80 transition-colors">
                      <Icon className="size-6 text-[--brand-from]" />
                    </div>
                    <CardTitle className="text-lg md:text-xl">
                      {f.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
