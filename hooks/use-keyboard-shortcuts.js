"use client";
import { useEffect } from "react";

export function useKeyboardShortcuts({
  onGenerateVideo,
  onSave,
  onUndo,
  onRedo,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + Enter to generate video
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        onGenerateVideo?.();
      }

      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        onSave?.();
      }

      // Ctrl/Cmd + Z to undo
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        onUndo?.();
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y to redo
      if (
        (event.ctrlKey || event.metaKey) &&
        ((event.shiftKey && event.key === "z") || event.key === "y")
      ) {
        event.preventDefault();
        onRedo?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onGenerateVideo, onSave, onUndo, onRedo]);
}
