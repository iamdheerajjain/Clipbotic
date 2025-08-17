"use client";
import React from "react";
import { Loader2, Sparkles, Video, Music, Image } from "lucide-react";

export function LoadingOverlay({ isVisible, message = "Processing..." }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md mx-4 text-center">
        <div className="flex items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin text-[--brand-from]" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{message}</h3>
        <p className="text-muted-foreground mb-6">
          This may take a few minutes. Please don't close this page.
        </p>

        {/* Progress indicators */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Image className="w-4 h-4 text-green-500" />
            <span>Generating images...</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Music className="w-4 h-4 text-blue-500" />
            <span>Creating audio...</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Video className="w-4 h-4 text-purple-500" />
            <span>Rendering video...</span>
          </div>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          <Sparkles className="w-4 h-4 inline mr-1" />
          AI is working its magic!
        </div>
      </div>
    </div>
  );
}
