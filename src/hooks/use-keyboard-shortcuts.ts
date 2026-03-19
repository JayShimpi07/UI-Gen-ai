"use client";

import { useEffect } from "react";

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      let key = "";

      // Map key combinations
      if (e.key === "k" || e.key === "K") key = "ctrl+k";
      else if (e.key === "s" || e.key === "S") key = "ctrl+s";
      else if (e.key === "1") key = "ctrl+1";
      else if (e.key === "2") key = "ctrl+2";
      else if (e.key === "e" || e.key === "E") key = "ctrl+e";
      else if (e.key === "Enter") key = "ctrl+enter";

      if (key && shortcuts[key]) {
        e.preventDefault();
        e.stopPropagation();
        shortcuts[key]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
