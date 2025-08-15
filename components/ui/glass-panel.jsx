"use client";
import React from "react";
import { cn } from "@/lib/utils";

function GlassPanel({ className, children }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card/70 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export default GlassPanel;
