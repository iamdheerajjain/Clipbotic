"use client";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";
import CTA from "@/components/home/CTA";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 lg:px-12">
        <Header />
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
        <Footer />
      </div>
    </div>
  );
}
