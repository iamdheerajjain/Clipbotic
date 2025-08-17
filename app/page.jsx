"use client";
import { Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";
import CTA from "@/components/home/CTA";
import Footer from "@/components/home/Footer";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 lg:px-12">
        <Header />
        <Suspense fallback={<LoadingSpinner />}>
          <Hero />
          <Features />
          <HowItWorks />
          <CTA />
          <Footer />
        </Suspense>
      </div>
    </div>
  );
}
