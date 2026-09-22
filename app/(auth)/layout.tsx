/**
 * Auth Layout
 * Shared layout for all authentication pages (login, reset, forgotpassword)
 * Provides consistent styling and structure for auth flows
 */

import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="flex min-h-screen w-screen items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)",
        color: "#e2e8f0",
      }}
    >
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  );
}
