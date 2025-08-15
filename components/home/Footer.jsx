"use client";
import React from "react";

export default function Footer() {
  return (
    <footer className="py-10 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Clipbotic. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <a className="hover:text-foreground transition-colors" href="#">
            Privacy
          </a>
          <a className="hover:text-foreground transition-colors" href="#">
            Terms
          </a>
          <a className="hover:text-foreground transition-colors" href="#">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
