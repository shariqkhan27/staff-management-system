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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Elegance HR",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "Elegance Spaces Staff Management",
    "apple-mobile-web-app-title": "Elegance HR",
    "msapplication-TileColor": "#b58860",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#b58860",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-512x512.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-512x512.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <GlobalSettingsProvider>
            {children}
            <Toaster />
          </GlobalSettingsProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('SW registration failed: ', error);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
