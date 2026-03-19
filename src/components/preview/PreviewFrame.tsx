"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import {
  createImportMap,
  createPreviewHTML,
} from "@/lib/transform/jsx-transformer";
import { AlertCircle, Zap, Wand2 } from "lucide-react";
import { ConsoleEntry } from "./ConsolePanel";

interface PreviewFrameProps {
  viewportWidth?: number;
  onConsoleEntry?: (entry: ConsoleEntry) => void;
  onError?: (error: string, fileName?: string) => void;
}

export function PreviewFrame({ viewportWidth, onConsoleEntry, onError }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { getAllFiles, refreshTrigger } = useFileSystem();
  const [error, setError] = useState<string | null>(null);
  const [entryPoint, setEntryPoint] = useState<string>("/App.jsx");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for messages from iframe (console logs, errors)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "console") {
        onConsoleEntry?.({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          level: event.data.level || "log",
          message: event.data.message || "",
          timestamp: Date.now(),
        });
      } else if (event.data?.type === "runtime-error") {
        const errMsg = event.data.message || "Unknown runtime error";
        onError?.(errMsg, event.data.filename);
        onConsoleEntry?.({
          id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          level: "error",
          message: errMsg,
          timestamp: Date.now(),
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConsoleEntry, onError]);

  const updatePreview = useCallback(() => {
    try {
      const files = getAllFiles();

      if (files.size > 0 && error) {
        setError(null);
      }

      let foundEntryPoint = entryPoint;
      const possibleEntries = [
        "/App.jsx", "/App.tsx", "/index.jsx", "/index.tsx",
        "/src/App.jsx", "/src/App.tsx",
      ];

      if (!files.has(entryPoint)) {
        const found = possibleEntries.find((path) => files.has(path));
        if (found) {
          foundEntryPoint = found;
          setEntryPoint(found);
        } else if (files.size > 0) {
          const firstJSX = Array.from(files.keys()).find(
            (path) => path.endsWith(".jsx") || path.endsWith(".tsx")
          );
          if (firstJSX) {
            foundEntryPoint = firstJSX;
            setEntryPoint(firstJSX);
          }
        }
      }

      if (files.size === 0) {
        if (isFirstLoad) {
          setError("firstLoad");
        } else {
          setError("No files to preview");
        }
        return;
      }

      if (isFirstLoad) {
        setIsFirstLoad(false);
      }

      if (!foundEntryPoint || !files.has(foundEntryPoint)) {
        setError("No React component found. Create an App.jsx or index.jsx file to get started.");
        return;
      }

      const { importMap, styles, errors } = createImportMap(files);
      const previewHTML = createPreviewHTML(foundEntryPoint, importMap, styles, errors);

      // Inject console interceptor + error handler into the HTML
      const consoleInterceptor = `
<script>
(function() {
  const origConsole = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  function send(level, args) {
    try {
      const msg = Array.from(args).map(a => {
        if (a && a.message) return a.stack || a.message || String(a);
        if (typeof a === 'object') {
          try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); }
        }
        return String(a);
      }).join(' ');
      window.parent.postMessage({ type: 'console', level, message: msg }, '*');
    } catch(e) {}
    origConsole[level].apply(console, args);
  }
  console.log = function() { send('log', arguments); };
  console.warn = function() { send('warn', arguments); };
  console.error = function() { send('error', arguments); };
  console.info = function() { send('info', arguments); };
  window.onerror = function(msg, url, line, col, err) {
    window.parent.postMessage({ type: 'runtime-error', message: msg + (line ? ' (line ' + line + ')' : ''), filename: url }, '*');
  };
  window.addEventListener('unhandledrejection', function(e) {
    window.parent.postMessage({ type: 'runtime-error', message: 'Unhandled Promise: ' + (e.reason?.message || e.reason || 'Unknown') }, '*');
  });
})();
</script>`;

      const enhancedHTML = previewHTML.replace("<head>", "<head>" + consoleInterceptor);

      if (iframeRef.current) {
        const iframe = iframeRef.current;
        iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
        iframe.srcdoc = enhancedHTML;
        setError(null);
      }
    } catch (err) {
      console.error("Preview error:", err);
      setError(err instanceof Error ? err.message : "Unknown preview error");
    }
  }, [getAllFiles, entryPoint, error, isFirstLoad]);

  // Debounced preview updates (300ms)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      updatePreview();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [refreshTrigger, updatePreview]);

  if (error) {
    if (error === "firstLoad") {
      return (
        <div className="h-full flex items-center justify-center p-8 bg-[#08080f]">
          <div className="text-center max-w-md animate-fade-in-up">
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 blur-2xl opacity-30 animate-pulse-glow" />
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-2xl shadow-indigo-500/25">
                <Zap className="h-7 w-7 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white/90 mb-2">Welcome to UIGen</h3>
            <p className="text-sm text-white/40 mb-1 leading-relaxed">Start building React components with AI assistance</p>
            <p className="text-xs text-white/25">Ask the AI to create your first component to see it live here</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex items-center justify-center p-8 bg-[#08080f]">
        <div className="text-center max-w-md animate-fade-in-up">
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-full bg-red-500/10 blur-xl" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/15">
              <AlertCircle className="h-7 w-7 text-red-400/70" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white/80 mb-2">No Preview Available</h3>
          <p className="text-sm text-white/40">{error}</p>
          <p className="text-xs text-white/25 mt-2">Start by creating a React component using the AI assistant</p>
        </div>
      </div>
    );
  }

  const iframeStyle: React.CSSProperties = viewportWidth
    ? { width: `${viewportWidth}px`, maxWidth: "100%", margin: "0 auto", height: "100%" }
    : { width: "100%", height: "100%" };

  return (
    <div className="h-full flex justify-center bg-[#08080f]">
      <iframe
        ref={iframeRef}
        className="border-0 bg-white transition-all duration-300"
        style={iframeStyle}
        title="Preview"
      />
    </div>
  );
}
