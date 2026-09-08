"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ReportsPage() {
  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports Central</h1>
        <p className="text-muted-foreground">Generate and download comprehensive company reports.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profit and Loss Report */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Profit & Loss</CardTitle>
              <p className="text-sm text-muted-foreground">Financial summary</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Detailed breakdown of all income, expenses, and payroll deductions.
            </p>
            <Link href="/reports/profit-loss">
              <Button className="w-full" variant="outline">
                Generate Report <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Employee Attendance Report */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Attendance Log</CardTitle>
              <p className="text-sm text-muted-foreground">Staff presence data</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Log of employee check-ins, absences, and overtime hours accrued.
            </p>
            <Link href="/reports/attendance">
              <Button className="w-full" variant="outline">
                Generate Report <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Leave Balances Report */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Leave Balances</CardTitle>
              <p className="text-sm text-muted-foreground">Staff time-off</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Snapshot of all staff leave balances, utilized days, and pending requests.
            </p>
            <Link href="/reports/leaves">
              <Button className="w-full" variant="outline">
                Generate Report <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
