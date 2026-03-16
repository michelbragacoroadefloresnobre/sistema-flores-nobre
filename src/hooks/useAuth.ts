"use client";

import { auth } from "@/lib/auth";

export const useAuth = async () => {
  const session = await auth.api.getSession();

  return {
    user: session?.user || null,
    role: session?.user.role || null
  };
};
