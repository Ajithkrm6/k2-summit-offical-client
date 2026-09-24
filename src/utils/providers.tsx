"use client";

import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { queryClient } from "@/utils/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    // Configure axios defaults from environment variables on client mount
    axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL;
    axios.defaults.timeout = 30000;
    axios.defaults.withCredentials = true;

    // Response interceptor: Handle 401 (unauthenticated)
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== "undefined") {
            const url = new URL("/auth/login", window.location.origin);
            window.location.href = url.toString();
          }
        }
        return Promise.reject(error);
      },
    );
  }, []);

  return (
    <ThemeProvider>
      <SessionProvider>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            <Toaster />
            {children}
          </QueryClientProvider>
        </TooltipProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
