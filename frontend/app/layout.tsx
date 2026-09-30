import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";

import { AuthProvider } from "@/lib/auth-context";
import { GlobalLoader } from "@/components/ui/global-loader";

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
    <html lang="km" className="font-sans antialiased" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <AuthProvider>
          <GlobalLoader />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
