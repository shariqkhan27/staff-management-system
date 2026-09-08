import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PayslipClient from "./payslip-client";

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth();
  
  if (!session) {
    redirect("/login");
  }

  const record = await prisma.salaryRecord.findUnique({
    where: { id: resolvedParams.id },
    include: {
      employee: {
        include: {
          department: true,
        }
      }
    }
  });

  if (!record) {
    return <div className="p-8 text-center">Payslip not found</div>;
  }

  // Employee can only view their own
  if (session.user.role === "EMPLOYEE" && session.user.employeeId !== record.employeeId) {
    return <div className="p-8 text-center text-red-500">Unauthorized access to this payslip</div>;
  }

  // Convert Prisma Decimal and Date objects to string/number for the client component
  const serializedRecord = {
    ...record,
    basicSalary: Number(record.basicSalary),
    overtimePay: Number(record.overtimePay),
    absentDeduction: Number(record.absentDeduction),
    advanceDeduction: Number(record.advanceDeduction),
    bonus: Number(record.bonus),
    allowances: Number(record.allowances),
    taxDeduction: Number(record.taxDeduction),
    otherDeductions: Number(record.otherDeductions),
    netSalary: Number(record.netSalary),
    processedAt: record.processedAt?.toISOString() || null,
    paidAt: record.paidAt?.toISOString() || null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    employee: {
      ...record.employee,
      basicSalary: Number(record.employee.basicSalary),
      dateOfBirth: record.employee.dateOfBirth?.toISOString() || null,
      joiningDate: record.employee.joiningDate.toISOString(),
      createdAt: record.employee.createdAt.toISOString(),
      updatedAt: record.employee.updatedAt.toISOString(),
    }
  };

  return <PayslipClient record={serializedRecord} companyName="Elegence Spaces" />;
}
