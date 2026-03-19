"use client";

import { useEffect, useRef, lazy, Suspense } from "react";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import { Code2, X, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

const Editor = lazy(() => import("@monaco-editor/react"));

function EditorSkeleton() {
  return (
    <div className="h-full bg-[#0d1117] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500/60 rounded-full animate-spin" />
      <p className="text-xs text-white/20">Loading editor...</p>
    </div>
  );
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jsx":
    case "tsx":
      return "text-emerald-400";
    case "ts":
    case "js":
      return "text-yellow-400";
    case "css":
      return "text-blue-400";
    case "json":
      return "text-orange-400";
    default:
      return "text-white/30";
  }
}

export function CodeEditor() {
  const { selectedFile, openFiles, openFile, closeFile, setSelectedFile, getFileContent, updateFile } = useFileSystem();
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (selectedFile && value !== undefined) {
      updateFile(selectedFile, value);
    }
  };

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "js":
      case "jsx":
        return "javascript";
      case "ts":
      case "tsx":
        return "typescript";
      case "json":
        return "json";
      case "css":
        return "css";
      case "html":
        return "html";
      case "md":
        return "markdown";
      default:
        return "plaintext";
    }
  };

  const handleCloseTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    closeFile(path);
  };

  const handleMiddleClick = (e: React.MouseEvent, path: string) => {
    if (e.button === 1) {
      e.preventDefault();
      closeFile(path);
    }
  };

  if (openFiles.length === 0 && !selectedFile) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0d1117]">
        <div className="text-center">
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 rounded-xl bg-indigo-500/10 blur-xl" />
            <div className="relative p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Code2 className="h-8 w-8 text-white/15" />
            </div>
          </div>
          <p className="text-sm text-white/30 font-medium">Select a file to edit</p>
          <p className="text-xs text-white/15 mt-1">Choose a file from the file tree</p>
        </div>
      </div>
    );
  }

  const content = selectedFile ? getFileContent(selectedFile) || "" : "";
  const language = selectedFile ? getLanguageFromPath(selectedFile) : "plaintext";

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Tab Bar */}
      {openFiles.length > 0 && (
        <div className="flex items-center h-9 bg-[#0a0a14] border-b border-white/[0.04] overflow-x-auto shrink-0">
          {openFiles.map((filePath) => {
            const fileName = filePath.split("/").pop() || filePath;
            const isActive = filePath === selectedFile;
            return (
              <button
                key={filePath}
                onClick={() => setSelectedFile(filePath)}
                onMouseDown={(e) => handleMiddleClick(e, filePath)}
                className={cn(
                  "flex items-center gap-1.5 px-3 h-full text-xs border-r border-white/[0.04] shrink-0 transition-colors group relative",
                  isActive
                    ? "bg-[#0d1117] text-white/80"
                    : "text-white/35 hover:text-white/55 hover:bg-white/[0.02]"
                )}
              >
                {isActive && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-indigo-500" />
                )}
                <FileCode className={`h-3 w-3 shrink-0 ${getFileIcon(fileName)}`} />
                <span className="truncate max-w-[100px]">{fileName}</span>
                <button
                  onClick={(e) => handleCloseTab(e, filePath)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/[0.08] transition-all ml-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </button>
            );
          })}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<EditorSkeleton />}>
          <Editor
            height="100%"
            language={language}
            value={content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            key={selectedFile}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
              wordWrap: "on",
              padding: { top: 16, bottom: 16 },
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}