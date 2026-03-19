"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  FilePlus,
  Search,
  Eye,
  Code2,
  Download,
  Terminal,
  Plus,
  Keyboard,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: string, payload?: any) => void;
}

const actions = [
  { id: "switch-preview", label: "Switch to Preview", icon: Eye, group: "View" },
  { id: "switch-code", label: "Switch to Code", icon: Code2, group: "View" },
  { id: "toggle-console", label: "Toggle Console", icon: Terminal, group: "View" },
  { id: "viewport-desktop", label: "Desktop Viewport", icon: Monitor, group: "View" },
  { id: "viewport-tablet", label: "Tablet Viewport", icon: Tablet, group: "View" },
  { id: "viewport-mobile", label: "Mobile Viewport", icon: Smartphone, group: "View" },
  { id: "new-project", label: "New Project", icon: Plus, group: "Project" },
  { id: "export", label: "Export Project as ZIP", icon: Download, group: "Project" },
  { id: "create-file", label: "Create New File", icon: FilePlus, group: "Files" },
  { id: "search-files", label: "Search Files", icon: Search, group: "Files" },
  { id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard, group: "Help" },
];

export function CommandPalette({ open, onOpenChange, onAction }: CommandPaletteProps) {
  const handleSelect = useCallback(
    (actionId: string) => {
      onOpenChange(false);
      // Small delay so dialog closes before action runs
      setTimeout(() => onAction(actionId), 50);
    },
    [onAction, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 glass border-white/[0.08] bg-[#12122a]/95 backdrop-blur-2xl shadow-2xl shadow-black/50 max-w-[480px] overflow-hidden [&>button]:hidden">
        <Command className="bg-transparent">
          <div className="flex items-center border-b border-white/[0.06] px-3">
            <Search className="h-4 w-4 text-white/30 mr-2 shrink-0" />
            <CommandInput
              placeholder="Type a command or search..."
              className="h-12 text-white/90 placeholder:text-white/25 border-0 focus:ring-0"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/[0.04] px-1.5 font-mono text-[10px] text-white/30">
              ESC
            </kbd>
          </div>
          <CommandList className="max-h-[320px] p-2">
            <CommandEmpty className="text-white/30 text-sm py-8 text-center">
              No results found.
            </CommandEmpty>

            {["View", "Project", "Files", "Help"].map((group) => {
              const groupActions = actions.filter((a) => a.group === group);
              if (groupActions.length === 0) return null;
              return (
                <CommandGroup key={group} heading={group} className="[&_[cmdk-group-heading]]:text-white/25 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
                  {groupActions.map((action) => (
                    <CommandItem
                      key={action.id}
                      value={action.label}
                      onSelect={() => handleSelect(action.id)}
                      className="text-white/60 data-[selected=true]:bg-white/[0.06] data-[selected=true]:text-white/90 rounded-lg px-3 py-2.5 gap-3 cursor-pointer"
                    >
                      <action.icon className="h-4 w-4 text-white/30" />
                      <span className="text-sm">{action.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
