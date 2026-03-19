"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, FolderOpen, ChevronDown, Trash2, Pencil, Check, X } from "lucide-react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { signOut } from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";
import { deleteProject } from "@/actions/delete-project";
import { renameProject } from "@/actions/rename-project";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HeaderActionsProps {
  user?: {
    id: string;
    email: string;
  } | null;
  projectId?: string;
}

interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export function HeaderActions({ user, projectId }: HeaderActionsProps) {
  const router = useRouter();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Rename state
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load projects initially
  useEffect(() => {
    if (user && projectId) {
      getProjects()
        .then(setProjects)
        .catch(console.error)
        .finally(() => setInitialLoading(false));
    }
  }, [user, projectId]);

  // Refresh projects when popover opens
  useEffect(() => {
    if (user && projectsOpen) {
      getProjects().then(setProjects).catch(console.error);
    }
  }, [projectsOpen, user]);

  // Focus input when editing
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentProject = projects.find((p) => p.id === projectId);

  const handleSignInClick = () => {
    setAuthMode("signin");
    setAuthDialogOpen(true);
  };

  const handleSignUpClick = () => {
    setAuthMode("signup");
    setAuthDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNewDesign = async () => {
    const project = await createProject({
      name: `Design #${~~(Math.random() * 100000)}`,
      messages: [],
      data: {},
    });
    router.push(`/${project.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
    setProjectsOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      if (projectToDelete.id === projectId) {
        // Navigate to another project or home
        const remaining = projects.filter((p) => p.id !== projectToDelete.id);
        if (remaining.length > 0) {
          router.push(`/${remaining[0].id}`);
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleStartRename = () => {
    if (currentProject) {
      setNameInput(currentProject.name);
      setEditingName(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (!projectId || !nameInput.trim()) return;
    setIsRenaming(true);
    try {
      const result = await renameProject(projectId, nameInput);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, name: result.name } : p))
      );
      setEditingName(false);
    } catch (error) {
      console.error("Failed to rename:", error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleRenameCancel = () => {
    setEditingName(false);
    setNameInput("");
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      handleRenameCancel();
    }
  };

  if (!user) {
    return (
      <>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="h-8 text-white/60 border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:text-white/80 hover:border-white/15 transition-all" 
            onClick={handleSignInClick}
          >
            Sign In
          </Button>
          <Button 
            className="h-8 gradient-primary text-white border-0 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all" 
            onClick={handleSignUpClick}
          >
            Sign Up
          </Button>
        </div>
        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          defaultMode={authMode}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Project name (editable) */}
        {!initialLoading && currentProject && (
          editingName ? (
            <div className="flex items-center gap-1 h-8">
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                disabled={isRenaming}
                className="h-7 px-2 text-sm text-white/90 bg-white/[0.06] border border-white/15 rounded-md focus:outline-none focus:border-indigo-500/50 w-[160px]"
                maxLength={100}
              />
              <button
                onClick={handleRenameSubmit}
                disabled={isRenaming}
                className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleRenameCancel}
                className="p-1 rounded text-white/40 hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Popover open={projectsOpen} onOpenChange={setProjectsOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-8 gap-2 text-white/60 border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:text-white/80 hover:border-white/15 transition-all" 
                  role="combobox"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-indigo-400/70" />
                  <span className="max-w-[140px] truncate">
                    {currentProject.name}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-40" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 glass border-white/[0.08] shadow-2xl shadow-black/40" align="end">
                <Command className="bg-transparent">
                  <CommandInput
                    placeholder="Search projects..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    className="text-white/80 placeholder:text-white/25"
                  />
                  <CommandList>
                    <CommandEmpty className="text-white/30 text-sm py-6">No projects found.</CommandEmpty>
                    <CommandGroup>
                      {filteredProjects.map((project) => (
                        <CommandItem
                          key={project.id}
                          value={project.name}
                          onSelect={() => {
                            router.push(`/${project.id}`);
                            setProjectsOpen(false);
                            setSearchQuery("");
                          }}
                          className="text-white/60 hover:text-white/90 data-[selected=true]:bg-white/[0.06] data-[selected=true]:text-white/90 group"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-medium truncate">{project.name}</span>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity ml-2 shrink-0">
                              <button
                                onClick={(e) => handleDeleteClick(e, project)}
                                className="p-1 rounded hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-colors"
                                title="Delete project"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )
        )}

        {/* Rename button */}
        {!initialLoading && currentProject && !editingName && (
          <button
            onClick={handleStartRename}
            className="p-1.5 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            title="Rename project"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}

        <Button 
          className="flex items-center gap-2 h-8 gradient-primary text-white border-0 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all" 
          onClick={handleNewDesign}
        >
          <Plus className="h-3.5 w-3.5" />
          New Design
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
          onClick={handleSignOut}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] glass border-white/[0.08] bg-[#12122a]/95 backdrop-blur-2xl shadow-2xl shadow-black/50">
          <DialogHeader>
            <DialogTitle className="text-white/90">Delete Project</DialogTitle>
            <DialogDescription className="text-white/40">
              Are you sure you want to delete <span className="text-white/70 font-medium">&ldquo;{projectToDelete?.name}&rdquo;</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="h-8 text-white/60 border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              className="h-8 bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg shadow-red-500/20"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
