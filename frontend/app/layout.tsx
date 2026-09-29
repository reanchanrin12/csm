import type { Metadata } from "next";
import "./globals.css";
import { Roboto, Kantumruy_Pro, Hanuman } from "next/font/google";
import { cn } from "@/lib/utils";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const kantumruyPro = Kantumruy_Pro({
  subsets: ["khmer"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-kantumruy",
  display: "swap",
});

const hanuman = Hanuman({
  subsets: ["khmer"],
  weight: ["400", "700"],
  variable: "--font-hanuman",
  display: "swap",
});

import { AuthProvider } from "@/lib/auth-context";

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
      className={cn(
        "font-sans antialiased",
        roboto.variable,
        kantumruyPro.variable,
        hanuman.variable
      )}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
