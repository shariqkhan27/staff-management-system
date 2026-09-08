"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toaster";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUser } from "@/lib/user-context";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  CreditCard,
  Hash,
  User,
  Clock,
  FileText,
  Download,
  Trash2,
  Upload,
} from "lucide-react";

interface EmployeeDetail {
  id: string;
  employeeId: string;
  name: string;
  cnic: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  address: string | null;
  dateOfBirth: string | null;
  joiningDate: string;
  designation: string | null;
  employmentType: string;
  basicSalary: string;
  bankAccountTitle: string | null;
  bankAccountNo: string | null;
  bankName: string | null;
  bankBranch: string | null;
  status: string;
  createdAt: string;
  department: { id: string; name: string } | null;
  user: { id: string; email: string; role: string; isActive: boolean } | null;
  documents: { id: string; type: string; fileName: string; fileUrl: string; uploadedAt: string }[];
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "default"> = {
  ACTIVE: "success",
  ON_LEAVE: "warning",
  TERMINATED: "destructive",
  RESIGNED: "default",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  TERMINATED: "Terminated",
  RESIGNED: "Resigned",
};

const typeLabel: Record<string, string> = {
  FULL_TIME: "Full-Time",
  PART_TIME: "Part-Time",
  CONTRACT: "Contract",
};

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("CNIC");
  const { toast } = useToast();
  const { role: userRole } = useUser();
  const isOwner = userRole === "OWNER";
  const isHR = userRole === "HR_MANAGER";
  const canManageDocs = isOwner || isHR;

  const fetchEmployee = useCallback(() => {
    fetch(`/api/employees/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setEmployee)
      .catch(() => router.push("/employees"))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "employees");

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);

      const docRes = await fetch(`/api/employees/${params.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: docType,
          fileName: uploadData.originalName,
          fileUrl: uploadData.url
        })
      });

      if (!docRes.ok) throw new Error("Failed to save document record");

      toast({ title: "Success", description: "Document uploaded successfully", variant: "success" });
      fetchEmployee();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to upload document", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      const res = await fetch(`/api/employees/${params.id}/documents?documentId=${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Success", description: "Document deleted", variant: "success" });
      fetchEmployee();
    } catch {
      toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!employee) return null;

  const infoItems = [
    { icon: Hash, label: "Employee ID", value: employee.employeeId },
    { icon: Phone, label: "Phone", value: employee.phone },
    { icon: Mail, label: "Email", value: employee.email },
    { icon: MapPin, label: "Address", value: employee.address },
    {
      icon: Calendar,
      label: "Date of Birth",
      value: employee.dateOfBirth ? formatDate(employee.dateOfBirth) : null,
    },
    { icon: Hash, label: "CNIC", value: employee.cnic },
  ];

  const employmentItems = [
    { icon: Briefcase, label: "Designation", value: employee.designation },
    { icon: Building2, label: "Department", value: employee.department?.name },
    { icon: User, label: "Type", value: typeLabel[employee.employmentType] },
    {
      icon: Calendar,
      label: "Joining Date",
      value: formatDate(employee.joiningDate),
    },
    {
      icon: Clock,
      label: "Tenure",
      value: (() => {
        const start = new Date(employee.joiningDate);
        const now = new Date();
        const months =
          (now.getFullYear() - start.getFullYear()) * 12 +
          (now.getMonth() - start.getMonth());
        const years = Math.floor(months / 12);
        const rem = months % 12;
        return years > 0
          ? `${years} year${years > 1 ? "s" : ""} ${rem} month${rem !== 1 ? "s" : ""}`
          : `${rem} month${rem !== 1 ? "s" : ""}`;
      })(),
    },
  ];

  return (
    <div className="space-y-6 fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{employee.name}</h2>
            <p className="text-sm text-muted-foreground">
              {employee.employeeId} • {employee.designation || "No designation"}
            </p>
          </div>
        </div>
        <Link href={`/employees/${employee.id}/edit`}>
          <Button>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="glass-card">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar
              src={employee.photoUrl}
              fallback={employee.name}
              size="xl"
              className="mb-4"
            />
            <h3 className="text-lg font-semibold">{employee.name}</h3>
            <p className="text-sm text-muted-foreground">
              {employee.designation || "—"}
            </p>
            <Badge
              variant={statusVariant[employee.status]}
              className="mt-3"
            >
              {statusLabel[employee.status]}
            </Badge>

            <div className="w-full mt-6 pt-6 border-t border-border space-y-3 text-left">
              {isOwner && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Basic Salary</span>
                <span className="font-semibold">
                  {formatCurrency(employee.basicSalary)}
                </span>
              </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Department</span>
                <span>{employee.department?.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span>{typeLabel[employee.employmentType]}</span>
              </div>
            </div>

            {employee.user && (
              <div className="w-full mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Login Account</p>
                <p className="text-sm">{employee.user.email}</p>
                <Badge
                  variant={employee.user.isActive ? "success" : "destructive"}
                  className="mt-1"
                >
                  {employee.user.isActive ? "Active" : "Disabled"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info — Owner Only */}
          {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {infoItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-sm">{item.value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Employment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employmentItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-sm">{item.value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bank Details — Owner Only */}
          {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Account Title</p>
                  <p className="text-sm">{employee.bankAccountTitle || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="text-sm">{employee.bankAccountNo || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bank</p>
                  <p className="text-sm">{employee.bankName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Branch</p>
                  <p className="text-sm">{employee.bankBranch || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Documents
              </CardTitle>
              {canManageDocs && (
                <div className="flex items-center gap-2">
                  <select 
                    className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    <option value="CNIC">CNIC</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <label className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    {uploading ? 'Uploading...' : 'Upload'}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} accept="image/*,.pdf,.doc,.docx" />
                  </label>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              {employee.documents && employee.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {employee.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:border-border transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-secondary/50 rounded-md">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.fileName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] h-4 py-0">{doc.type}</Badge>
                            <span className="text-[10px] text-muted-foreground">{formatDate(doc.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" download>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                        {canManageDocs && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteDoc(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No documents attached to this employee.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
