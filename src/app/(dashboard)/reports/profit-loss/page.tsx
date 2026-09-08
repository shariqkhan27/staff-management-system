"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download } from "lucide-react";
import Link from "next/link";
import { exportToCSV } from "@/lib/csv-export";
import { format } from "date-fns";
import { useGlobalSettings } from "@/components/global-settings-provider";

export default function ProfitLossReport() {
  const { settings } = useGlobalSettings();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/finance/summary")
      .then(res => res.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 fade-in min-h-screen pb-20">
      {/* Controls - Hidden on Print */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/reports">
          <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports</Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            if (!data) return;
            const csvData = [
              { Period: "Current Month", "Total Income (PKR)": data.summary.totalIncome, "Total Expenses (PKR)": data.summary.totalExpenses, "Net Profit (PKR)": data.summary.netProfit }
            ];
            exportToCSV(csvData, `Profit_Loss_Summary_${format(new Date(), "MMM_yyyy")}`);
          }}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Printer className="mr-2 h-4 w-4" /> Print PDF Report
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse">Generating Report...</div>
      ) : data ? (
        <div className="bg-white text-black max-w-[210mm] mx-auto min-h-[297mm] p-12 shadow-lg border printable-area">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tighter uppercase">{settings.companyName}</h1>
              <p className="text-sm text-gray-500 mt-1">Real Estate & Construction</p>
              <p className="text-sm text-gray-500">123 Main St, City, Country</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800">PROFIT & LOSS</h2>
              <p className="text-sm font-medium mt-1">Report Generated: {format(new Date(), "dd MMM, yyyy")}</p>
              <p className="text-sm">Period: Current Month</p>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mb-10">
            <h3 className="text-lg font-bold bg-gray-100 p-2 uppercase border-l-4 border-black mb-4">Financial Overview</h3>
            <div className="grid grid-cols-2 gap-8 px-4">
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase">Total Income</p>
                <p className="text-2xl font-bold text-green-700">PKR {data.summary.totalIncome.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold uppercase">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">PKR {data.summary.totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Net Profit Callout */}
          <div className={`p-6 border-2 flex justify-between items-center ${data.summary.netProfit >= 0 ? "border-green-600 bg-green-50" : "border-red-600 bg-red-50"}`}>
            <h3 className="text-xl font-bold uppercase tracking-wider">Net Profit / (Loss)</h3>
            <p className={`text-3xl font-black ${data.summary.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
              PKR {data.summary.netProfit.toLocaleString()}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-gray-300 text-center text-sm text-gray-500">
            <p>This is a computer-generated document. No signature is required.</p>
            <p className="mt-1">© {new Date().getFullYear()} {settings.companyName}. All rights reserved.</p>
          </div>
        </div>
      ) : null}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            margin: 0; 
            padding: 40px !important;
            box-shadow: none !important; 
            border: none !important;
          }
        }
      `}} />
    </div>
  );
}
