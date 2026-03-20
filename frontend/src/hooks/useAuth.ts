"use client";

import { useAuthContext } from "@/providers/AuthProvider";

export function useAuth() {
  const context = useAuthContext();
  return context;
}
