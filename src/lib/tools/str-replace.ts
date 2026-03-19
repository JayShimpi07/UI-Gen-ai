import { z } from "zod";
import { VirtualFileSystem } from "@/lib/file-system";

const TextEditorParameters = z.object({
  command: z.enum(["view", "create", "str_replace", "insert", "undo_edit"])
    .describe("The editing command to perform. Use 'create' to initialize a new file, and 'str_replace' to modify an existing file."),
  path: z.string()
    .describe("The absolute path to the file (e.g. /components/ui/Button.jsx)"),
  file_text: z.string().optional()
    .describe("The entire content of the file. REQUIRED for the 'create' command."),
  insert_line: z.number().optional()
    .describe("The line number. ONLY used with the 'insert' command."),
  new_str: z.string().optional()
    .describe("The new text. REQUIRED for the 'str_replace' command."),
  old_str: z.string().optional()
    .describe("A VERY UNIQUE, multi-line block of text from the existing file to be replaced. REQUIRED for the 'str_replace' command. Must match exactly."),
  view_range: z.array(z.number()).optional()
    .describe("An array of two numbers [start_line, end_line] to view. ONLY used with the 'view' command."),
}).describe("A powerful text editor for interacting with the file system. You MUST use 'create' if the file does not exist. Do NOT use 'str_replace' on a file you haven't created yet.");

export const buildStrReplaceTool = (fileSystem: VirtualFileSystem) => {
  return {
    id: "str_replace_editor" as const,
    args: {},
    parameters: TextEditorParameters,
    execute: async ({
      command,
      path,
      file_text,
      insert_line,
      new_str,
      old_str,
      view_range,
    }: z.infer<typeof TextEditorParameters>) => {
      switch (command) {
        case "view":
          return fileSystem.viewFile(
            path,
            view_range as [number, number] | undefined
          );

        case "create":
          return fileSystem.createFileWithParents(path, file_text || "");

        case "str_replace":
          return fileSystem.replaceInFile(path, old_str || "", new_str || "");

        case "insert":
          return fileSystem.insertInFile(path, insert_line || 0, new_str || "");

        case "undo_edit":
          return `Error: undo_edit command is not supported in this version. Use str_replace to revert changes.`;
      }
    },
  };
};
