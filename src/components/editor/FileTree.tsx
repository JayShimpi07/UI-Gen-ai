"use client";

import { useState } from "react";
import { FileNode } from "@/lib/file-system";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileType,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jsx':
    case 'tsx':
      return <FileCode className="h-4 w-4 shrink-0 text-emerald-400" />;
    case 'ts':
    case 'js':
      return <FileCode className="h-4 w-4 shrink-0 text-yellow-400" />;
    case 'css':
      return <FileType className="h-4 w-4 shrink-0 text-blue-400" />;
    case 'json':
      return <FileText className="h-4 w-4 shrink-0 text-orange-400" />;
    case 'md':
      return <FileText className="h-4 w-4 shrink-0 text-white/40" />;
    default:
      return <FileText className="h-4 w-4 shrink-0 text-white/30" />;
  }
}

function FileTreeNode({ node, level }: FileTreeNodeProps) {
  const { selectedFile, openFile } = useFileSystem();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleClick = () => {
    if (node.type === "directory") {
      setIsExpanded(!isExpanded);
    } else {
      openFile(node.path);
    }
  };

  const children =
    node.type === "directory" && node.children
      ? Array.from(node.children.values()).sort((a, b) => {
          // Directories first, then files
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        })
      : [];

  const isSelected = selectedFile === node.path;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm transition-all duration-150 rounded-md mx-1 my-0.5",
          isSelected
            ? "bg-indigo-500/15 text-indigo-300"
            : "text-white/55 hover:bg-white/[0.04] hover:text-white/80"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {/* Accent bar for selected file */}
        {isSelected && node.type === "file" && (
          <div className="absolute left-0 w-[2px] h-5 rounded-r-full bg-indigo-500" />
        )}
        {node.type === "directory" ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/30" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-indigo-400" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-indigo-400/70" />
            )}
          </>
        ) : (
          <>
            <div className="w-3.5" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {node.type === "directory" && isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <FileTreeNode key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree() {
  const { fileSystem, refreshTrigger } = useFileSystem();
  const rootNode = fileSystem.getNode("/");

  if (!rootNode || !rootNode.children || rootNode.children.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Folder className="h-10 w-10 text-white/10 mb-3" />
        <p className="text-sm text-white/30 font-medium">No files yet</p>
        <p className="text-xs text-white/20 mt-1">Files will appear here</p>
      </div>
    );
  }

  const rootChildren = Array.from(rootNode.children.values()).sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <ScrollArea className="h-full">
      <div className="py-2" key={refreshTrigger}>
        <div className="px-3 pb-2 pt-1">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">Files</p>
        </div>
        {rootChildren.map((child) => (
          <FileTreeNode key={child.path} node={child} level={0} />
        ))}
      </div>
    </ScrollArea>
  );
}
