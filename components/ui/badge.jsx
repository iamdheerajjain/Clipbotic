"use client";
import React from "react";
import { cn } from "@/lib/utils";

function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-secondary text-secondary-foreground border border-border",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
