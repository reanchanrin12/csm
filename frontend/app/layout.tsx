import type { Metadata } from "next";
import { Kantumruy_Pro, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

import { AuthProvider } from "@/lib/auth-context";
import { GlobalLoader } from "@/components/ui/global-loader";

const kantumruy = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kantumruy",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CSM - Car Showroom Management",
  description: "Modern Car Showroom & Sales Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="km"
      className={cn("antialiased", kantumruy.variable, inter.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "min-h-screen bg-background text-foreground antialiased font-sans",
          kantumruy.className
        )}
      >
        <AuthProvider>
          <GlobalLoader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
