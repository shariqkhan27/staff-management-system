"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Calculator, Save, FileText, Check, FileDown, Eye, Download } from "lucide-react";
import Link from "next/link";
import { exportToCSV } from "@/lib/csv-export";

interface PayrollPreview {
  employeeId: string;
  employeeName: string;
  employeeIdCode: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  totalOvertimeHours: number;
  basicSalary: number;
  overtimePay: number;
  absentDeduction: number;
  advanceDeduction: number;
  bonus: number;
  allowances: number;
  taxDeduction: number;
  otherDeductions: number;
  netSalary: number;
}

export default function AdminPayroll() {
  const { toast } = useToast();
  
  // Settings state
  const [month, setMonth] = useState<number | "">(new Date().getMonth() + 1);
  const [year, setYear] = useState<number | "">(new Date().getFullYear());
  const [daysInMonth, setDaysInMonth] = useState<number | "">(30);
  const [overtimeRate, setOvertimeRate] = useState<number | "">(0);
  
  const [previewData, setPreviewData] = useState<PayrollPreview[]>([]);
  const [pastRecords, setPastRecords] = useState<any[]>([]);
  
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"GENERATE" | "HISTORY">("HISTORY");

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/payroll");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPastRecords(data);
      } else {
        setPastRecords([]);
        console.error("Payroll API error:", data);
        toast({ title: "Error", description: data.error || "Failed to load past payrolls", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to load past payrolls", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handlePreview = async () => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/payroll/preview?month=${month}&year=${year}&daysInMonth=${daysInMonth}&overtimeRate=${overtimeRate}`);
      const data = await res.json();
      if (res.ok) {
        setPreviewData(data);
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFieldChange = (employeeId: string, field: keyof PayrollPreview, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPreviewData((prev) => 
      prev.map((row) => {
        if (row.employeeId !== employeeId) return row;
        const updated = { ...row, [field]: numValue };
        
        // Recalculate net
        updated.netSalary = 
          updated.basicSalary + 
          updated.overtimePay + 
          updated.bonus + 
          updated.allowances - 
          updated.absentDeduction - 
          updated.advanceDeduction - 
          updated.taxDeduction - 
          updated.otherDeductions;
          
        return updated;
      })
    );
  };

  const handleGenerate = async () => {
    if (previewData.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: previewData }),
      });
      if (res.ok) {
        toast({ title: "Success", description: "Payroll generated successfully", variant: "success" });
        setPreviewData([]);
        setView("HISTORY");
        fetchHistory();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Generation failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Payroll Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Calculate, generate, and manage employee salaries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "HISTORY" ? "default" : "outline"} onClick={() => setView("HISTORY")}>
            <FileText className="h-4 w-4 mr-2" /> History
          </Button>
          <Button variant={view === "GENERATE" ? "default" : "outline"} onClick={() => setView("GENERATE")}>
            <Calculator className="h-4 w-4 mr-2" /> Generate
          </Button>
        </div>
      </div>

      {view === "GENERATE" && (
        <div className="space-y-6 fade-in">
          <Card className="p-4 bg-secondary/20">
            <h3 className="font-medium text-sm mb-4">Payroll Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Month (1-12)</label>
                <Input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(e.target.value === "" ? "" : parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Year</label>
                <Input type="number" value={year} onChange={(e) => setYear(e.target.value === "" ? "" : parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Days in Month</label>
                <Input type="number" min={1} max={31} value={daysInMonth} onChange={(e) => setDaysInMonth(e.target.value === "" ? "" : parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Overtime Rate/Hr</label>
                <Input type="number" min={0} value={overtimeRate} onChange={(e) => setOvertimeRate(e.target.value === "" ? "" : parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handlePreview} disabled={loadingPreview}>
                {loadingPreview ? "Calculating..." : "Preview Payroll"}
              </Button>
            </div>
          </Card>

          {previewData.length > 0 && (
            <Card className="overflow-hidden fade-in">
              <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30">
                <h3 className="font-medium">Calculated Preview ({previewData.length} Employees)</h3>
                <Button onClick={handleGenerate} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Confirm & Save All"}
                </Button>
              </div>
              <div className="overflow-x-auto pb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 uppercase text-[10px] tracking-wider text-muted-foreground">
                      <th className="p-4 text-left font-semibold rounded-tl-xl">Employee</th>
                      <th className="p-4 text-right font-semibold">Basic Pay</th>
                      <th className="p-4 text-right font-semibold text-emerald-500/80">O/T Pay</th>
                      <th className="p-4 text-right font-semibold text-emerald-500/80">Bonus</th>
                      <th className="p-4 text-right font-semibold text-emerald-500/80">Allowances</th>
                      <th className="p-4 text-right font-semibold text-rose-500/80">Absents</th>
                      <th className="p-4 text-right font-semibold text-rose-500/80">Tax</th>
                      <th className="p-4 text-right font-semibold text-rose-500/80">Other Ded.</th>
                      <th className="p-4 text-right font-semibold text-primary rounded-tr-xl">Net Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {previewData.map((row) => (
                      <tr key={row.employeeId} className="group hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-foreground">{row.employeeName}</p>
                          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{row.employeeIdCode}</p>
                        </td>
                        <td className="p-2 align-middle">
                          <Input 
                            type="number" 
                            className="w-full min-w-[80px] h-8 text-xs text-right bg-transparent border-transparent shadow-none hover:bg-muted/50 focus:bg-background focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-medium" 
                            value={row.basicSalary} 
                            onChange={(e) => handleFieldChange(row.employeeId, "basicSalary", e.target.value)} 
                          />
                        </td>
                        <td className="p-2 align-middle">
                          <Input 
                            type="number" 
                            className="w-full min-w-[70px] h-8 text-xs text-right bg-transparent border-transparent shadow-none hover:bg-emerald-500/10 focus:bg-background focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-emerald-600 dark:text-emerald-400 font-medium" 
                            value={row.overtimePay} 
                            onChange={(e) => handleFieldChange(row.employeeId, "overtimePay", e.target.value)} 
                          />
                        </td>
                        <td className="p-2 align-middle">
                          <Input 
                            type="number" 
                            className="w-full min-w-[70px] h-8 text-xs text-right bg-transparent border-transparent shadow-none hover:bg-emerald-500/10 focus:bg-background focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-emerald-600 dark:text-emerald-400 font-medium" 
                            value={row.bonus} 
                            onChange={(e) => handleFieldChange(row.employeeId, "bonus", e.target.value)} 
                          />
                        </td>
                        <td className="p-2 align-middle">
                          <Input 
                            type="number" 
                            className="w-full min-w-[70px] h-8 text-xs text-right bg-transparent border-transparent shadow-none hover:bg-emerald-500/10 focus:bg-background focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-emerald-600 dark:text-emerald-400 font-medium" 
                            value={row.allowances} 
                            onChange={(e) => handleFieldChange(row.employeeId, "allowances", e.target.value)} 
                          />
                        </td>
                        <td className="p-2 align-middle">
                          <Input 
                            type="number" 
                            className="w-full min-w-[70px] h-8 text-xs text-right bg-transparent border-transparent shadow-none hover:bg-rose-500/10 focus:bg-background focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-all text-rose-600 dark:text-rose-400 font-medium" 
                            value={row.absentDeduction} 
                            onChange={(e) => handleFieldChange(row.employeeId, "absentDeduction", e.target.value)} 
                          />
                        </td>
                        <td className="p-2 align-middle">
                          <Input 
                            type="number" 
                            className="w-full min-w-[70px] h-8 text-xs text-right bg-transparent border-transparent shadow-none hover:bg-rose-500/10 focus:bg-background focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-all text-rose-600 dark:text-rose-400 font-medium" 
                            value={row.taxDeduction} 
                            onChange={(e) => handleFieldChange(row.employeeId, "taxDeduction", e.target.value)} 
                          />
                        </td>
                        <td className="p-2 align-middle">
                          <Input 
                            type="number" 
                            className="w-full min-w-[70px] h-8 text-xs text-right bg-transparent border-transparent shadow-none hover:bg-rose-500/10 focus:bg-background focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition-all text-rose-600 dark:text-rose-400 font-medium" 
                            value={row.otherDeductions} 
                            onChange={(e) => handleFieldChange(row.employeeId, "otherDeductions", e.target.value)} 
                          />
                        </td>
                        <td className="p-4 text-right align-middle">
                          <div className="flex justify-end items-center h-full">
                            <span className="font-bold text-[15px] bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 shadow-sm">
                              {formatCurrency(row.netSalary.toString())}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {view === "HISTORY" && (
        <Card className="overflow-hidden fade-in">
          <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30">
            <h3 className="font-medium">Past Payroll Records</h3>
            <Button variant="outline" size="sm" onClick={() => {
              if (pastRecords.length === 0) return;
              const csvData = pastRecords.map(r => ({
                Period: `${r.month}/${r.year}`,
                "Employee ID": r.employee?.employeeId,
                Name: r.employee?.name,
                "Basic Salary (PKR)": r.basicSalary,
                "Overtime Pay (PKR)": r.overtimePay,
                "Allowances (PKR)": r.allowances,
                "Bonus (PKR)": r.bonus,
                "Absent Deduction (PKR)": r.absentDeduction,
                "Tax (PKR)": r.taxDeduction,
                "Other Deductions (PKR)": r.otherDeductions,
                "Advance Deduction (PKR)": r.advanceDeduction,
                "Net Salary (PKR)": r.netSalary,
                Status: r.status
              }));
              exportToCSV(csvData, `Payroll_History_${format(new Date(), "yyyy_MM_dd")}`);
            }}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="p-4 text-left font-medium text-muted-foreground uppercase text-xs">Period</th>
                  <th className="p-4 text-left font-medium text-muted-foreground uppercase text-xs">Employee</th>
                  <th className="p-4 text-left font-medium text-muted-foreground uppercase text-xs">Basic</th>
                  <th className="p-4 text-left font-medium text-muted-foreground uppercase text-xs">Net Salary</th>
                  <th className="p-4 text-left font-medium text-muted-foreground uppercase text-xs">Status</th>
                  <th className="p-4 text-right font-medium text-muted-foreground uppercase text-xs">Payslip</th>
                </tr>
              </thead>
              <tbody>
                {pastRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">No payroll records found.</td>
                  </tr>
                ) : (
                  pastRecords.map((record) => (
                    <tr key={record.id} className="border-b border-border/50 table-row-hover">
                      <td className="p-4">
                        <span className="font-medium">{format(new Date(record.year, record.month - 1), "MMM yyyy")}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{record.employee.name}</p>
                        <p className="text-xs text-muted-foreground">{record.employee.employeeId}</p>
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
                            <Eye className="h-4 w-4 mr-2" /> View
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
      )}
    </div>
  );
}
