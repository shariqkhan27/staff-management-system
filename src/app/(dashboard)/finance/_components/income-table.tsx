"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { Plus, Download, FileText, Search, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { exportToCSV } from "@/lib/csv-export";

export default function IncomeTable() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    source: "",
    clientName: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    tenderReference: "",
    notes: ""
  });

  const fetchIncomes = async () => {
    try {
      const res = await fetch("/api/finance/income");
      const data = await res.json();
      if (res.ok) setIncomes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const resetForm = () => {
    setFormData({
      source: "",
      clientName: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "CASH",
      tenderReference: "",
      notes: ""
    });
    setEditMode(false);
    setSelectedId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setOpen(true);
  };

  const handleEditClick = (inc: any) => {
    setFormData({
      source: inc.source,
      clientName: inc.clientName || "",
      amount: inc.amount,
      date: new Date(inc.date).toISOString().split("T")[0],
      paymentMethod: inc.paymentMethod,
      tenderReference: inc.tenderReference || "",
      notes: inc.notes || ""
    });
    setEditMode(true);
    setSelectedId(inc.id);
    setOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/finance/income/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Deleted", description: "Record deleted successfully." });
      fetchIncomes();
    } catch (error) {
      toast({ title: "Error", description: "Could not delete record.", variant: "destructive" });
    } finally {
      setDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editMode ? `/api/finance/income/${selectedId}` : "/api/finance/income";
      const method = editMode ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });

      if (!res.ok) throw new Error("Failed to save income");

      toast({ title: "Success", description: `Income record ${editMode ? 'updated' : 'added'}.` });
      setOpen(false);
      fetchIncomes();
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Could not save income.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search records..." className="pl-8 bg-card w-full" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => {
            if (incomes.length === 0) return;
            const csvData = incomes.map(inc => ({
              Date: format(new Date(inc.date), "yyyy-MM-dd"),
              Source: inc.source,
              "Client Name": inc.clientName || "",
              "Tender Reference": inc.tenderReference || "",
              "Payment Method": inc.paymentMethod,
              "Amount (PKR)": inc.amount,
              Notes: inc.notes || ""
            }));
            exportToCSV(csvData, `Income_Export_${format(new Date(), "yyyyMMdd")}`);
          }}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={handleOpenAdd} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Add Income
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Client / Tender</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : incomes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No income records found.</td>
                </tr>
              ) : (
                incomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{format(new Date(inc.date), "dd MMM, yyyy")}</td>
                    <td className="px-6 py-4">{inc.source}</td>
                    <td className="px-6 py-4">
                      {inc.clientName || "-"}
                      {inc.tenderReference && <span className="block text-xs text-muted-foreground">{inc.tenderReference}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {inc.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-500">
                      + PKR {Number(inc.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(inc)}>
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(inc.id)}>
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
            <DialogTitle>{editMode ? "Edit Income Record" : "Add Income Record"}</DialogTitle>
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
              <label className="text-sm font-medium">Source</label>
              <Input placeholder="e.g. Design Consultation" required value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Client Name</label>
                <Input value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tender Reference</label>
                <Input value={formData.tenderReference} onChange={e => setFormData({...formData, tenderReference: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <select 
                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.paymentMethod} 
                onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
            <div className="flex justify-end pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editMode ? "Update Record" : "Save Record"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Income Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
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
