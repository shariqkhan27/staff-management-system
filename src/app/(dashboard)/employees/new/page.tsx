"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import {
  ArrowLeft,
  Save,
  User,
  Briefcase,
  Building2,
  CreditCard,
  KeyRound,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);

  const [form, setForm] = useState({
    name: "",
    cnic: "",
    phone: "",
    email: "",
    address: "",
    dateOfBirth: "",
    joiningDate: new Date().toISOString().split("T")[0],
    designation: "",
    departmentId: "",
    employmentType: "FULL_TIME",
    basicSalary: "",
    bankAccountTitle: "",
    bankAccountNo: "",
    bankName: "",
    bankBranch: "",
    accountEmail: "",
    accountPassword: "",
    role: "EMPLOYEE",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.joiningDate) errs.joiningDate = "Joining date is required";
    if (form.basicSalary && isNaN(Number(form.basicSalary)))
      errs.basicSalary = "Must be a number";
    if (
      form.cnic &&
      !/^\d{5}-\d{7}-\d{1}$/.test(form.cnic)
    )
      errs.cnic = "Format: XXXXX-XXXXXXX-X";
    if (createAccount) {
      if (!form.accountEmail) errs.accountEmail = "Email is required for login account";
      if (!form.accountPassword || form.accountPassword.length < 6)
        errs.accountPassword = "Password must be at least 6 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          basicSalary: Number(form.basicSalary) || 0,
          createAccount,
        }),
      });

      if (res.ok) {
        toast({
          title: "Employee Created",
          description: "New employee has been added successfully",
          variant: "success",
        });
        router.push("/employees");
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "Failed to create employee",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Add New Employee</h2>
          <p className="text-sm text-muted-foreground">
            Fill in the details below to add a new team member
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
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
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Muhammad Ahmed Khan"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cnic">CNIC</Label>
              <Input
                id="cnic"
                name="cnic"
                value={form.cnic}
                onChange={handleChange}
                placeholder="42201-1234567-1"
              />
              {errors.cnic && (
                <p className="text-xs text-destructive mt-1">{errors.cnic}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="03001234567"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="ahmed@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Full address"
                rows={2}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* Employment Details */}
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
              <Input
                id="designation"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="e.g. Site Engineer"
              />
            </div>

            <div>
              <Label htmlFor="departmentId">Department</Label>
              <select
                id="departmentId"
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="employmentType">Employment Type</Label>
              <select
                id="employmentType"
                name="employmentType"
                value={form.employmentType}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>

            <div>
              <Label htmlFor="joiningDate">Joining Date *</Label>
              <Input
                id="joiningDate"
                name="joiningDate"
                type="date"
                value={form.joiningDate}
                onChange={handleChange}
                className={errors.joiningDate ? "border-destructive" : ""}
              />
              {errors.joiningDate && (
                <p className="text-xs text-destructive mt-1">
                  {errors.joiningDate}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="basicSalary">Basic Salary (PKR)</Label>
              <Input
                id="basicSalary"
                name="basicSalary"
                type="number"
                value={form.basicSalary}
                onChange={handleChange}
                placeholder="50000"
                className={errors.basicSalary ? "border-destructive" : ""}
              />
              {errors.basicSalary && (
                <p className="text-xs text-destructive mt-1">
                  {errors.basicSalary}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
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
              <Input
                id="bankAccountTitle"
                name="bankAccountTitle"
                value={form.bankAccountTitle}
                onChange={handleChange}
                placeholder="Muhammad Ahmed Khan"
              />
            </div>
            <div>
              <Label htmlFor="bankAccountNo">Account Number</Label>
              <Input
                id="bankAccountNo"
                name="bankAccountNo"
                value={form.bankAccountNo}
                onChange={handleChange}
                placeholder="1234567890"
              />
            </div>
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                placeholder="e.g. HBL, UBL, Meezan"
              />
            </div>
            <div>
              <Label htmlFor="bankBranch">Branch</Label>
              <Input
                id="bankBranch"
                name="bankBranch"
                value={form.bankBranch}
                onChange={handleChange}
                placeholder="e.g. Gulshan Branch"
              />
            </div>
          </CardContent>
        </Card>

        {/* Login Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Login Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <input
                id="createAccount"
                type="checkbox"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <Label htmlFor="createAccount" className="cursor-pointer">
                Create a login account for this employee
              </Label>
            </div>

            {createAccount && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 fade-in">
                <div>
                  <Label htmlFor="accountEmail">Login Email *</Label>
                  <Input
                    id="accountEmail"
                    name="accountEmail"
                    type="email"
                    value={form.accountEmail}
                    onChange={handleChange}
                    placeholder="ahmed@elegence.com"
                    className={errors.accountEmail ? "border-destructive" : ""}
                  />
                  {errors.accountEmail && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.accountEmail}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="accountPassword">Password *</Label>
                  <Input
                    id="accountPassword"
                    name="accountPassword"
                    type="password"
                    value={form.accountPassword}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className={errors.accountPassword ? "border-destructive" : ""}
                  />
                  {errors.accountPassword && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.accountPassword}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="FINANCE_MANAGER">Finance Manager</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Create Employee
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
