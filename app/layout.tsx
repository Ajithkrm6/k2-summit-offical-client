import { PrimaryLayout } from "@/components/layout/PrimaryLayout";
import { Providers } from "@/utils/providers";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "K2 Tax Summit",
  description: "K2 Tax Summit - Professional tax management application",
  icons: {
    icon: [
      { url: "/k2-1.ico", sizes: "any" },
      { url: "/k2.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/k2-1.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "K2 Tax Summit",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <Providers>
          <PrimaryLayout>{children}</PrimaryLayout>
        </Providers>
      </body>
    </html>
  );
}
