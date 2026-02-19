"use server";

import { revalidatePath as sRevalidatePath } from "next/cache";

export async function revalidatePath(path: string) {
  sRevalidatePath(path);
}
