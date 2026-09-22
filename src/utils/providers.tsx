"use client";

import { ReactNode, useEffect } from "react";
import axios from "axios";
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/utils/query-client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/ThemeProvider";

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
            {children}
          </QueryClientProvider>
        </TooltipProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
