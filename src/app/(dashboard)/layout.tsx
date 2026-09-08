"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ToasterUI, ToastProvider } from "@/components/ui/toaster";
import { UserProvider } from "@/lib/user-context";
import { cn } from "@/lib/utils";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId: string | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
        setLoading(false);
      });
  }, [router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handleMobileNavClick = () => {
    setMobileOpen(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse">
            <div className="h-6 w-6 rounded-md bg-primary/40" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar - hidden on mobile, shown on desktop */}
        <div
          className={cn(
            "fixed left-0 top-0 z-50 h-screen transition-transform duration-300 lg:transition-all lg:duration-300",
            // Mobile: slide in/out
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            // Desktop: always visible
            "lg:translate-x-0",
          )}
        >
          <Sidebar
            userRole={user.role}
            userName={user.name}
            userEmail={user.email}
            collapsed={collapsed}
            onToggle={() => setCollapsed(!collapsed)}
            onLogout={handleLogout}
            onNavClick={handleMobileNavClick}
          />
        </div>

        {/* Main content */}
        <div
          className={cn(
            "transition-all duration-300",
            // Mobile: no left margin
            "ml-0",
            // Desktop: margin based on sidebar state
            collapsed ? "lg:ml-[70px]" : "lg:ml-[260px]"
          )}
        >
          <Header
            userName={user.name}
            userRole={user.role}
            onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
          />

          <main className="p-3 sm:p-4 md:p-6 fade-in">
            <UserProvider user={user}>
              {children}
            </UserProvider>
          </main>
        </div>

        <ToasterUI />
      </div>
    </ToastProvider>
  );
}

