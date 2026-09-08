import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { GlobalSettingsProvider } from "@/components/global-settings-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Elegence Architectures — Staff Management",
  description:
    "Complete HR & Staff Management System for Elegence Architectures. Manage employees, attendance, payroll, and finances.",
  keywords: "HR, staff management, payroll, attendance, Elegence Architectures",
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
    <html lang="en" className="dark">
      <body className={inter.className}>
        <GlobalSettingsProvider>
          {children}
          <Toaster />
        </GlobalSettingsProvider>
      </body>
    </html>
  );
}
