"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileSystemProvider } from "@/lib/contexts/file-system-context";
import { ChatProvider } from "@/lib/contexts/chat-context";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { FileTree } from "@/components/editor/FileTree";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { PreviewFrame } from "@/components/preview/PreviewFrame";
import { ConsolePanel, ConsoleEntry } from "@/components/preview/ConsolePanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeaderActions } from "@/components/HeaderActions";
import { CommandPalette } from "@/components/CommandPalette";
import { ExportDialog } from "@/components/ExportDialog";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useToast } from "@/components/ui/toaster";
import {
  Sparkles,
  Eye,
  Code2,
  Download,
  Monitor,
  Tablet,
  Smartphone,
  Terminal,
} from "lucide-react";

interface MainContentProps {
  user?: {
    id: string;
    email: string;
  } | null;
  project?: {
    id: string;
    name: string;
    messages: any[];
    data: any;
    createdAt: Date;
    updatedAt: Date;
  };
}

type ViewportSize = "desktop" | "tablet" | "mobile";

const viewportWidths: Record<ViewportSize, number | undefined> = {
  desktop: undefined,
  tablet: 768,
  mobile: 375,
};

export function MainContent({ user, project }: MainContentProps) {
  const [activeView, setActiveView] = useState<"preview" | "code">("preview");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const { toast } = useToast();

  // Console handlers
  const handleConsoleEntry = useCallback((entry: ConsoleEntry) => {
    setConsoleEntries((prev) => [...prev.slice(-200), entry]); // Keep last 200
  }, []);

  const handleClearConsole = useCallback(() => {
    setConsoleEntries([]);
  }, []);

  const handlePreviewError = useCallback(
    (error: string) => {
      // Auto-open console on error
      if (!consoleOpen) setConsoleOpen(true);
    },
    [consoleOpen]
  );

  // Command palette action handler
  const handleCommandAction = useCallback(
    (action: string) => {
      switch (action) {
        case "switch-preview":
          setActiveView("preview");
          break;
        case "switch-code":
          setActiveView("code");
          break;
        case "toggle-console":
          setConsoleOpen((prev) => !prev);
          break;
        case "viewport-desktop":
          setViewport("desktop");
          toast({ title: "Desktop viewport", variant: "default" });
          break;
        case "viewport-tablet":
          setViewport("tablet");
          toast({ title: "Tablet viewport (768px)", variant: "default" });
          break;
        case "viewport-mobile":
          setViewport("mobile");
          toast({ title: "Mobile viewport (375px)", variant: "default" });
          break;
        case "export":
          setExportDialogOpen(true);
          break;
        case "shortcuts":
          toast({
            title: "Keyboard Shortcuts",
            description: "Ctrl+K: Commands • Ctrl+1/2: Preview/Code • Ctrl+S: Save",
            duration: 5000,
          });
          break;
        default:
          break;
      }
    },
    [toast]
  );

  // Keyboard shortcuts
  const shortcuts = useMemo(
    () => ({
      "ctrl+k": () => setCommandPaletteOpen(true),
      "ctrl+1": () => setActiveView("preview"),
      "ctrl+2": () => setActiveView("code"),
      "ctrl+s": () => toast({ title: "Saved", variant: "success", duration: 1500 }),
      "ctrl+e": () => {
        // Focus chat input
        const input = document.querySelector("textarea");
        input?.focus();
      },
    }),
    [toast]
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <FileSystemProvider initialData={project?.data}>
      <ChatProvider projectId={project?.id} initialMessages={project?.messages}>
        <div className="h-screen w-screen overflow-hidden bg-[#08080f]">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Chat */}
            <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
              <div className="h-full flex flex-col bg-[#0c0c18] relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.03] via-transparent to-purple-500/[0.02] pointer-events-none" />

                {/* Chat Header */}
                <div className="h-14 flex items-center gap-3 px-5 border-b border-white/[0.06] relative z-10 backdrop-blur-sm">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-primary shadow-lg shadow-indigo-500/20">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-[15px] font-semibold text-white/90 tracking-tight leading-tight">
                      UIGen
                    </h1>
                    <p className="text-[11px] text-white/40 leading-tight">
                      AI Component Builder
                    </p>
                  </div>
                </div>

                {/* Chat Content */}
                <div className="flex-1 overflow-hidden relative z-10">
                  <ChatInterface />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle className="w-[2px] bg-white/[0.04] hover:bg-indigo-500/30 transition-all duration-300 hover:shadow-[0_0_12px_rgba(99,102,241,0.3)]" />

            {/* Right Panel - Preview/Code */}
            <ResizablePanel defaultSize={65}>
              <div className="h-full flex flex-col bg-[#0a0a14]">
                {/* Top Bar */}
                <div className="h-14 border-b border-white/[0.06] px-5 flex items-center justify-between bg-[#0c0c18]/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Tabs
                      value={activeView}
                      onValueChange={(v) =>
                        setActiveView(v as "preview" | "code")
                      }
                    >
                      <TabsList className="glass-light p-0.5 h-9 rounded-lg">
                        <TabsTrigger
                          value="preview"
                          className="data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm text-white/40 px-4 py-1.5 text-sm font-medium transition-all rounded-md gap-2"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Preview
                        </TabsTrigger>
                        <TabsTrigger
                          value="code"
                          className="data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm text-white/40 px-4 py-1.5 text-sm font-medium transition-all rounded-md gap-2"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          Code
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {/* Preview-specific controls */}
                    {activeView === "preview" && (
                      <div className="flex items-center gap-1 ml-2">
                        {(
                          [
                            { id: "desktop" as ViewportSize, icon: Monitor, label: "Desktop" },
                            { id: "tablet" as ViewportSize, icon: Tablet, label: "Tablet" },
                            { id: "mobile" as ViewportSize, icon: Smartphone, label: "Mobile" },
                          ] as const
                        ).map(({ id, icon: Icon, label }) => (
                          <button
                            key={id}
                            onClick={() => setViewport(id)}
                            className={`p-1.5 rounded-md transition-all ${
                              viewport === id
                                ? "bg-white/10 text-white/80"
                                : "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"
                            }`}
                            title={label}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </button>
                        ))}

                        <div className="w-px h-4 bg-white/[0.06] mx-1" />

                        <button
                          onClick={() => setConsoleOpen((p) => !p)}
                          className={`p-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                            consoleOpen
                              ? "bg-white/10 text-white/80"
                              : "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"
                          }`}
                          title="Toggle Console"
                        >
                          <Terminal className="h-3.5 w-3.5" />
                          {consoleEntries.filter((e) => e.level === "error")
                            .length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExportDialogOpen(true)}
                      className="p-1.5 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                      title="Export project"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <HeaderActions user={user} projectId={project?.id} />
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden bg-[#08080f] flex flex-col">
                  {activeView === "preview" ? (
                    <>
                      <div className="flex-1 overflow-hidden">
                        <PreviewFrame
                          viewportWidth={viewportWidths[viewport]}
                          onConsoleEntry={handleConsoleEntry}
                          onError={handlePreviewError}
                        />
                      </div>
                      <ConsolePanel
                        entries={consoleEntries}
                        onClear={handleClearConsole}
                        isOpen={consoleOpen}
                        onToggle={() => setConsoleOpen((p) => !p)}
                      />
                    </>
                  ) : (
                    <ResizablePanelGroup
                      direction="horizontal"
                      className="h-full"
                    >
                      {/* File Tree */}
                      <ResizablePanel
                        defaultSize={30}
                        minSize={20}
                        maxSize={50}
                      >
                        <div className="h-full bg-[#0c0c18] border-r border-white/[0.06]">
                          <FileTree />
                        </div>
                      </ResizablePanel>

                      <ResizableHandle className="w-[2px] bg-white/[0.04] hover:bg-indigo-500/30 transition-all duration-300" />

                      {/* Code Editor */}
                      <ResizablePanel defaultSize={70}>
                        <div className="h-full bg-[#0d1117]">
                          <CodeEditor />
                        </div>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>

          {/* Overlays */}
          <CommandPalette
            open={commandPaletteOpen}
            onOpenChange={setCommandPaletteOpen}
            onAction={handleCommandAction}
          />
          <ExportDialog
            open={exportDialogOpen}
            onOpenChange={setExportDialogOpen}
          />
        </div>
      </ChatProvider>
    </FileSystemProvider>
  );
}
