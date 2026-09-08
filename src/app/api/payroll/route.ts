import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAudit } from "@/lib/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER" && session.user.role !== "FINANCE_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "No records to save" }, { status: 400 });
    }

    const month = records[0].month;
    const year = records[0].year;

    // Check if payroll already generated for this month
    const existing = await prisma.salaryRecord.findFirst({
      where: { month, year }
    });

    if (existing) {
      return NextResponse.json({ error: "Payroll already generated for this month. Please delete or update existing records." }, { status: 400 });
    }

    const createPromises = records.map((record: any) => {
      // Calculate final net just to be safe
      const netSalary = 
        Number(record.basicSalary) + 
        Number(record.overtimePay) + 
        Number(record.bonus) + 
        Number(record.allowances) - 
        Number(record.absentDeduction) - 
        Number(record.advanceDeduction) - 
        Number(record.taxDeduction) - 
        Number(record.otherDeductions);

      return prisma.salaryRecord.create({
        data: {
          employeeId: record.employeeId,
          month: record.month,
          year: record.year,
          workingDays: record.workingDays,
          presentDays: record.presentDays,
          basicSalary: record.basicSalary,
          absentDeduction: record.absentDeduction,
          overtimePay: record.overtimePay,
          bonus: record.bonus,
          allowances: record.allowances,
          advanceDeduction: record.advanceDeduction,
          taxDeduction: record.taxDeduction,
          otherDeductions: record.otherDeductions,
          netSalary: netSalary,
          status: "PROCESSED",
          processedById: session.user.id,
          processedAt: new Date(),
        }
      });
    });

    await prisma.$transaction(createPromises);

    // Also update any advances to "DEDUCTED" status
    const advanceUpdates = records.filter((r: any) => r.advanceDeduction > 0).map((record: any) => {
      return prisma.salaryAdvance.updateMany({
        where: {
          employeeId: record.employeeId,
          status: "APPROVED",
          deductionMonth: month,
          deductionYear: year,
        },
        data: {
          status: "DEDUCTED"
        }
      });
    });

    if (advanceUpdates.length > 0) {
      await prisma.$transaction(advanceUpdates);
    }

    await logAudit({
      userId: session.user.id,
      action: "PROCESS",
      entity: "PAYROLL",
      entityId: `month-${month}-year-${year}`,
      changes: { totalRecords: records.length, month, year }
    });

    return NextResponse.json({ message: "Payroll generated successfully" });
  } catch (error) {
    console.error("[PAYROLL_GENERATE_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    
    let query: any = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    
    // Employee can only see their own payslips
    if (session.user.role === "EMPLOYEE") {
      query.employeeId = session.user.employeeId;
    }

    const records = await prisma.salaryRecord.findMany({
      where: query,
      include: {
        employee: { select: { name: true, employeeId: true, designation: true } },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[PAYROLL_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
