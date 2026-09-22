"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/utils/query-client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/ThemeProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </TooltipProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
