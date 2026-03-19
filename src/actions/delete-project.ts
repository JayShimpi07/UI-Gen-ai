"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteProject(projectId: string) {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Verify project belongs to user
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      userId: session.userId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  await prisma.project.delete({
    where: {
      id: projectId,
      userId: session.userId,
    },
  });

  revalidatePath("/");
  return { success: true };
}
