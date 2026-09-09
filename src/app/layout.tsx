import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { GlobalSettingsProvider } from "@/components/global-settings-provider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Elegance Spaces — Staff Management",
  description:
    "Complete HR & Staff Management System for Elegance Spaces. Manage employees, attendance, payroll, and finances.",
  keywords: "HR, staff management, payroll, attendance, Elegance Spaces",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <GlobalSettingsProvider>
            {children}
            <Toaster />
          </GlobalSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
