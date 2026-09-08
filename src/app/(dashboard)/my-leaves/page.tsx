"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toaster";
import { useUser } from "@/lib/user-context";
import { format } from "date-fns";
import { CalendarOff, Plus, AlertCircle, Clock } from "lucide-react";

interface Leave {
  id: string;
  leaveType: { name: string; isPaid: boolean };
  fromDate: string;
  toDate: string;
  totalDays: number;
  paidDays?: number;
  unpaidDays?: number;
  status: string;
  reason: string;
  createdAt: string;
}

interface LeaveBalance {
  type: string;
  allocated: number;
  used: number;
  remaining: number;
  maxDaysPerMonth?: number | null;
  usedThisMonth?: number;
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "default"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "destructive",
};

interface FullLeaveBalance {
  id: string;
  leaveTypeId: string;
  leaveType: { id: string; name: string; maxDaysPerYear: number; maxDaysPerMonth?: number | null; isPaid: boolean };
  allocated: number;
  used: number;
  usedThisMonth?: number;
}

export default function MyLeavesPage() {
  const { toast } = useToast();
  const { employeeId } = useUser();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [fullBalances, setFullBalances] = useState<FullLeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; name: string; maxDaysPerMonth: number | null; maxDaysPerYear: number; isPaid: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Request Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // History Filters
  const [filterMonth, setFilterMonth] = useState<string>("All");
  const [filterYear, setFilterYear] = useState<string>("All");


  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetch("/api/leaves").then((res) => res.json()),
      fetch("/api/dashboard/employee-stats").then((res) => res.json()),
      fetch("/api/leave-types").then((res) => res.json()),
      fetch(`/api/leave-balances?employeeId=${employeeId}`).then((res) => res.json()),
    ])
      .then(([leavesData, statsData, typesData, balancesData]) => {
        setLeaves(Array.isArray(leavesData) ? leavesData : []);
        setLeaveTypes(Array.isArray(typesData) ? typesData : []);
        if (Array.isArray(balancesData) && balancesData.length > 0) {
          setFullBalances(balancesData);
          setBalances(
            balancesData.map((fb: any) => ({
              type: fb.leaveType.name,
              allocated: fb.allocated,
              used: fb.used,
              remaining: fb.allocated - fb.used,
              maxDaysPerMonth: fb.leaveType.maxDaysPerMonth,
              usedThisMonth: fb.usedThisMonth,
            }))
          );
        } else {
          setBalances(statsData?.leaveBalances || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [employeeId]);

  const [leaveWarning, setLeaveWarning] = useState<{ paid: number, unpaid: number } | null>(null);

  useEffect(() => {
    if (!formData.leaveTypeId || !formData.fromDate || !formData.toDate) {
      setLeaveWarning(null);
      return;
    }
    const type = leaveTypes.find(t => t.id === formData.leaveTypeId);
    if (!type || !type.isPaid) {
      setLeaveWarning(null);
      return;
    }
    const start = new Date(formData.fromDate);
    const end = new Date(formData.toDate);
    if (end < start) {
      setLeaveWarning(null);
      return;
    }
    
    // Calculate difference in days (inclusive)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Find balance
    const balance = fullBalances.find(b => b.leaveTypeId === formData.leaveTypeId || b.leaveType?.id === formData.leaveTypeId);
    
    const yearlyAllocated = balance ? balance.allocated : type.maxDaysPerYear;
    const yearlyUsed = balance ? balance.used : 0;
    const yearlyRemaining = Math.max(0, yearlyAllocated - yearlyUsed);

    const usedThisMonth = balance?.usedThisMonth || 0;
    const monthlyRemaining = (type.maxDaysPerMonth !== null && type.maxDaysPerMonth !== undefined) 
      ? type.maxDaysPerMonth - usedThisMonth 
      : 999;
    
    const maxPaidAllowed = Math.min(yearlyRemaining, monthlyRemaining);
    
    if (totalDays > maxPaidAllowed) {
      const paid = Math.max(0, maxPaidAllowed);
      const unpaid = totalDays - paid;
      setLeaveWarning({ paid, unpaid });
    } else {
      setLeaveWarning(null);
    }
  }, [formData.leaveTypeId, formData.fromDate, formData.toDate, fullBalances, leaveTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          ...formData,
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Leave request submitted", variant: "success" });
        setShowForm(false);
        setFormData({ leaveTypeId: "", fromDate: "", toDate: "", reason: "" });
        // Refresh leaves & balances
        const [newLeaves, newBalances] = await Promise.all([
          fetch("/api/leaves").then((r) => r.json()),
          fetch("/api/leave-balances").then((r) => r.json()),
        ]);
        setLeaves(Array.isArray(newLeaves) ? newLeaves : []);
        if (Array.isArray(newBalances)) {
          setFullBalances(newBalances);
          setBalances(
            newBalances.map((fb: any) => ({
              type: fb.leaveType.name,
              allocated: fb.allocated,
              used: fb.used,
              remaining: fb.allocated - fb.used,
              maxDaysPerMonth: fb.leaveType.maxDaysPerMonth,
              usedThisMonth: fb.usedThisMonth,
            }))
          );
        }
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to submit", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to submit request", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this pending leave request?")) return;

    try {
      const res = await fetch(`/api/leaves/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Success", description: "Request cancelled", variant: "success" });
        setLeaves(leaves.filter((l) => l.id !== id));
      } else {
        toast({ title: "Error", description: "Failed to cancel request", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to cancel request", variant: "destructive" });
    }
  };

  if (!employeeId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 fade-in">
        <div className="h-20 w-20 bg-secondary/50 rounded-full flex items-center justify-center">
          <CalendarOff className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-semibold">No Profile Linked</h2>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          Your account is not linked to an employee profile. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarOff className="h-5 w-5 text-primary" />
            My Leaves
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your leave requests and balances.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Apply for Leave
        </Button>
      </div>

      {showForm && (
        <Card className="p-5 border-primary/20 bg-primary/5 fade-in">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            New Leave Request
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Leave Type</label>
                <select
                  required
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select Type...</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">From Date</label>
                <input
                  type="date"
                  required
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">To Date</label>
                <input
                  type="date"
                  required
                  value={formData.toDate}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  min={formData.fromDate}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason</label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                placeholder="Brief reason for the leave..."
              />
            </div>

            {leaveWarning && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
                <p className="text-sm text-amber-600 dark:text-amber-500 font-medium flex items-start gap-2">
                  <span className="text-lg leading-none">⚠️</span>
                  <span>
                    You have exceeded your paid leave balance. 
                    Based on your requested dates, <strong>{leaveWarning.paid} days</strong> will be Paid and <strong>{leaveWarning.unpaid} days</strong> will be Unpaid.
                  </span>
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : balances.length === 0 ? (
          <div className="col-span-3 p-4 rounded-xl border border-border text-center text-sm text-muted-foreground">
            No leave balances allocated for the current year.
          </div>
        ) : (
          balances.map((b) => (
            <div key={b.type} className="stat-card rounded-xl p-4 border border-border/50 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium">{b.type}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{b.remaining}</span>
                  <span className="text-xs text-muted-foreground">days remaining (Yearly)</span>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${(b.used / Math.max(1, b.allocated)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 mb-4">
                  <span>{b.used} used</span>
                  <span>{b.allocated} total (Year)</span>
                </div>
              </div>
              
              {b.maxDaysPerMonth ? (
                <div className="pt-3 border-t border-border/50">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">{Math.max(0, b.maxDaysPerMonth - (b.usedThisMonth || 0))}</span>
                    <span className="text-xs text-muted-foreground">days remaining (This Month)</span>
                  </div>
                  <div className="w-full bg-secondary/50 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${((b.usedThisMonth || 0) / b.maxDaysPerMonth) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{b.usedThisMonth || 0} used</span>
                    <span>{b.maxDaysPerMonth} total (Month)</span>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-border/50 text-[10px] text-muted-foreground text-center">
                  No monthly limit
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-10 mb-4 gap-4">
        <h3 className="font-semibold text-lg">Leave History</h3>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="h-9 w-full sm:w-auto rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="All">All Months</option>
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date(2000, i, 1);
              return <option key={i} value={i.toString()}>{format(d, "MMMM")}</option>;
            })}
          </select>
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="h-9 w-full sm:w-auto rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="All">All Years</option>
            {Array.from({ length: 16 }).map((_, i) => {
              const y = 2022 + i;
              return <option key={y} value={y.toString()}>{y}</option>;
            })}
          </select>
        </div>
      </div>

      {loading ? (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border"><Skeleton className="h-5 w-32" /></div>
          <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4"><Skeleton className="h-4 w-full" /></div>
            ))}
          </div>
        </Card>
      ) : leaves.filter((leave) => {
          const d = new Date(leave.fromDate);
          const matchYear = filterYear === "All" || d.getFullYear().toString() === filterYear;
          const matchMonth = filterMonth === "All" || d.getMonth().toString() === filterMonth;
          return matchYear && matchMonth;
        }).length === 0 ? (
        <Card className="overflow-hidden">
          <div className="p-12 text-center">
            <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No leave requests found for the selected period.</p>
          </div>
        </Card>
      ) : (
        Object.entries(
          leaves
            .filter((leave) => {
              const d = new Date(leave.fromDate);
              const matchYear = filterYear === "All" || d.getFullYear().toString() === filterYear;
              const matchMonth = filterMonth === "All" || d.getMonth().toString() === filterMonth;
              return matchYear && matchMonth;
            })
            .reduce((acc, leave) => {
              const monthYear = format(new Date(leave.fromDate), "MMMM yyyy");
              if (!acc[monthYear]) acc[monthYear] = [];
              acc[monthYear].push(leave);
              return acc;
            }, {} as Record<string, Leave[]>)
        ).map(([month, monthLeaves]) => (
          <Card key={month} className="overflow-hidden mt-6 fade-in">
            <div className="p-4 border-b border-border font-semibold bg-secondary/10 flex items-center justify-between">
              <span>{month}</span>
              <Badge variant="outline" className="text-xs bg-background">
                {monthLeaves.length} Request{monthLeaves.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/30 border-b border-border">
                  <tr>
                    <th className="p-4 font-medium text-muted-foreground">Date Applied</th>
                    <th className="p-4 font-medium text-muted-foreground">Type</th>
                    <th className="p-4 font-medium text-muted-foreground">Duration</th>
                    <th className="p-4 font-medium text-muted-foreground">Days</th>
                    <th className="p-4 font-medium text-muted-foreground">Status</th>
                    <th className="p-4 font-medium text-muted-foreground text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {monthLeaves.map((leave) => (
                    <tr key={leave.id} className="border-b border-border/50 table-row-hover">
                      <td className="p-4 text-muted-foreground">
                        {format(new Date(leave.createdAt), "dd MMM yyyy")}
                      </td>
                      <td className="p-4 font-medium">
                        {leave.leaveType.name}
                        {!leave.leaveType.isPaid && (
                          <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1 border-red-500/30 text-red-500">Unpaid</Badge>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {format(new Date(leave.fromDate), "dd MMM")} - {format(new Date(leave.toDate), "dd MMM, yyyy")}
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{leave.totalDays}</div>
                        {(leave.unpaidDays ?? 0) > 0 && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 font-semibold">
                            {leave.paidDays} Paid, {leave.unpaidDays} Unpaid
                          </div>
                        )}
                        {(leave.unpaidDays === 0) && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {leave.totalDays} Paid
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant={statusVariant[leave.status] || "default"}>
                          {leave.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {leave.status === "PENDING" && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(leave.id)} className="text-red-400 hover:text-red-500 hover:bg-red-500/10">
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
