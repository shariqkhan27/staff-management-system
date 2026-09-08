"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import { format } from "date-fns";
import { Check, X, Clock, CalendarDays, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeaveRequest {
  id: string;
  employee: { name: string; employeeId: string };
  leaveType: { name: string; isPaid: boolean };
  fromDate: string;
  toDate: string;
  totalDays: number;
  paidDays?: number;
  unpaidDays?: number;
  reason: string;
  reviewComment?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const statusVariant: Record<string, "success" | "destructive" | "warning"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export default function AdminLeaves() {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Edit Modal State
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [editStatus, setEditStatus] = useState<"APPROVED" | "REJECTED" | "PENDING">("APPROVED");
  const [editDays, setEditDays] = useState<number>(1);
  const [editComment, setEditComment] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaves");
      const data = await res.json();
      setLeaves(data);
    } catch {
      toast({ title: "Error", description: "Failed to load leaves", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleQuickAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/leaves/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: "Success", description: `Leave request ${status.toLowerCase()}`, variant: "success" });
        fetchLeaves();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Action failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenEdit = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setEditStatus(leave.status);
    setEditDays(leave.totalDays);
    setEditComment(leave.reviewComment || "");
    setDialogOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave) return;

    setProcessingId(selectedLeave.id);
    try {
      const res = await fetch(`/api/leaves/${selectedLeave.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          approvedDays: Number(editDays),
          reviewComment: editComment,
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Leave request updated successfully", variant: "success" });
        setDialogOpen(false);
        fetchLeaves();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Update failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Leave Requests
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review, edit, and approve or reject employee leave requests
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Employee
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Leave Detail
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reason
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading leaves...</td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No leave requests found.</td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-border/50 table-row-hover">
                    <td className="p-4">
                      <p className="font-medium text-sm">{leave.employee.name}</p>
                      <p className="text-xs text-muted-foreground">{leave.employee.employeeId}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium">{leave.leaveType.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(leave.fromDate), "MMM d, yyyy")} - {format(new Date(leave.toDate), "MMM d, yyyy")}
                      </p>
                      <p className="text-xs font-semibold mt-0.5">{leave.totalDays} Day(s)</p>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate" title={leave.reason}>
                      {leave.reason || "—"}
                    </td>
                    <td className="p-4">
                      <Badge variant={statusVariant[leave.status]}>
                        {leave.status === "PENDING" && <Clock className="w-3 h-3 mr-1 inline" />}
                        {leave.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {leave.status === "PENDING" && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20"
                              onClick={() => handleQuickAction(leave.id, "APPROVED")}
                              disabled={processingId === leave.id}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 border-red-500/20"
                              onClick={() => handleQuickAction(leave.id, "REJECTED")}
                              disabled={processingId === leave.id}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(leave)}
                          disabled={processingId === leave.id}
                          className="h-8 px-2 text-xs"
                          title="Edit Leave / Adjust Days / Change Status"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Leave Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Edit Leave Request</DialogTitle>
          </DialogHeader>
          {selectedLeave && (
            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div className="p-3 bg-secondary/30 rounded-lg text-sm space-y-1 border border-border">
                <p><strong>Employee:</strong> {selectedLeave.employee.name} ({selectedLeave.employee.employeeId})</p>
                <p><strong>Leave Type:</strong> {selectedLeave.leaveType.name}</p>
                <p><strong>Dates Requested:</strong> {format(new Date(selectedLeave.fromDate), "MMM d, yyyy")} - {format(new Date(selectedLeave.toDate), "MMM d, yyyy")}</p>
                <p><strong>Reason:</strong> {selectedLeave.reason || "N/A"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as "APPROVED" | "REJECTED" | "PENDING")}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Approved Days</label>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={editDays}
                    onChange={(e) => setEditDays(Number(e.target.value))}
                    className="w-full h-10"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Override total days approved (e.g. 3 or 4 days instead of 5).
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Admin Note / Comment (Optional)</label>
                <Input
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Reason for change or comment..."
                  className="w-full h-10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={processingId === selectedLeave.id}>
                  {processingId === selectedLeave.id ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
