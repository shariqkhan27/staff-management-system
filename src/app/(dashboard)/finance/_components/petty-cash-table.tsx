"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { Plus, ArrowDownToLine, ArrowUpFromLine, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function PettyCashTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"CREDIT" | "DEBIT">("DEBIT");
  
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: ""
  });

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/finance/petty-cash");
      if (res.ok) setLogs(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: ""
    });
    setEditMode(false);
    setSelectedId(null);
  };

  const handleOpenAdd = (newType: "CREDIT" | "DEBIT") => {
    resetForm();
    setType(newType);
    setOpen(true);
  };

  const handleEditClick = (log: any) => {
    const isCredit = Number(log.credit) > 0;
    setType(isCredit ? "CREDIT" : "DEBIT");
    setFormData({
      date: new Date(log.date).toISOString().split("T")[0],
      description: log.description,
      amount: isCredit ? log.credit.toString() : log.debit.toString()
    });
    setEditMode(true);
    setSelectedId(log.id);
    setOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/finance/petty-cash/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Deleted", description: "Petty cash log deleted." });
      fetchLogs();
    } catch (error) {
      toast({ title: "Error", description: "Could not delete log.", variant: "destructive" });
    } finally {
      setDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(formData.amount);
      const url = editMode ? `/api/finance/petty-cash/${selectedId}` : "/api/finance/petty-cash";
      const method = editMode ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          description: formData.description,
          credit: type === "CREDIT" ? amount : 0,
          debit: type === "DEBIT" ? amount : 0,
        }),
      });

      if (!res.ok) throw new Error("Failed to save log");

      toast({ title: "Success", description: `Petty cash log ${editMode ? 'updated' : 'recorded'}.` });
      setOpen(false);
      fetchLogs();
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Could not save log.", variant: "destructive" });
    }
  };

  const currentBalance = logs.length > 0 ? Number(logs[0].balance) : 0;

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex flex-col text-center sm:text-left">
          <span className="text-xs text-primary font-semibold uppercase tracking-wider">Current Balance</span>
          <span className="text-2xl font-bold">PKR {currentBalance.toLocaleString()}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto text-green-500 border-green-500/30 hover:bg-green-500/10" onClick={() => handleOpenAdd("CREDIT")}>
            <ArrowDownToLine className="mr-2 h-4 w-4" /> Add Funds
          </Button>
          <Button variant="outline" className="w-full sm:w-auto text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={() => handleOpenAdd("DEBIT")}>
            <ArrowUpFromLine className="mr-2 h-4 w-4" /> Record Expense
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">In (Credit)</th>
                <th className="px-6 py-4 text-right">Out (Debit)</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No petty cash records found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{format(new Date(log.date), "dd MMM, yyyy")}</td>
                    <td className="px-6 py-4">{log.description}</td>
                    <td className="px-6 py-4 text-right text-green-500">{Number(log.credit) > 0 ? `+${Number(log.credit).toLocaleString()}` : "-"}</td>
                    <td className="px-6 py-4 text-right text-red-500">{Number(log.debit) > 0 ? `-${Number(log.debit).toLocaleString()}` : "-"}</td>
                    <td className="px-6 py-4 text-right font-bold">
                      PKR {Number(log.balance).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(log)}>
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(log.id)}>
                          <Trash2 className="h-4 w-4 text-destructive opacity-70 hover:opacity-100" />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? (type === "CREDIT" ? "Edit Added Funds" : "Edit Expense") : (type === "CREDIT" ? "Add Funds to Petty Cash" : "Record Petty Cash Expense")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (PKR)</label>
                <Input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="What is this for?" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="flex justify-end pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editMode ? "Update" : (type === "CREDIT" ? "Add Funds" : "Record Expense")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Petty Cash Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this log? This will recalculate all subsequent balances.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
