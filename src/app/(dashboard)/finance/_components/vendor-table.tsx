"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

export default function VendorTable() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    email: "",
    address: "",
    paymentType: "BANK_TRANSFER",
    outstandingAmount: "0"
  });

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/finance/vendors");
      if (res.ok) setVendors(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      contact: "",
      email: "",
      address: "",
      paymentType: "BANK_TRANSFER",
      outstandingAmount: "0"
    });
    setEditMode(false);
    setSelectedId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setOpen(true);
  };

  const handleEditClick = (v: any) => {
    setFormData({
      name: v.name,
      contact: v.contact || "",
      email: v.email || "",
      address: v.address || "",
      paymentType: v.paymentType,
      outstandingAmount: v.outstandingAmount?.toString() || "0"
    });
    setEditMode(true);
    setSelectedId(v.id);
    setOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/finance/vendors/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Deleted", description: "Vendor deleted successfully." });
      fetchVendors();
    } catch (error) {
      toast({ title: "Error", description: "Could not delete vendor.", variant: "destructive" });
    } finally {
      setDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editMode ? `/api/finance/vendors/${selectedId}` : "/api/finance/vendors";
      const method = editMode ? "PUT" : "POST";
      
      const payload = {
        ...formData,
        outstandingAmount: parseFloat(formData.outstandingAmount || "0")
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save vendor");

      toast({ title: "Success", description: `Vendor ${editMode ? 'updated' : 'created'}.` });
      setOpen(false);
      fetchVendors();
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Could not save vendor.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search vendors..." className="pl-8 bg-card w-full" />
        </div>
        <Button onClick={handleOpenAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Vendor
        </Button>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Vendor Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Payment Pref</th>
                <th className="px-6 py-4 text-right">Outstanding</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No vendors found.</td>
                </tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-bold">{v.name}</td>
                    <td className="px-6 py-4">{v.contact || "-"}</td>
                    <td className="px-6 py-4 text-muted-foreground">{v.email || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {v.paymentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-500">
                      PKR {Number(v.outstandingAmount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(v)}>
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(v.id)}>
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
            <DialogTitle>{editMode ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vendor / Company Name</label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Person / Phone</label>
                <Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred Payment Type</label>
                <select 
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.paymentType} 
                  onChange={e => setFormData({...formData, paymentType: e.target.value})}
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="ONLINE">Online</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Outstanding Balance (PKR)</label>
                <Input type="number" step="0.01" value={formData.outstandingAmount} onChange={e => setFormData({...formData, outstandingAmount: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">{editMode ? "Update Vendor" : "Save Vendor"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vendor? This action cannot be undone.
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
