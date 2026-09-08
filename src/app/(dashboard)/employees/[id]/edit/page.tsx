"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toaster";
import { ArrowLeft, Save, User, Briefcase, CreditCard } from "lucide-react";

interface Department {
  id: string;
  name: string;
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    cnic: "",
    phone: "",
    email: "",
    address: "",
    dateOfBirth: "",
    joiningDate: "",
    designation: "",
    departmentId: "",
    employmentType: "FULL_TIME",
    basicSalary: "",
    bankAccountTitle: "",
    bankAccountNo: "",
    bankName: "",
    bankBranch: "",
    status: "ACTIVE",
    role: "EMPLOYEE",
  });

  const [hasAccount, setHasAccount] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/employees/${params.id}`).then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ])
      .then(([emp, depts]) => {
        setForm({
          name: emp.name || "",
          cnic: emp.cnic || "",
          phone: emp.phone || "",
          email: emp.email || "",
          address: emp.address || "",
          dateOfBirth: emp.dateOfBirth
            ? new Date(emp.dateOfBirth).toISOString().split("T")[0]
            : "",
          joiningDate: emp.joiningDate
            ? new Date(emp.joiningDate).toISOString().split("T")[0]
            : "",
          designation: emp.designation || "",
          departmentId: emp.departmentId || "",
          employmentType: emp.employmentType || "FULL_TIME",
          basicSalary: emp.basicSalary?.toString() || "",
          bankAccountTitle: emp.bankAccountTitle || "",
          bankAccountNo: emp.bankAccountNo || "",
          bankName: emp.bankName || "",
          bankBranch: emp.bankBranch || "",
          status: emp.status || "ACTIVE",
          role: emp.user?.role || "EMPLOYEE",
        });
        setHasAccount(!!emp.user);
        setDepartments(Array.isArray(depts) ? depts : []);
        setLoading(false);
      })
      .catch(() => {
        router.push("/employees");
      });
  }, [params.id, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          basicSalary: Number(form.basicSalary) || 0,
          ...(hasAccount && { role: form.role }),
        }),
      });

      if (res.ok) {
        toast({
          title: "Updated",
          description: "Employee details updated successfully",
          variant: "success",
        });
        router.push(`/employees/${params.id}`);
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Edit Employee</h2>
          <p className="text-sm text-muted-foreground">
            Update employee details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange}
                className={errors.name ? "border-destructive" : ""} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="cnic">CNIC</Label>
              <Input id="cnic" name="cnic" value={form.cnic} onChange={handleChange} placeholder="42201-1234567-1" />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <textarea id="address" name="address" value={form.address} onChange={handleChange} rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Employment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" name="designation" value={form.designation} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="departmentId">Department</Label>
              <select id="departmentId" name="departmentId" value={form.departmentId} onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="employmentType">Type</Label>
              <select id="employmentType" name="employmentType" value={form.employmentType} onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
            <div>
              <Label htmlFor="joiningDate">Joining Date</Label>
              <Input id="joiningDate" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="basicSalary">Basic Salary (PKR)</Label>
              <Input id="basicSalary" name="basicSalary" type="number" value={form.basicSalary} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" value={form.status} onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
                <option value="RESIGNED">Resigned</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Bank */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankAccountTitle">Account Title</Label>
              <Input id="bankAccountTitle" name="bankAccountTitle" value={form.bankAccountTitle} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="bankAccountNo">Account Number</Label>
              <Input id="bankAccountNo" name="bankAccountNo" value={form.bankAccountNo} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input id="bankName" name="bankName" value={form.bankName} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="bankBranch">Branch</Label>
              <Input id="bankBranch" name="bankBranch" value={form.bankBranch} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        {hasAccount && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                System Access & Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="md:w-1/2">
                <Label htmlFor="role">Role / Permissions</Label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                >
                  <option value="EMPLOYEE">Regular Employee</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="FINANCE_MANAGER">Finance Manager</option>
                  <option value="OWNER">Owner / Admin</option>
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  Granting HR Manager access allows this employee to manage attendance, payroll, and finances.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
