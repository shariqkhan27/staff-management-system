"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { format } from "date-fns";
import { Clock, Check, X, Calendar, FileText, Send } from "lucide-react";

interface EmployeeLeavesProps {
  employeeId: string;
}

interface LeaveRequest {
  id: string;
  leaveType: { name: string; isPaid: boolean };
  fromDate: string;
  toDate: string;
  totalDays: number;
  paidDays?: number;
  unpaidDays?: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface LeaveBalance {
  id: string;
  leaveType: { id: string; name: string; maxDaysPerYear: number; maxDaysPerMonth?: number | null; isPaid: boolean };
  allocated: number;
  used: number;
  usedThisMonth?: number;
}

const statusVariant: Record<string, "success" | "destructive" | "warning"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export default function EmployeeLeaves({ employeeId }: EmployeeLeavesProps) {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; name: string; maxDaysPerYear: number; maxDaysPerMonth: number | null; isPaid: boolean }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });

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
    const balance = balances.find(b => b.leaveType.id === formData.leaveTypeId);
    
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
  }, [formData.leaveTypeId, formData.fromDate, formData.toDate, balances, leaveTypes]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [leavesRes, balancesRes, typesRes] = await Promise.all([
        fetch(`/api/leaves?employeeId=${employeeId}`),
        fetch(`/api/leave-balances?employeeId=${employeeId}`),
        fetch(`/api/leave-types`),
      ]);

      setLeaves(await leavesRes.json());
      setBalances(await balancesRes.json());
      setLeaveTypes(await typesRes.json());
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [employeeId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, employeeId }),
      });
      
      if (res.ok) {
        toast({ title: "Success", description: "Leave request submitted", variant: "success" });
        setOpen(false);
        setFormData({ leaveTypeId: "", fromDate: "", toDate: "", reason: "" });
        fetchData(); // Refresh list
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Submission failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            My Leaves
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your time off and view balances
          </p>
        </div>
        
        <Button onClick={() => setOpen(true)}>
          <Send className="h-4 w-4 mr-2" />
          Request Leave
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Time Off</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Leave Type</label>
                <select
                  required
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                >
                  <option value="">Select type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <Input 
                    type="date" 
                    required 
                    value={formData.fromDate}
                    onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <Input 
                    type="date" 
                    required 
                    value={formData.toDate}
                    onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <textarea
                  required
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Reason for leave..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balances */}
      {balances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {balances.map((balance) => {
            const remaining = balance.allocated - balance.used;
            return (
              <Card key={balance.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{balance.leaveType.name}</p>
                  <h3 className="text-2xl font-bold mt-1">{remaining} <span className="text-sm font-normal text-muted-foreground">days left</span></h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Allocated: {balance.allocated}</p>
                  <p className="text-xs text-muted-foreground">Used: {balance.used}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 bg-secondary/30 border-b border-border flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Request History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Dates
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Days
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reason
                </th>
                <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No leave requests found.</td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-border/50">
                    <td className="p-4 font-medium text-sm">{leave.leaveType.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(leave.fromDate), "MMM d, yyyy")} - {format(new Date(leave.toDate), "MMM d, yyyy")}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{leave.totalDays} Day(s)</div>
                      {(leave.unpaidDays ?? 0) > 0 && (
                        <div className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                          {leave.paidDays} Paid, {leave.unpaidDays} Unpaid
                        </div>
                      )}
                      {(leave.unpaidDays === 0) && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {leave.totalDays} Paid
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate">{leave.reason}</td>
                    <td className="p-4 text-right">
                      <Badge variant={statusVariant[leave.status]}>
                        {leave.status === "PENDING" && <Clock className="w-3 h-3 mr-1 inline" />}
                        {leave.status === "APPROVED" && <Check className="w-3 h-3 mr-1 inline" />}
                        {leave.status === "REJECTED" && <X className="w-3 h-3 mr-1 inline" />}
                        {leave.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
