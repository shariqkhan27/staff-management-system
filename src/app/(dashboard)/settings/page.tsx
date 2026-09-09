"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toaster";
import { useUser } from "@/lib/user-context";
import {
  User,
  Lock,
  Building2,
  CalendarOff,
  Users,
  Shield,
  Eye,
  EyeOff,
  Save,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Mail,
  Phone,
  Globe,
  Clock,
  Banknote,
  ChevronRight,
  Settings,
} from "lucide-react";

// ─────────────────────────────────────
// Types
// ─────────────────────────────────────
interface LeaveType {
  id: string;
  name: string;
  maxDaysPerYear: number;
  maxDaysPerMonth: number | null;
  isPaid: boolean;
}

interface SystemUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  employee: { name: string; employeeId: string } | null;
}

interface SettingsData {
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
    employee: { name: string; phone: string | null; photoUrl: string | null } | null;
  };
  systemStats: {
    totalEmployees: number;
    totalDepartments: number;
    totalLeaveTypes: number;
    totalUsers: number;
  };
  leaveTypes: LeaveType[];
  users: SystemUser[];
}

type SectionKey = "profile" | "security" | "leave-types" | "users" | "global-settings" | "system";

const sections: { key: SectionKey; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { key: "profile", label: "Profile", icon: User, description: "Manage your account details" },
  { key: "security", label: "Security", icon: Lock, description: "Password & authentication" },
  { key: "leave-types", label: "Leave Types", icon: CalendarOff, description: "Configure leave policies" },
  { key: "users", label: "User Accounts", icon: Users, description: "Manage system access" },
  { key: "global-settings", label: "Global Config", icon: Settings, description: "Dynamic app settings" },
  { key: "system", label: "System Info", icon: Building2, description: "Application details" },
];

