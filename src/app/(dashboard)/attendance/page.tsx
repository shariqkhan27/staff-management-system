"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toaster";
import { format, parseISO } from "date-fns";
import { Calendar, Save, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { exportToCSV } from "@/lib/csv-export";

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  photoUrl: string | null;
  department: { name: string } | null;
}

interface AttendanceRecord {
  employeeId: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LATE";
  overtimeHours: number;
}

export default function AttendancePage() {
  const { toast } = useToast();
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAttendanceData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all active employees
      const empRes = await fetch("/api/employees?limit=1000&status=ACTIVE");
      const empData = await empRes.json();
      const activeEmployees = empData.employees || [];
      setEmployees(activeEmployees);

      // Fetch existing attendance for this date
      const attRes = await fetch(`/api/attendance?date=${date}`);
      const attData = await attRes.json();

      // Merge data
      const newRecords: Record<string, AttendanceRecord> = {};
      
      activeEmployees.forEach((emp: Employee) => {
        // Find existing record
        const existing = attData.find((a: any) => a.employeeId === emp.id);
        
        newRecords[emp.id] = {
          employeeId: emp.id,
          status: existing ? existing.status : "PRESENT", // Default to present
          overtimeHours: existing ? Number(existing.overtimeHours) : 0,
        };
      });

      setRecords(newRecords);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load attendance data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [date, toast]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const handleStatusChange = (employeeId: string, status: any) => {
    setRecords((prev) => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], status },
    }));
  };

  const handleOvertimeChange = (employeeId: string, value: string) => {
    const hours = parseFloat(value) || 0;
    setRecords((prev) => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], overtimeHours: Math.max(0, hours) },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        date,
        records: Object.values(records),
      };

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Attendance saved successfully", variant: "success" });
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to save attendance", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Network error occurred", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Daily Attendance
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Record employee presence and overtime
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => {
            if (employees.length === 0) return;
            const csvData = employees.map(emp => ({
              Date: date,
              "Employee ID": emp.employeeId,
              Name: emp.name,
              Department: emp.department?.name || "-",
              Status: records[emp.id]?.status || "-",
              "Overtime (Hrs)": records[emp.id]?.overtimeHours || 0
            }));
            exportToCSV(csvData, `Attendance_${date}`);
          }}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
          <Button onClick={handleSave} disabled={loading || saving || employees.length === 0}>
            {saving ? (
              <span className="flex items-center gap-2">Saving...</span>
            ) : (
              <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Save All</span>
            )}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Employee
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Department
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                  Overtime (Hrs)
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No active employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const record = records[emp.id];
                  if (!record) return null;

                  return (
                    <tr key={emp.id} className="border-b border-border/50 table-row-hover">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={emp.photoUrl} fallback={emp.name} size="sm" />
                          <div>
                            <p className="font-medium text-sm">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">
                        {emp.department?.name || "—"}
                      </td>
                      <td className="p-4">
                        <select
                          value={record.status}
                          onChange={(e) => handleStatusChange(emp.id, e.target.value)}
                          className={`h-9 rounded-md border px-3 text-sm font-medium w-full min-w-[120px] max-w-[140px]
                            ${record.status === "PRESENT" ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400" : ""}
                            ${record.status === "ABSENT" ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400" : ""}
                            ${record.status === "HALF_DAY" ? "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400" : ""}
                            ${record.status === "LATE" ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" : ""}
                          `}
                        >
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                          <option value="HALF_DAY">Half Day</option>
                          <option value="LATE">Late</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={record.overtimeHours}
                          onChange={(e) => handleOvertimeChange(emp.id, e.target.value)}
                          className="w-20 h-9"
                          disabled={record.status === "ABSENT"}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
