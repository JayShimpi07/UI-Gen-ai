"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Terminal, Trash2, ChevronUp, ChevronDown, AlertCircle, Info, AlertTriangle } from "lucide-react";

export interface ConsoleEntry {
  id: string;
  level: "log" | "info" | "warn" | "error";
  message: string;
  timestamp: number;
}

interface ConsolePanelProps {
  entries: ConsoleEntry[];
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const levelConfig = {
  log: { icon: Terminal, color: "text-white/60", bg: "" },
  info: { icon: Info, color: "text-blue-400", bg: "" },
  warn: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/[0.03]" },
  error: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/[0.03]" },
};

export function ConsolePanel({ entries, onClear, isOpen, onToggle }: ConsolePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new entries
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, isOpen]);

  const errorCount = entries.filter((e) => e.level === "error").length;
  const warnCount = entries.filter((e) => e.level === "warn").length;

  return (
    <div className="border-t border-white/[0.06] bg-[#0a0a14] flex flex-col">
      {/* Header bar — always visible */}
      <button
        onClick={onToggle}
        className="h-8 px-3 flex items-center justify-between shrink-0 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-white/30" />
          <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Console</span>
          {errorCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">
              {errorCount} error{errorCount !== 1 ? "s" : ""}
            </span>
          )}
          {warnCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
              {warnCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isOpen && entries.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-1 rounded text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-colors"
              title="Clear console"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-white/20" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-white/20" />
          )}
        </div>
      </button>

      {/* Log entries */}
      {isOpen && (
        <div
          ref={scrollRef}
          className="h-[160px] overflow-y-auto font-mono text-xs"
        >
          {entries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-white/20 text-xs">
              No console output
            </div>
          ) : (
            entries.map((entry) => {
              const config = levelConfig[entry.level];
              const Icon = config.icon;
              return (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2 px-3 py-1.5 border-b border-white/[0.03] ${config.bg}`}
                >
                  <Icon className={`h-3 w-3 mt-0.5 shrink-0 ${config.color}`} />
                  <span className={`${config.color} whitespace-pre-wrap break-all leading-relaxed`}>
                    {entry.message}
                  </span>
                  <span className="text-white/15 shrink-0 ml-auto text-[10px]">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
