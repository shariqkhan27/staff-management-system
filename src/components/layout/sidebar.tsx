"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  CalendarOff,
  Wallet,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  ClipboardList,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import React from "react";
import { useGlobalSettings } from "@/components/global-settings-provider";

interface SidebarProps {
  userRole: string;
  userName: string;
  userEmail: string;
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  onNavClick?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["OWNER", "HR_MANAGER", "EMPLOYEE"],
  },
  {
    label: "Employees",
    href: "/employees",
    icon: Users,
    roles: ["OWNER", "HR_MANAGER"],
  },
  {
    label: "Departments",
    href: "/departments",
    icon: Building2,
    roles: ["OWNER", "HR_MANAGER"],
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: CalendarCheck,
    roles: ["OWNER", "HR_MANAGER"],
  },
  {
    label: "Leave Requests",
    href: "/leaves",
    icon: CalendarOff,
    roles: ["OWNER", "HR_MANAGER"],
  },
  {
    label: "Payroll",
    href: "/payroll",
    icon: Wallet,
    roles: ["OWNER", "FINANCE_MANAGER"],
  },
  {
    label: "Finance",
    href: "/finance",
    icon: DollarSign,
    roles: ["OWNER", "FINANCE_MANAGER"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["OWNER", "FINANCE_MANAGER"],
  },
  // Employee self-service
  {
    label: "My Profile",
    href: "/my-profile",
    icon: User,
    roles: ["EMPLOYEE", "HR_MANAGER", "FINANCE_MANAGER"],
  },
  {
    label: "My Attendance",
    href: "/my-attendance",
    icon: ClipboardList,
    roles: ["EMPLOYEE", "HR_MANAGER", "FINANCE_MANAGER"],
  },
  {
    label: "My Leaves",
    href: "/my-leaves",
    icon: CalendarOff,
    roles: ["EMPLOYEE", "HR_MANAGER", "FINANCE_MANAGER"],
  },
  {
    label: "My Payslips",
    href: "/my-payslips",
    icon: FileText,
    roles: ["EMPLOYEE", "HR_MANAGER", "FINANCE_MANAGER"],
  },
  // Security / Admin
  {
    label: "Audit Logs",
    href: "/audit-logs",
    icon: ShieldAlert,
    roles: ["OWNER"],
  },
  // Settings
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["OWNER", "HR_MANAGER", "EMPLOYEE"],
  },
];

export function Sidebar({
  userRole,
  userName,
  userEmail,
  collapsed,
  onToggle,
  onLogout,
  onNavClick,
}: SidebarProps) {
  const pathname = usePathname();
  const { settings } = useGlobalSettings();
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));
  
  const words = settings.companyName.split(" ");
  const line1 = words[0];
  const line2 = words.slice(1).join(" ") || "Management";

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        // On mobile: always full width (260px)
        "w-[260px]",
        // On desktop: collapse/expand
        collapsed ? "lg:w-[70px]" : "lg:w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        {/* On mobile: always show. On desktop: show/hide based on collapsed */}
        <div className={cn("overflow-hidden", collapsed && "lg:hidden")}>
          <h1 className="text-sm font-bold text-foreground truncate">
            {line1}
          </h1>
          <p className="text-[10px] text-muted-foreground truncate">
            {line2}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "sidebar-link",
                isActive && "active",
                collapsed && "lg:justify-center lg:px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {/* On mobile: always show label. On desktop: hide when collapsed */}
              <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && "lg:justify-center"
          )}
        >
          <Avatar fallback={userName} size="sm" />
          {/* On mobile: always show. On desktop: hide when collapsed */}
          <div className={cn("flex-1 min-w-0", collapsed && "lg:hidden")}>
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {userEmail}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex gap-1 mt-3",
            collapsed ? "lg:flex-col lg:items-center" : "items-center"
          )}
        >
          {/* Collapse toggle - hidden on mobile, shown on desktop */}
          <button
            onClick={onToggle}
            className="hidden lg:block p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Logout button */}
          <button
            onClick={() => { onLogout(); onNavClick?.(); }}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors",
              collapsed ? "lg:ml-0" : "ml-auto"
            )}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            {/* On mobile: always show. On desktop: hide when collapsed */}
            <span className={cn("text-sm", collapsed && "lg:hidden")}>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

