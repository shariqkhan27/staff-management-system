"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, ConfirmDialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toaster";
import { useUser } from "@/lib/user-context";
import { Plus, Building2, Users, Pencil, Trash2, Crown } from "lucide-react";

interface Department {
  id: string;
  name: string;
  headEmployeeId: string | null;
  headEmployee: { id: string; name: string; employeeId: string } | null;
  _count: { employees: number };
}

interface Employee {
  id: string;
  name: string;
  employeeId: string;
}

export default function DepartmentsPage() {
  const { toast } = useToast();
  const { role: userRole } = useUser();
  const isOwner = userRole === "OWNER";
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formHead, setFormHead] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/employees?limit=100"),
      ]);
      const deptData = await deptRes.json();
      const empData = await empRes.json();
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setEmployees(empData.employees || []);
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditId(null);
    setFormName("");
    setFormHead("");
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditId(dept.id);
    setFormName(dept.name);
    setFormHead(dept.headEmployeeId || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast({ title: "Error", description: "Department name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const url = editId ? `/api/departments/${editId}` : "/api/departments";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, headEmployeeId: formHead }),
      });

      if (res.ok) {
        toast({
          title: editId ? "Updated" : "Created",
          description: `Department ${editId ? "updated" : "created"} successfully`,
          variant: "success",
        });
        setShowModal(false);
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/departments/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Deleted", description: "Department deleted successfully", variant: "success" });
        fetchData();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Departments
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage organizational departments
          </p>
        </div>
        {isOwner && (
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : departments.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No departments yet</p>
          {isOwner && (
          <Button variant="outline" size="sm" className="mt-3" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Department
          </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id} className="stat-card border-border hover:border-primary/30">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{dept.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {dept._count.employees} employee{dept._count.employees !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isOwner && (
                    <Button variant="ghost" size="icon" onClick={() => openEdit(dept)} className="h-8 w-8">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    )}
                    {isOwner && (
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(dept.id)} className="h-8 w-8 text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    )}
                  </div>
                </div>

                {dept.headEmployee && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Crown className="h-3.5 w-3.5 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">Head:</span>
                      <span className="text-sm font-medium">{dept.headEmployee.name}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogHeader>
          <DialogTitle>{editId ? "Edit" : "Add"} Department</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deptName">Department Name *</Label>
              <Input
                id="deptName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Construction"
              />
            </div>
            <div>
              <Label htmlFor="deptHead">Department Head</Label>
              <select
                id="deptHead"
                value={formHead}
                onChange={(e) => setFormHead(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No Head Assigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowModal(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editId ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Department"
        description="Are you sure you want to delete this department? This cannot be undone. Note: You cannot delete a department that has employees assigned to it."
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
}
