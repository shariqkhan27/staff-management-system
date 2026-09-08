"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface PayslipClientProps {
  record: any;
  companyName: string;
}

export default function PayslipClient({ record, companyName }: PayslipClientProps) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const periodDate = new Date(record.year, record.month - 1);
  const formattedPeriod = format(periodDate, "MMMM yyyy");

  // Format all numbers
  const basic = Number(record.basicSalary) || 0;
  const overtime = Number(record.overtimePay) || 0;
  const bonus = Number(record.bonus) || 0;
  const allowances = Number(record.allowances) || 0;
  
  const absentDed = Number(record.absentDeduction) || 0;
  const taxDed = Number(record.taxDeduction) || 0;
  const advanceDed = Number(record.advanceDeduction) || 0;
  const otherDed = Number(record.otherDeductions) || 0;

  const totalEarnings = basic + overtime + bonus + allowances;
  const totalDeductions = absentDed + taxDed + advanceDed + otherDed;
  const netSalary = Number(record.netSalary);

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      {/* Non-printable action bar */}
      <div className="flex items-center justify-between print:hidden mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Payroll
        </Button>
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" /> Print / Download PDF
        </Button>
      </div>

      {/* Printable Area */}
      <div ref={printRef} className="print-area">
        <Card className="p-8 bg-white text-black print:shadow-none print:border-none">
          {/* Header */}
          <div className="flex justify-between items-start border-b pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-primary">{companyName}</h1>
              <p className="text-sm text-gray-500 mt-1">Payslip for {formattedPeriod}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold">SALARY SLIP</h2>
              <p className="text-sm text-gray-500 mt-1">Ref: PS-{record.id.slice(-6).toUpperCase()}</p>
            </div>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Employee Details</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name:</span> <span className="font-medium">{record.employee.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Employee ID:</span> <span className="font-medium">{record.employee.employeeId}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Department:</span> <span className="font-medium">{record.employee.department?.name || "N/A"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Designation:</span> <span className="font-medium">{record.employee.designation || "N/A"}</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Attendance Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Working Days:</span> <span className="font-medium">{record.workingDays}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Present Days:</span> <span className="font-medium">{record.presentDays}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Loss of Pay Days:</span> <span className="font-medium">{record.workingDays - record.presentDays}</span></div>
              </div>
            </div>
          </div>

          {/* Salary Details Table */}
          <div className="grid grid-cols-2 gap-0 border rounded-md overflow-hidden mb-6">
            {/* Earnings Column */}
            <div className="border-r">
              <div className="bg-gray-50 p-3 border-b font-semibold text-sm">Earnings</div>
              <div className="p-4 space-y-3 text-sm min-h-[160px]">
                <div className="flex justify-between"><span>Basic Salary</span> <span>{formatCurrency(basic)}</span></div>
                {overtime > 0 && <div className="flex justify-between"><span>Overtime Pay</span> <span>{formatCurrency(overtime)}</span></div>}
                {bonus > 0 && <div className="flex justify-between"><span>Bonus</span> <span>{formatCurrency(bonus)}</span></div>}
                {allowances > 0 && <div className="flex justify-between"><span>Allowances</span> <span>{formatCurrency(allowances)}</span></div>}
              </div>
              <div className="bg-gray-50 p-3 border-t flex justify-between font-bold text-sm">
                <span>Total Earnings</span>
                <span>{formatCurrency(totalEarnings)}</span>
              </div>
            </div>

            {/* Deductions Column */}
            <div>
              <div className="bg-gray-50 p-3 border-b font-semibold text-sm">Deductions</div>
              <div className="p-4 space-y-3 text-sm min-h-[160px]">
                {absentDed > 0 && <div className="flex justify-between"><span>Absent Deduction</span> <span>{formatCurrency(absentDed)}</span></div>}
                {taxDed > 0 && <div className="flex justify-between"><span>Tax Deduction</span> <span>{formatCurrency(taxDed)}</span></div>}
                {advanceDed > 0 && <div className="flex justify-between"><span>Advance Deduction</span> <span>{formatCurrency(advanceDed)}</span></div>}
                {otherDed > 0 && <div className="flex justify-between"><span>Other Deductions</span> <span>{formatCurrency(otherDed)}</span></div>}
                {totalDeductions === 0 && <div className="text-gray-400 italic">No deductions</div>}
              </div>
              <div className="bg-gray-50 p-3 border-t flex justify-between font-bold text-sm">
                <span>Total Deductions</span>
                <span>{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Net Salary Row */}
          <div className="bg-primary/5 border border-primary/20 rounded-md p-4 flex justify-between items-center mt-6">
            <span className="text-lg font-semibold text-primary">Net Salary Payable</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(netSalary)}</span>
          </div>
          
          <div className="mt-2 text-xs text-center text-gray-400 italic">
            This is a computer-generated document. No signature is required.
          </div>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
