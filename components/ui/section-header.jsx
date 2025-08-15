"use client";
import React from "react";
import { cn } from "@/lib/utils";

function SectionHeader({ title, subtitle, actions = null, className }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-[linear-gradient(135deg,var(--brand-from),var(--brand-to))]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export default SectionHeader;
