"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/user-context";
import { formatCurrency } from "@/lib/utils";
import { FileText, Download, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SalaryRecord {
  id: string;
  month: number;
  year: number;
  basicSalary: string;
  netSalary: string;
  workingDays: number;
  presentDays: number;
  status: string;
  processedAt: string;
  absentDeduction: string;
  overtimePay: string;
  bonus: string;
  allowances: string;
  taxDeduction: string;
  otherDeductions: string;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function MyPayslipsPage() {
  const { employeeId } = useUser();
  const router = useRouter();
  const [payslips, setPayslips] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/payroll?year=${selectedYear}`)
      .then((res) => res.json())
      .then((data) => {
        setPayslips(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [employeeId, selectedYear]);

  if (!employeeId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 fade-in">
        <div className="h-20 w-20 bg-secondary/50 rounded-full flex items-center justify-center">
          <FileText className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-semibold">No Profile Linked</h2>
        <p className="text-muted-foreground text-sm text-center max-w-sm">
          Your account is not linked to an employee profile. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            My Payslips
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            View and download your monthly salary slips.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium"
          >
            {[...Array(15)].map((_, i) => {
              const y = new Date().getFullYear() + 5 - i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))
        ) : payslips.length === 0 ? (
          <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center h-[40vh] border border-dashed border-border rounded-xl bg-card/50">
            <Clock className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No payslips found for {selectedYear}.</p>
          </div>
        ) : (
          payslips.map((slip) => (
            <Card key={slip.id} className="overflow-hidden hover:shadow-md transition-all duration-300">
              <div className="bg-primary/5 p-5 border-b border-border/50 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{monthNames[slip.month - 1]} {slip.year}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={slip.status === "PAID" ? "success" : "warning"} className="text-[10px] h-5">
                      {slip.status === "PAID" ? (
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Paid</span>
                      ) : (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Processing</span>
                      )}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Net Salary</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(slip.netSalary)}</p>
                </div>
              </div>
              
              <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x divide-border/50 text-sm">
                  <div className="p-4 space-y-3">
                    <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Earnings</p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Basic</span>
                      <span className="font-medium">{formatCurrency(slip.basicSalary)}</span>
                    </div>
                    {Number(slip.allowances) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Allowances</span>
                        <span className="font-medium text-green-500">+{formatCurrency(slip.allowances)}</span>
                      </div>
                    )}
                    {Number(slip.overtimePay) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Overtime</span>
                        <span className="font-medium text-green-500">+{formatCurrency(slip.overtimePay)}</span>
                      </div>
                    )}
                    {Number(slip.bonus) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bonus</span>
                        <span className="font-medium text-green-500">+{formatCurrency(slip.bonus)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Deductions</p>
                    {Number(slip.absentDeduction) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Absents</span>
                        <span className="font-medium text-red-400">-{formatCurrency(slip.absentDeduction)}</span>
                      </div>
                    )}
                    {Number(slip.taxDeduction) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span className="font-medium text-red-400">-{formatCurrency(slip.taxDeduction)}</span>
                      </div>
                    )}
                    {Number(slip.otherDeductions) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Other</span>
                        <span className="font-medium text-red-400">-{formatCurrency(slip.otherDeductions)}</span>
                      </div>
                    )}
                    {(Number(slip.absentDeduction) === 0 && Number(slip.taxDeduction) === 0 && Number(slip.otherDeductions) === 0) && (
                      <div className="text-muted-foreground italic text-xs">No deductions this month.</div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border-t border-border/50 bg-secondary/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Wallet className="h-4 w-4" />
                    {slip.presentDays} of {slip.workingDays} working days present
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs gap-2" 
                    onClick={() => router.push(`/payroll/payslip/${slip.id}`)}
                  >
                    <Download className="h-3 w-3" /> Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
