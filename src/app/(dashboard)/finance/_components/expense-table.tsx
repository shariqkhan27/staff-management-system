"use client";

import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toaster";
import { Plus, Search, Paperclip, Loader2, Trash2, Edit, Download } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { exportToCSV } from "@/lib/csv-export";

export default function ExpenseTable() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    receiptUrl: ""
  });

  const fetchData = async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        fetch("/api/finance/expenses"),
        fetch("/api/finance/expense-categories")
      ]);
      if (expRes.ok) setExpenses(await expRes.json());
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats);
        // Only set default categoryId if not in edit mode
        if (cats.length > 0 && !formData.categoryId) {
          setFormData(prev => ({ ...prev, categoryId: cats[0].id }));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      categoryId: categories.length > 0 ? categories[0].id : "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      receiptUrl: ""
    });
    setEditMode(false);
    setSelectedId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setOpen(true);
  };

  const handleEditClick = (exp: any) => {
    setFormData({
      categoryId: exp.categoryId || "",
      amount: exp.amount,
      date: new Date(exp.date).toISOString().split("T")[0],
      description: exp.description || "",
      receiptUrl: exp.receiptUrl || ""
    });
    setEditMode(true);
    setSelectedId(exp.id);
    setOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/finance/expenses/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Deleted", description: "Expense deleted successfully." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Could not delete record.", variant: "destructive" });
    } finally {
      setDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, receiptUrl: result.url }));
        toast({ title: "Receipt uploaded!" });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    try {
      const res = await fetch("/api/finance/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setFormData(prev => ({ ...prev, categoryId: newCat.id }));
        setIsAddingCategory(false);
        setNewCategoryName("");
        toast({ title: "Category added!" });
      } else {
        toast({ title: "Failed to add category", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editMode ? `/api/finance/expenses/${selectedId}` : "/api/finance/expenses";
      const method = editMode ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        }),
      });

      if (!res.ok) throw new Error("Failed to save expense");

      toast({ title: "Success", description: `Expense ${editMode ? 'updated' : 'recorded'}.` });
      setOpen(false);
      fetchData();
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Could not record expense.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 fade-in">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." className="pl-8 bg-card w-full" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => {
            if (expenses.length === 0) return;
            const csvData = expenses.map(exp => ({
              Date: format(new Date(exp.date), "yyyy-MM-dd"),
              Category: exp.category?.name,
              Description: exp.description || "",
              "Amount (PKR)": exp.amount,
              "Added By": exp.addedBy?.email
            }));
            exportToCSV(csvData, `Expenses_Export_${format(new Date(), "yyyyMMdd")}`);
          }}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={handleOpenAdd} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Record Expense
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Receipt</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No expenses recorded.</td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{format(new Date(exp.date), "dd MMM, yyyy")}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                        {exp.category?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[300px] truncate">{exp.description || "-"}</td>
                    <td className="px-6 py-4">
                      {exp.receiptUrl ? (
                        <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-xs">
                          <Paperclip className="h-3 w-3" /> View
                        </a>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-red-500">
                      - PKR {Number(exp.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(exp)}>
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(exp.id)}>
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
            <DialogTitle>{editMode ? "Edit Expense" : "Record Expense"}</DialogTitle>
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Category</label>
                <button type="button" onClick={() => setIsAddingCategory(!isAddingCategory)} className="text-xs text-blue-500 hover:underline">
                  {isAddingCategory ? "Cancel" : "+ New Category"}
                </button>
              </div>
              
              {isAddingCategory ? (
                <div className="flex gap-2">
                  <Input placeholder="Category Name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
                  <Button type="button" onClick={handleAddCategory}>Add</Button>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-sm text-destructive">Please add expense categories first.</div>
              ) : (
                <select 
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.categoryId} 
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  required
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="e.g. Office electricity bill" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Receipt</label>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,.pdf"
                  onChange={handleFileUpload} 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Paperclip className="h-4 w-4 mr-2" />}
                  {uploading ? "Uploading..." : "Attach Receipt"}
                </Button>
                {formData.receiptUrl && (
                  <span className="text-sm text-green-500 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Uploaded
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={categories.length === 0 || uploading}>{editMode ? "Update Record" : "Save Record"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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

const Check = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
