"use client";
import { useEffect } from "react";

export default function DevHardReload() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const KEY = "last_boot_id";
    let aborted = false;
    fetch("/api/boot-id")
      .then((r) => r.json())
      .then(({ bootId }) => {
        if (aborted) return;
        try {
          const prev = localStorage.getItem(KEY);
          if (prev !== bootId) {
            localStorage.setItem(KEY, bootId);
            location.reload();
          }
        } catch {}
      })
      .catch(() => {});
    return () => {
      aborted = true;
    };
  }, []);
  return null;
}
