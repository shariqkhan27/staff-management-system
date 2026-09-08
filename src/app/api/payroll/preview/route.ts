import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER" && session.user.role !== "FINANCE_MANAGER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || "0");
    const year = parseInt(searchParams.get("year") || "0");
    const daysInMonth = parseInt(searchParams.get("daysInMonth") || "30");
    const overtimeRate = parseFloat(searchParams.get("overtimeRate") || "0");

    if (!month || !year) {
      return NextResponse.json({ error: "Month and year required" }, { status: 400 });
    }

    // 1. Get all active employees, excluding the Admin/Owner
    const employees = await prisma.employee.findMany({
      where: { 
        status: "ACTIVE",
        OR: [
          { user: null },
          { user: { role: { notIn: ["OWNER", "FINANCE_MANAGER"] } } }
        ]
      },
      include: {
        department: true,
      }
    });

    // 2. Date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // 3. For each employee, calculate preview
    const previews = await Promise.all(employees.map(async (emp) => {
      // Get attendance
      const attendance = await prisma.attendanceLog.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate }
        }
      });

      let presentDays = 0;
      let absentDays = 0;
      let totalOvertimeHours = 0;

      attendance.forEach(log => {
        if (log.status === "PRESENT" || log.status === "LATE") presentDays += 1;
        if (log.status === "HALF_DAY") presentDays += 0.5;
        if (log.status === "ABSENT") absentDays += 1;
        totalOvertimeHours += Number(log.overtimeHours) || 0;
      });

      // Get approved leaves for the month
      const leaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: emp.id,
          status: "APPROVED",
          fromDate: { gte: startDate, lte: endDate }
        }
      });
      const leavePaidDays = leaves.reduce((sum, leave) => sum + (leave.paidDays > 0 ? leave.paidDays : leave.totalDays), 0);
      const leaveUnpaidDays = leaves.reduce((sum, leave) => sum + leave.unpaidDays, 0);
      
      // Calculate absent days (if not explicitly marked ABSENT, we assume they are absent if they didn't punch in AND weren't on leave)
      // We also add explicitly unpaid leave days
      const totalAbsentDays = absentDays + leaveUnpaidDays;
      
      const basicSalary = Number(emp.basicSalary);
      const perDaySalary = basicSalary / daysInMonth;
      
      const absentDeduction = totalAbsentDays * perDaySalary;
      const overtimePay = totalOvertimeHours * overtimeRate;
      
      // Get advances
      const advances = await prisma.salaryAdvance.findMany({
        where: {
          employeeId: emp.id,
          status: "APPROVED",
          deductionMonth: month,
          deductionYear: year,
        }
      });
      const advanceDeduction = advances.reduce((sum, adv) => sum + Number(adv.amount), 0);

      const netSalary = basicSalary + overtimePay - absentDeduction - advanceDeduction;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        employeeIdCode: emp.employeeId,
        departmentName: emp.department?.name || "-",
        month,
        year,
        workingDays: daysInMonth,
        presentDays: presentDays + leavePaidDays,
        absentDays: totalAbsentDays,
        totalOvertimeHours,
        basicSalary,
        overtimePay,
        absentDeduction,
        advanceDeduction,
        bonus: 0,
        allowances: 0,
        taxDeduction: 0,
        otherDeductions: 0,
        netSalary,
      };
    }));

    return NextResponse.json(previews);
  } catch (error) {
    console.error("[PAYROLL_PREVIEW]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
