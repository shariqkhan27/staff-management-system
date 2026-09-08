"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { FileText, Eye, Check } from "lucide-react";
import Link from "next/link";

export default function EmployeePayroll({ employeeId }: { employeeId: string }) {
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll");
      const data = await res.json();
      setRecords(data);
    } catch {
      toast({ title: "Error", description: "Failed to load payslips", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          My Payslips
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          View and download your monthly salary slips
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="p-4 text-left font-medium text-muted-foreground uppercase text-xs">Period</th>
                <th className="p-4 text-left font-medium text-muted-foreground uppercase text-xs">Basic</th>
                <th className="p-4 text-left font-medium text-muted-foreground uppercase text-xs">Net Salary</th>
                <th className="p-4 text-left font-medium text-muted-foreground uppercase text-xs">Status</th>
                <th className="p-4 text-right font-medium text-muted-foreground uppercase text-xs">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No payslips available.</td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="border-b border-border/50 table-row-hover">
                    <td className="p-4">
                      <span className="font-medium">{format(new Date(record.year, record.month - 1), "MMM yyyy")}</span>
                    </td>
                    <td className="p-4">{formatCurrency(record.basicSalary)}</td>
                    <td className="p-4 font-bold">{formatCurrency(record.netSalary)}</td>
                    <td className="p-4">
                      <Badge variant="success">
                        <Check className="w-3 h-3 mr-1 inline" /> {record.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/payroll/payslip/${record.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" /> View Payslip
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
