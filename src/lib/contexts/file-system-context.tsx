"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { VirtualFileSystem, FileNode } from "@/lib/file-system";

interface ToolCall {
  toolName: string;
  args: any;
}

interface FileSystemContextType {
  fileSystem: VirtualFileSystem;
  selectedFile: string | null;
  setSelectedFile: (path: string | null) => void;
  openFiles: string[];
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  createFile: (path: string, content?: string) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => boolean;
  getFileContent: (path: string) => string | null;
  getAllFiles: () => Map<string, string>;
  refreshTrigger: number;
  handleToolCall: (toolCall: ToolCall) => void;
  reset: () => void;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(
  undefined
);

export function FileSystemProvider({
  children,
  fileSystem: providedFileSystem,
  initialData,
}: {
  children: React.ReactNode;
  fileSystem?: VirtualFileSystem;
  initialData?: Record<string, any>;
}) {
  const [fileSystem] = useState(() => {
    const fs = providedFileSystem || new VirtualFileSystem();
    if (initialData) {
      fs.deserializeFromNodes(initialData);
    }
    return fs;
  });
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Open a file (add to tabs + select)
  const openFile = useCallback(
    (path: string) => {
      setOpenFiles((prev) => {
        if (prev.includes(path)) return prev;
        return [...prev, path];
      });
      setSelectedFile(path);
    },
    []
  );

  // Close a file tab
  const closeFile = useCallback(
    (path: string) => {
      setOpenFiles((prev) => {
        const updated = prev.filter((f) => f !== path);
        // If closing the selected file, select the next available
        if (selectedFile === path) {
          const idx = prev.indexOf(path);
          const next = updated[Math.min(idx, updated.length - 1)] || null;
          setSelectedFile(next);
        }
        return updated;
      });
    },
    [selectedFile]
  );

  // Auto-select and open first file
  useEffect(() => {
    if (!selectedFile) {
      const files = fileSystem.getAllFiles();
      if (files.has("/App.jsx")) {
        openFile("/App.jsx");
      } else {
        const rootFiles = Array.from(files.keys())
          .filter((path) => {
            const parts = path.split("/").filter(Boolean);
            return parts.length === 1;
          })
          .sort();

        if (rootFiles.length > 0) {
          openFile(rootFiles[0]);
        }
      }
    }
  }, [selectedFile, fileSystem, refreshTrigger, openFile]);

  const createFile = useCallback(
    (path: string, content: string = "") => {
      fileSystem.createFile(path, content);
      triggerRefresh();
    },
    [fileSystem, triggerRefresh]
  );

  const updateFile = useCallback(
    (path: string, content: string) => {
      fileSystem.updateFile(path, content);
      triggerRefresh();
    },
    [fileSystem, triggerRefresh]
  );

  const deleteFile = useCallback(
    (path: string) => {
      fileSystem.deleteFile(path);
      closeFile(path);
      triggerRefresh();
    },
    [fileSystem, closeFile, triggerRefresh]
  );

  const renameFile = useCallback(
    (oldPath: string, newPath: string): boolean => {
      const success = fileSystem.rename(oldPath, newPath);
      if (success) {
        // Update tabs
        setOpenFiles((prev) =>
          prev.map((f) => (f === oldPath ? newPath : f))
        );
        if (selectedFile === oldPath) {
          setSelectedFile(newPath);
        } else if (selectedFile && selectedFile.startsWith(oldPath + "/")) {
          const relativePath = selectedFile.substring(oldPath.length);
          setSelectedFile(newPath + relativePath);
        }
        triggerRefresh();
      }
      return success;
    },
    [fileSystem, selectedFile, triggerRefresh]
  );

  const getFileContent = useCallback(
    (path: string) => {
      return fileSystem.readFile(path);
    },
    [fileSystem]
  );

  const getAllFiles = useCallback(() => {
    return fileSystem.getAllFiles();
  }, [fileSystem]);

  const reset = useCallback(() => {
    fileSystem.reset();
    setSelectedFile(null);
    setOpenFiles([]);
    triggerRefresh();
  }, [fileSystem, triggerRefresh]);

  const handleToolCall = useCallback(
    (toolCall: ToolCall) => {
      const { toolName, args } = toolCall;

      // Handle str_replace_editor tool
      if (toolName === "str_replace_editor" && args) {
        const { command, path, file_text, old_str, new_str, insert_line } = args;

        switch (command) {
          case "create":
            if (path && file_text !== undefined) {
              const result = fileSystem.createFileWithParents(path, file_text);
              if (!result.startsWith("Error:")) {
                createFile(path, file_text);
                openFile(path);
              }
            }
            break;

          case "str_replace":
            if (path && old_str !== undefined && new_str !== undefined) {
              const result = fileSystem.replaceInFile(path, old_str, new_str);
              if (!result.startsWith("Error:")) {
                const content = fileSystem.readFile(path);
                if (content !== null) {
                  updateFile(path, content);
                }
              }
            }
            break;

          case "insert":
            if (path && new_str !== undefined && insert_line !== undefined) {
              const result = fileSystem.insertInFile(path, insert_line, new_str);
              if (!result.startsWith("Error:")) {
                const content = fileSystem.readFile(path);
                if (content !== null) {
                  updateFile(path, content);
                }
              }
            }
            break;
        }
      }

      // Handle file_manager tool
      if (toolName === "file_manager" && args) {
        const { command, path, new_path } = args;

        switch (command) {
          case "rename":
            if (path && new_path) {
              renameFile(path, new_path);
            }
            break;

          case "delete":
            if (path) {
              const success = fileSystem.deleteFile(path);
              if (success) {
                deleteFile(path);
              }
            }
            break;
        }
      }
    },
    [fileSystem, createFile, updateFile, deleteFile, renameFile, openFile]
  );

  return (
    <FileSystemContext.Provider
      value={{
        fileSystem,
        selectedFile,
        setSelectedFile,
        openFiles,
        openFile,
        closeFile,
        createFile,
        updateFile,
        deleteFile,
        renameFile,
        getFileContent,
        getAllFiles,
        refreshTrigger,
        handleToolCall,
        reset,
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error("useFileSystem must be used within a FileSystemProvider");
  }
  return context;
}