export default function SettingsPage() {
  const { role } = useUser();
  const { toast } = useToast();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionKey>("profile");
  const [saving, setSaving] = useState(false);

  // Profile form
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Leave type form
  const [newLeaveTypeName, setNewLeaveTypeName] = useState("");
  const [newLeaveTypeDays, setNewLeaveTypeDays] = useState(10);
  const [newLeaveTypeMonthDays, setNewLeaveTypeMonthDays] = useState<number | null>(null);
  const [newLeaveTypeIsPaid, setNewLeaveTypeIsPaid] = useState(true);

  // User management
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  // Global settings
  const [globalSettings, setGlobalSettings] = useState<Record<string, string>>({
    companyName: "Elegance Spaces",
    currency: "PKR",
    timezone: "Asia/Karachi",
    defaultOvertimeRate: "500",
    lateGraceMinutes: "15"
  });

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, globalRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/settings/global")
      ]);
      if (!settingsRes.ok) throw new Error();
      const json = await settingsRes.json();
      setData(json);
      setProfileName(json.user.employee?.name || "Admin");
      setProfileEmail(json.user.email);
      setProfilePhone(json.user.employee?.phone || "");

      if (globalRes.ok) {
        const globalJson = await globalRes.json();
        if (Object.keys(globalJson).length > 0) {
          setGlobalSettings(prev => ({ ...prev, ...globalJson }));
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const apiCall = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast({ title: "Success", description: json.message });
      fetchData();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = () => apiCall({ action: "UPDATE_PROFILE", name: profileName, email: profileEmail, phone: profilePhone });

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    const success = await apiCall({ action: "CHANGE_PASSWORD", currentPassword, newPassword });
    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleCreateLeaveType = async () => {
    if (!newLeaveTypeName.trim()) return;
    const success = await apiCall({ action: "CREATE_LEAVE_TYPE", name: newLeaveTypeName, maxDaysPerYear: newLeaveTypeDays, maxDaysPerMonth: newLeaveTypeMonthDays, isPaid: newLeaveTypeIsPaid });
    if (success) {
      setNewLeaveTypeName("");
      setNewLeaveTypeDays(10);
      setNewLeaveTypeMonthDays(null);
    }
  };

  const handleUpdateLeaveType = (lt: LeaveType, updates: Partial<LeaveType>) => {
    apiCall({ 
      action: "UPDATE_LEAVE_TYPE", 
      id: lt.id, 
      name: updates.name ?? lt.name, 
      maxDaysPerYear: updates.maxDaysPerYear ?? lt.maxDaysPerYear, 
      maxDaysPerMonth: updates.maxDaysPerMonth !== undefined ? updates.maxDaysPerMonth : lt.maxDaysPerMonth, 
      isPaid: updates.isPaid ?? lt.isPaid 
    });
  };

  const handleResetPassword = async (userId: string) => {
    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    const success = await apiCall({ action: "RESET_USER_PASSWORD", userId, newPassword: resetPasswordValue });
    if (success) {
      setResetPasswordUserId(null);
      setResetPasswordValue("");
    }
  };

  const handleToggleUser = (userId: string) => apiCall({ action: "TOGGLE_USER_STATUS", userId });

  const handleSaveGlobalSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: globalSettings }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: "Global settings updated successfully" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update global settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl lg:col-span-3" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isOwner = role === "OWNER";

  // Filter sections based on role
  const visibleSections = isOwner ? sections : sections.filter(s => s.key === "profile" || s.key === "security");

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and system configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-3">
            <nav className="space-y-1">
              {visibleSections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                    activeSection === section.key
                      ? "bg-primary/10 text-primary font-medium shadow-sm border border-primary/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <div className={`p-1.5 rounded-md transition-colors ${
                    activeSection === section.key ? "bg-primary/20" : "bg-muted/50 group-hover:bg-muted"
                  }`}>
                    <section.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="leading-tight">{section.label}</p>
                    <p className={`text-[10px] mt-0.5 leading-tight ${
                      activeSection === section.key ? "text-primary/70" : "text-muted-foreground/60"
                    }`}>{section.description}</p>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${
                    activeSection === section.key ? "text-primary translate-x-0" : "opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0"
                  }`} />
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Right: Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* ════════════════════════════════════════════ */}
          {/* PROFILE SECTION */}
          {/* ════════════════════════════════════════════ */}
          {activeSection === "profile" && (
            <Card className="fade-in">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3 w-3" /> Full Name
                      </label>
                      <Input
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> Email Address
                      </label>
                      <Input
                        type="email"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> Phone Number
                      </label>
                      <Input
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+92 300 1234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Shield className="h-3 w-3" /> Role
                      </label>
                      <div className="h-9 px-3 flex items-center rounded-md border border-border bg-muted/30 text-sm">
                        <Badge variant={role === "OWNER" ? "default" : role === "FINANCE_MANAGER" ? "destructive" : role === "HR_MANAGER" ? "warning" : "success"} className="text-[10px]">
                          {role === "OWNER" ? "Owner / Admin" : role === "FINANCE_MANAGER" ? "Finance Manager" : role === "HR_MANAGER" ? "HR Manager" : "Employee"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveProfile} disabled={saving} size="sm">
                      <Save className="h-4 w-4 mr-1.5" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ════════════════════════════════════════════ */}
          {/* SECURITY SECTION */}
          {/* ════════════════════════════════════════════ */}
          {activeSection === "security" && (
            <Card className="fade-in">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Current Password</label>
                    <div className="relative">
                      <Input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                      >
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">New Password</label>
                    <div className="relative">
                      <Input
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowNewPw(!showNewPw)}
                      >
                        {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Confirm New Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handleChangePassword}
                      disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                      size="sm"
                    >
                      <Lock className="h-4 w-4 mr-1.5" />
                      {saving ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ════════════════════════════════════════════ */}
          {/* LEAVE TYPES SECTION */}
          {/* ════════════════════════════════════════════ */}
          {activeSection === "leave-types" && isOwner && (
            <div className="space-y-6 fade-in">
              {/* Existing Leave Types */}
              <Card>
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarOff className="h-4 w-4 text-primary" />
                    Leave Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="space-y-3">
                    {data.leaveTypes.map((lt) => (
                      <div key={lt.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-border transition-colors">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                          <Input
                            defaultValue={lt.name}
                            className="h-8 text-sm"
                            onBlur={(e) => {
                              if (e.target.value !== lt.name) handleUpdateLeaveType(lt, { name: e.target.value });
                            }}
                          />
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground whitespace-nowrap">Days/Year:</label>
                            <Input
                              type="number"
                              defaultValue={lt.maxDaysPerYear}
                              className="h-8 text-sm w-20"
                              onBlur={(e) => {
                                const val = parseInt(e.target.value);
                                if (val !== lt.maxDaysPerYear) handleUpdateLeaveType(lt, { maxDaysPerYear: val });
                              }}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-muted-foreground whitespace-nowrap">Days/Month:</label>
                            <Input
                              type="number"
                              defaultValue={lt.maxDaysPerMonth || ""}
                              placeholder="N/A"
                              className="h-8 text-sm w-20"
                              onBlur={(e) => {
                                const val = e.target.value ? parseInt(e.target.value) : null;
                                if (val !== lt.maxDaysPerMonth) handleUpdateLeaveType(lt, { maxDaysPerMonth: val });
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateLeaveType(lt, { isPaid: !lt.isPaid })}
                              className="flex items-center gap-2 text-sm"
                            >
                              {lt.isPaid ? (
                                <ToggleRight className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                              )}
                              <span className={lt.isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
                                {lt.isPaid ? "Paid" : "Unpaid"}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Add New Leave Type */}
              <Card>
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    Add New Leave Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-2 flex-1 min-w-[150px]">
                      <label className="text-xs font-medium text-muted-foreground">Name</label>
                      <Input
                        value={newLeaveTypeName}
                        onChange={(e) => setNewLeaveTypeName(e.target.value)}
                        placeholder="e.g. Maternity Leave"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2 w-28">
                      <label className="text-xs font-medium text-muted-foreground">Days/Year</label>
                      <Input
                        type="number"
                        value={newLeaveTypeDays}
                        onChange={(e) => setNewLeaveTypeDays(parseInt(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2 w-28">
                      <label className="text-xs font-medium text-muted-foreground">Days/Month</label>
                      <Input
                        type="number"
                        value={newLeaveTypeMonthDays || ""}
                        placeholder="N/A"
                        onChange={(e) => setNewLeaveTypeMonthDays(e.target.value ? parseInt(e.target.value) : null)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Paid</label>
                      <button
                        onClick={() => setNewLeaveTypeIsPaid(!newLeaveTypeIsPaid)}
                        className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background text-sm"
                      >
                        {newLeaveTypeIsPaid ? (
                          <><ToggleRight className="h-5 w-5 text-emerald-500" /> <span className="text-emerald-600 dark:text-emerald-400">Yes</span></>
                        ) : (
                          <><ToggleLeft className="h-5 w-5 text-muted-foreground" /> <span className="text-muted-foreground">No</span></>
                        )}
                      </button>
                    </div>
                    <Button onClick={handleCreateLeaveType} disabled={saving || !newLeaveTypeName.trim()} size="sm" className="h-9">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════════════ */}
          {/* USER ACCOUNTS SECTION */}
          {/* ════════════════════════════════════════════ */}
          {activeSection === "users" && isOwner && (
            <Card className="fade-in">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  User Accounts
                  <Badge variant="secondary" className="ml-auto text-xs">{data.users.length} users</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="space-y-2">
                  {data.users.map((u) => (
                    <div key={u.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border/50 hover:border-border transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{u.employee?.name || "Admin"}</p>
                          <Badge
                            variant={u.role === "OWNER" ? "default" : u.role === "FINANCE_MANAGER" ? "destructive" : u.role === "HR_MANAGER" ? "warning" : "success"}
                            className="text-[10px] h-5 px-1.5"
                          >
                            {u.role === "OWNER" ? "Owner" : u.role === "FINANCE_MANAGER" ? "Finance" : u.role === "HR_MANAGER" ? "HR" : "Employee"}
                          </Badge>
                          {!u.isActive && (
                            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                        {u.employee && (
                          <p className="text-[10px] text-muted-foreground/60 font-mono">{u.employee.employeeId}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Reset Password */}
                        {resetPasswordUserId === u.id ? (
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="password"
                              value={resetPasswordValue}
                              onChange={(e) => setResetPasswordValue(e.target.value)}
                              placeholder="New password"
                              className="h-7 w-32 text-xs"
                            />
                            <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleResetPassword(u.id)} disabled={saving}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setResetPasswordUserId(null); setResetPasswordValue(""); }}>
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => setResetPasswordUserId(u.id)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reset PW
                          </Button>
                        )}

                        {/* Toggle Active */}
                        {u.role !== "OWNER" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 text-xs px-2 ${u.isActive ? "text-muted-foreground hover:text-red-500" : "text-emerald-600 hover:text-emerald-700"}`}
                            onClick={() => handleToggleUser(u.id)}
                            disabled={saving}
                          >
                            {u.isActive ? (
                              <><ToggleRight className="h-3 w-3 mr-1" /> Disable</>
                            ) : (
                              <><ToggleLeft className="h-3 w-3 mr-1" /> Enable</>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ════════════════════════════════════════════ */}
          {/* GLOBAL CONFIG SECTION */}
          {/* ════════════════════════════════════════════ */}
          {activeSection === "global-settings" && isOwner && (
            <Card className="fade-in">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  Dynamic Global Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-5 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" /> Company Name
                      </label>
                      <Input
                        value={globalSettings.companyName || ""}
                        onChange={(e) => setGlobalSettings({ ...globalSettings, companyName: e.target.value })}
                        placeholder="e.g. Elegance Spaces"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Banknote className="h-3 w-3" /> Currency
                      </label>
                      <Input
                        value={globalSettings.currency || ""}
                        onChange={(e) => setGlobalSettings({ ...globalSettings, currency: e.target.value })}
                        placeholder="e.g. PKR"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Globe className="h-3 w-3" /> Timezone
                      </label>
                      <Input
                        value={globalSettings.timezone || ""}
                        onChange={(e) => setGlobalSettings({ ...globalSettings, timezone: e.target.value })}
                        placeholder="e.g. Asia/Karachi"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Late Grace Minutes
                      </label>
                      <Input
                        type="number"
                        value={globalSettings.lateGraceMinutes || ""}
                        onChange={(e) => setGlobalSettings({ ...globalSettings, lateGraceMinutes: e.target.value })}
                        placeholder="e.g. 15"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Banknote className="h-3 w-3" /> Default Overtime Rate (per hour)
                    </label>
                    <Input
                      type="number"
                      value={globalSettings.defaultOvertimeRate || ""}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, defaultOvertimeRate: e.target.value })}
                      placeholder="e.g. 500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSaveGlobalSettings} disabled={saving} size="sm">
                      <Save className="h-4 w-4 mr-1.5" />
                      {saving ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ════════════════════════════════════════════ */}
          {/* SYSTEM INFO SECTION */}
          {/* ════════════════════════════════════════════ */}
          {activeSection === "system" && isOwner && (
            <div className="space-y-6 fade-in">
              {/* System Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Employees", value: data.systemStats.totalEmployees, icon: Users, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
                  { label: "Departments", value: data.systemStats.totalDepartments, icon: Building2, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
                  { label: "Leave Types", value: data.systemStats.totalLeaveTypes, icon: CalendarOff, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
                  { label: "User Accounts", value: data.systemStats.totalUsers, icon: Shield, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${stat.color}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* App Info */}
              <Card>
                <CardHeader className="border-b border-border/50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Application Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
                    {[
                      { icon: Building2, label: "Company", value: process.env.NEXT_PUBLIC_APP_NAME || "Elegance Spaces" },
                      { icon: Globe, label: "Timezone", value: process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Karachi" },
                      { icon: Banknote, label: "Currency", value: process.env.NEXT_PUBLIC_CURRENCY || "PKR" },
                      { icon: Clock, label: "Account Created", value: new Date(data.user.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" }) },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary/50">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
