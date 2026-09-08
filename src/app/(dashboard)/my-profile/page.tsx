"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/lib/user-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  User,
  Briefcase,
  Hash,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  CreditCard,
  Clock,
} from "lucide-react";

interface MyProfile {
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
  department: { name: string } | null;
  user: { email: string; isActive: boolean } | null;
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

export default function MyProfilePage() {
  const { employeeId } = useUser();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    fetch(`/api/employees/${employeeId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 fade-in">
        <div className="h-20 w-20 bg-secondary/50 rounded-full flex items-center justify-center">
          <User className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-semibold">Profile Not Found</h2>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          Your account is not linked to an employee profile. Please contact your administrator.
        </p>
      </div>
    );
  }

  const infoItems = [
    { icon: Hash, label: "Employee ID", value: profile.employeeId },
    { icon: Phone, label: "Phone", value: profile.phone },
    { icon: Mail, label: "Personal Email", value: profile.email },
    { icon: MapPin, label: "Address", value: profile.address },
    { icon: Calendar, label: "Date of Birth", value: profile.dateOfBirth ? formatDate(profile.dateOfBirth) : null },
    { icon: Hash, label: "CNIC", value: profile.cnic },
  ];

  const employmentItems = [
    { icon: Briefcase, label: "Designation", value: profile.designation },
    { icon: Building2, label: "Department", value: profile.department?.name },
    { icon: User, label: "Type", value: typeLabel[profile.employmentType] },
    { icon: Calendar, label: "Joining Date", value: formatDate(profile.joiningDate) },
    {
      icon: Clock,
      label: "Tenure",
      value: (() => {
        const start = new Date(profile.joiningDate);
        const now = new Date();
        const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
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
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">My Profile</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Profile */}
        <Card className="glass-card">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar
              src={profile.photoUrl}
              fallback={profile.name}
              size="xl"
              className="mb-4 shadow-sm border-2 border-primary/10"
            />
            <h3 className="text-lg font-semibold">{profile.name}</h3>
            <p className="text-sm text-muted-foreground">{profile.designation || "—"}</p>
            <Badge variant={statusVariant[profile.status]} className="mt-3">
              {statusLabel[profile.status]}
            </Badge>

            <div className="w-full mt-6 pt-6 border-t border-border space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Basic Salary</span>
                <span className="font-semibold text-primary">
                  {formatCurrency(profile.basicSalary)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Department</span>
                <span>{profile.department?.name || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Employment</span>
                <span>{typeLabel[profile.employmentType]}</span>
              </div>
            </div>

            {profile.user && (
              <div className="w-full mt-4 pt-4 border-t border-border text-left">
                <p className="text-xs text-muted-foreground mb-1">System Login</p>
                <div className="flex justify-between items-center text-sm">
                  <span>{profile.user.email}</span>
                  <Badge variant="success" className="text-[10px] h-5 px-1.5">Active</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                {infoItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50 shrink-0">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                      <p className="text-sm mt-0.5">{item.value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Employment Info */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                {employmentItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-secondary/50 shrink-0">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                      <p className="text-sm mt-0.5">{item.value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/50 shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Account Title</p>
                    <p className="text-sm mt-0.5">{profile.bankAccountTitle || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/50 shrink-0">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Account Number</p>
                    <p className="text-sm mt-0.5 font-mono">{profile.bankAccountNo || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/50 shrink-0">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Bank Name</p>
                    <p className="text-sm mt-0.5">{profile.bankName || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/50 shrink-0">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Branch</p>
                    <p className="text-sm mt-0.5">{profile.bankBranch || "—"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
