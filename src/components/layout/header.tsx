"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu, Check } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  userName: string;
  userRole: string;
  onMobileMenuToggle?: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/employees": "Employees",
  "/employees/new": "Add Employee",
  "/departments": "Departments",
  "/attendance": "Attendance",
  "/leaves": "Leave Requests",
  "/payroll": "Payroll",
  "/finance": "Finance",
  "/reports": "Reports",
  "/my-profile": "My Profile",
  "/my-attendance": "My Attendance",
  "/my-leaves": "My Leaves",
  "/my-payslips": "My Payslips",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/employees/") && pathname.endsWith("/edit"))
    return "Edit Employee";
  if (pathname.startsWith("/employees/")) return "Employee Details";
  return "Dashboard";
}

export function Header({ userName, userRole, onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleLabel =
    userRole === "OWNER"
      ? "Owner"
      : userRole === "HR_MANAGER"
      ? "HR Manager"
      : "Employee";

  // Fetch notifications (only for OWNER)
  useEffect(() => {
    if (userRole !== "OWNER") return;

    const fetchNotifications = () => {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {});
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [userRole]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PUT" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString("en-PK", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "Asia/Karachi",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        {/* Search - hidden on mobile */}
        <div className="hidden md:flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-40"
          />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications Bell */}
        {userRole === "OWNER" && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center pulse-dot">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-96 max-w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden fade-in">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 border-b border-border/50 hover:bg-secondary/30 transition-colors ${
                          !n.isRead ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-2">
                          {format(new Date(n.createdAt), "dd MMM yyyy, hh:mm a")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Static bell for non-owners */}
        {userRole !== "OWNER" && (
          <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Bell className="h-5 w-5" />
          </button>
        )}

        {/* User info */}
        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-primary">{roleLabel}</p>
          </div>
          <Avatar fallback={userName} size="sm" />
        </div>
      </div>
    </header>
  );
}
