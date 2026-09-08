"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

interface AttendanceLog {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  overtimeHours: number;
}

const statusVariant: Record<string, "success" | "destructive" | "warning" | "default"> = {
  PRESENT: "success",
  ABSENT: "destructive",
  HALF_DAY: "warning",
  LATE: "warning",
};

export default function MyAttendancePage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    fetch(`/api/my-attendance?month=${month}&year=${year}`)
      .then((res) => res.json())
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [month, year]);

  return (
    <div className="space-y-6 fade-in max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            My Attendance
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            View your attendance history and records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {format(new Date(2024, i, 1), "MMMM")}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {[...Array(15)].map((_, i) => {
              const y = new Date().getFullYear() + 5 - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/30 border-b border-border">
              <tr>
                <th className="p-4 font-medium text-muted-foreground">Date</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground">Check In</th>
                <th className="p-4 font-medium text-muted-foreground">Check Out</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Overtime</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="p-4 text-right"><Skeleton className="h-4 w-8 ml-auto" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">No attendance records found for this month.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 table-row-hover">
                    <td className="p-4 font-medium">
                      {format(new Date(log.date), "EEE, dd MMM yyyy")}
                    </td>
                    <td className="p-4">
                      <Badge variant={statusVariant[log.status] || "default"}>
                        {log.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {log.checkIn ? format(new Date(log.checkIn), "hh:mm a") : "—"}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {log.checkOut ? format(new Date(log.checkOut), "hh:mm a") : "—"}
                    </td>
                    <td className="p-4 text-right">
                      {log.overtimeHours > 0 ? (
                        <span className="text-green-500 font-medium">+{log.overtimeHours}h</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
