"use client";

import React from "react";
import { StacksProvider } from "@/providers/StacksProvider";
import { AuthProvider } from "@/providers/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StacksProvider>
      <AuthProvider>{children}</AuthProvider>
    </StacksProvider>
  );
}
