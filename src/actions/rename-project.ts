"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function renameProject(projectId: string, newName: string) {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  if (!newName || newName.trim().length === 0) {
    throw new Error("Project name cannot be empty");
  }

  if (newName.trim().length > 100) {
    throw new Error("Project name is too long");
  }

  const project = await prisma.project.update({
    where: {
      id: projectId,
      userId: session.userId,
    },
    data: {
      name: newName.trim(),
    },
  });

  revalidatePath("/");
  return { success: true, name: project.name };
}
