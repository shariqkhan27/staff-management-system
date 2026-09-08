"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/lib/user-context";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  UserCheck,
  UserX,
  Building2,
  CalendarCheck,
  CalendarOff,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Wallet,
  User,
  Briefcase,
  FileText,
  Calendar,
} from "lucide-react";

// ─────────────────────────────────────
// Types
// ─────────────────────────────────────
interface AdminStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  totalDepartments: number;
  todayPresent: number;
  todayAbsent: number;
  pendingLeaves: number;
  monthlyPayroll?: number;
}

interface EmployeeStats {
  employee: {
    name: string;
    designation: string | null;
    department: { name: string } | null;
    joiningDate: string;
    status: string;
  };
  attendance: {
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    totalMarked: number;
  };
  pendingLeaves: number;
  leaveBalances: { type: string; allocated: number; used: number; remaining: number }[];
  latestSalary: { month: number; year: number; netSalary: number; status: string } | null;
}

// ─────────────────────────────────────
// Employee Dashboard Component
// ─────────────────────────────────────
function EmployeeDashboard({ userName }: { userName: string }) {
  const [data, setData] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/employee-stats")
      .then((res) => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.employee) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <User className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <h2 className="text-lg font-semibold">No Profile Linked</h2>
          <p className="text-sm text-muted-foreground">
            Your account is not linked to an employee profile. Contact your admin.
          </p>
        </div>
      </div>
    );
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const attendanceCards = [
    {
      title: "Present Days",
      value: data.attendance.presentDays,
      icon: CalendarCheck,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      title: "Absent Days",
      value: data.attendance.absentDays,
      icon: CalendarOff,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      title: "Late Arrivals",
      value: data.attendance.lateDays,
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
    },
    {
      title: "Half Days",
      value: data.attendance.halfDays,
      icon: Calendar,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome */}
      <div className="glass-card rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold break-words">Welcome back, {userName}! 👋</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {data.employee.designation || "Employee"} •{" "}
              {data.employee.department?.name || "No Department"}
            </p>
          </div>
          <Badge
            variant={data.employee.status === "ACTIVE" ? "success" : "warning"}
            className="w-fit"
          >
            {data.employee.status === "ACTIVE" ? "Active" : data.employee.status}
          </Badge>
        </div>
      </div>

      {/* This Month's Attendance */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          This Month&apos;s Attendance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {attendanceCards.map((card) => (
            <div
              key={card.title}
              className={`stat-card rounded-xl p-5 ${card.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                </div>
                <div
                  className={`h-12 w-12 rounded-xl ${card.bgColor} flex items-center justify-center`}
                >
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Balances + Last Salary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Balances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-yellow-400" />
              Leave Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.leaveBalances.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No leave balances allocated yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.leaveBalances.map((lb) => (
                  <div
                    key={lb.type}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{lb.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {lb.used} used of {lb.allocated}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{lb.remaining}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">remaining</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Salary & Pending */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Salary & Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Latest Salary */}
            {data.latestSalary ? (
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">
                  Last Payslip — {monthNames[data.latestSalary.month - 1]} {data.latestSalary.year}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(data.latestSalary.netSalary)}
                </p>
                <Badge
                  variant={data.latestSalary.status === "PAID" ? "success" : "warning"}
                  className="mt-2"
                >
                  {data.latestSalary.status}
                </Badge>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-sm text-muted-foreground">No payslip generated yet.</p>
              </div>
            )}

            {/* Pending Leave */}
            {data.pendingLeaves > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">{data.pendingLeaves} pending leave request(s)</span>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-primary" />
            Quick Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/my-profile">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <User className="h-4 w-4 text-blue-400" />
                <span className="text-sm">My Profile</span>
              </Button>
            </Link>
            <Link href="/my-attendance">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <ClipboardList className="h-4 w-4 text-green-400" />
                <span className="text-sm">My Attendance</span>
              </Button>
            </Link>
            <Link href="/my-leaves">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <CalendarOff className="h-4 w-4 text-yellow-400" />
                <span className="text-sm">My Leaves</span>
              </Button>
            </Link>
            <Link href="/my-payslips">
              <Button variant="outline" className="w-full justify-start gap-2 h-12">
                <FileText className="h-4 w-4 text-purple-400" />
                <span className="text-sm">My Payslips</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────
// Admin/HR Dashboard Component
// ─────────────────────────────────────
function AdminDashboard({ userRole, userName }: { userRole: string; userName: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const isOwner = userRole === "OWNER";

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const ownerStatCards = [
    { title: "Total Employees", value: stats?.totalEmployees ?? 0, icon: Users, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
    { title: "Active", value: stats?.activeEmployees ?? 0, icon: UserCheck, color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
    { title: "On Leave", value: stats?.onLeaveEmployees ?? 0, icon: UserX, color: "text-yellow-400", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20" },
    { title: "Departments", value: stats?.totalDepartments ?? 0, icon: Building2, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
  ];

  const hrStatCards = [
    { title: "Total Employees", value: stats?.totalEmployees ?? 0, icon: Users, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
    { title: "Present Today", value: stats?.todayPresent ?? 0, icon: CalendarCheck, color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
    { title: "Absent Today", value: stats?.todayAbsent ?? 0, icon: CalendarOff, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" },
    { title: "Pending Leave Requests", value: stats?.pendingLeaves ?? 0, icon: Clock, color: "text-yellow-400", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/20" },
  ];

  const mainCards = isOwner ? ownerStatCards : hrStatCards;

  return (
    <div className="space-y-6 fade-in">
      <div className="glass-card rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold break-words">Welcome back, {userName}! 👋</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {isOwner ? "Here's the full overview of Elegence Architectures today." : "Here's today's attendance and leave overview for your team."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainCards.map((card) => (
          <div key={card.title} className={`stat-card rounded-xl p-5 ${card.borderColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50"><CardContent className="p-5"><div className="flex items-center gap-3"><CalendarCheck className="h-5 w-5 text-green-400" /><div><p className="text-xs text-muted-foreground">Present Today</p><p className="text-xl font-semibold mt-0.5">{stats?.todayPresent ?? 0}</p></div></div></CardContent></Card>
          <Card className="bg-card/50"><CardContent className="p-5"><div className="flex items-center gap-3"><CalendarOff className="h-5 w-5 text-red-400" /><div><p className="text-xs text-muted-foreground">Absent Today</p><p className="text-xl font-semibold mt-0.5">{stats?.todayAbsent ?? 0}</p></div></div></CardContent></Card>
          <Card className="bg-card/50"><CardContent className="p-5"><div className="flex items-center gap-3"><Clock className="h-5 w-5 text-yellow-400" /><div><p className="text-xs text-muted-foreground">Pending Leave Requests</p><p className="text-xl font-semibold mt-0.5">{stats?.pendingLeaves ?? 0}</p></div></div></CardContent></Card>
          <Card className="bg-card/50"><CardContent className="p-5"><div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Monthly Payroll</p><p className="text-xl font-semibold mt-0.5">{formatCurrency(stats?.monthlyPayroll ?? 0)}</p></div></div></CardContent></Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-yellow-400" />Pending Actions</CardTitle></CardHeader>
          <CardContent>
            {(stats?.pendingLeaves ?? 0) > 0 ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3"><CalendarOff className="h-4 w-4 text-yellow-400" /><span className="text-sm">{stats?.pendingLeaves} leave request(s) pending</span></div>
                <Badge variant="warning">Pending</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No pending actions. All caught up! ✅</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" />Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {isOwner ? (
                <>
                  <Link href="/employees/new"><Button variant="outline" className="w-full justify-start gap-2 h-12"><Users className="h-4 w-4 text-blue-400" /><span className="text-sm">Add Employee</span></Button></Link>
                  <Link href="/attendance"><Button variant="outline" className="w-full justify-start gap-2 h-12"><ClipboardList className="h-4 w-4 text-green-400" /><span className="text-sm">Mark Attendance</span></Button></Link>
                  <Link href="/payroll"><Button variant="outline" className="w-full justify-start gap-2 h-12"><Wallet className="h-4 w-4 text-purple-400" /><span className="text-sm">Process Payroll</span></Button></Link>
                  <Link href="/reports"><Button variant="outline" className="w-full justify-start gap-2 h-12"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-sm">View Reports</span></Button></Link>
                </>
              ) : (
                <>
                  <Link href="/attendance"><Button variant="outline" className="w-full justify-start gap-2 h-12"><ClipboardList className="h-4 w-4 text-green-400" /><span className="text-sm">Mark Attendance</span></Button></Link>
                  <Link href="/leaves"><Button variant="outline" className="w-full justify-start gap-2 h-12"><CalendarOff className="h-4 w-4 text-yellow-400" /><span className="text-sm">Leave Requests</span></Button></Link>
                  <Link href="/employees"><Button variant="outline" className="w-full justify-start gap-2 h-12"><Users className="h-4 w-4 text-blue-400" /><span className="text-sm">Employees</span></Button></Link>
                  <Link href="/departments"><Button variant="outline" className="w-full justify-start gap-2 h-12"><Building2 className="h-4 w-4 text-purple-400" /><span className="text-sm">Departments</span></Button></Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Main Page — Routes to the right dashboard
// ─────────────────────────────────────
export default function DashboardPage() {
  const { role: userRole, name: userName } = useUser();

  if (userRole === "EMPLOYEE") {
    return <EmployeeDashboard userName={userName} />;
  }

  return <AdminDashboard userRole={userRole} userName={userName} />;
}
