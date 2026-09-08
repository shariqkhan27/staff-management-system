"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function AttendanceReport() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance")
      .then(res => res.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 fade-in min-h-screen pb-20">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/reports">
          <Button variant="ghost"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports</Button>
        </Link>
        <Button onClick={() => window.print()} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Printer className="mr-2 h-4 w-4" /> Print PDF Report
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse">Generating Report...</div>
      ) : (
        <div className="bg-white text-black max-w-[210mm] mx-auto min-h-[297mm] p-12 shadow-lg border printable-area">
          <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tighter uppercase">Elegence Architectures</h1>
              <p className="text-sm text-gray-500 mt-1">Real Estate & Construction</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-800">ATTENDANCE LOG</h2>
              <p className="text-sm font-medium mt-1">Report Generated: {format(new Date(), "dd MMM, yyyy")}</p>
            </div>
          </div>

          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black uppercase text-xs">
                <th className="p-3 font-bold">Employee</th>
                <th className="p-3 font-bold">Date</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold">Check In</th>
                <th className="p-3 font-bold">Check Out</th>
              </tr>
            </thead>
            <tbody>
              {data.map((record: any) => (
                <tr key={record.id} className="border-b border-gray-200">
                  <td className="p-3 font-medium">{record.user.name}</td>
                  <td className="p-3">{format(new Date(record.date), "dd MMM yyyy")}</td>
                  <td className="p-3">
                    <span className="font-semibold">{record.status}</span>
                  </td>
                  <td className="p-3">{record.checkIn ? format(new Date(record.checkIn), "hh:mm a") : "-"}</td>
                  <td className="p-3">{record.checkOut ? format(new Date(record.checkOut), "hh:mm a") : "-"}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-20 pt-8 border-t border-gray-300 text-center text-sm text-gray-500">
            <p>This is a computer-generated document. No signature is required.</p>
            <p className="mt-1">© {new Date().getFullYear()} Elegence Architectures. All rights reserved.</p>
          </div>
        </div>
      )}

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
