import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const employeeFilter: Prisma.EmployeeWhereInput = {
      OR: [
        { userId: null },
        { user: { isNot: { role: "OWNER" } } }
      ]
    };

    const [
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      totalDepartments,
      pendingLeaves,
    ] = await Promise.all([
      prisma.employee.count({ where: employeeFilter }),
      prisma.employee.count({ where: { ...employeeFilter, status: "ACTIVE" } }),
      prisma.employee.count({ where: { ...employeeFilter, status: "ON_LEAVE" } }),
      prisma.department.count(),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    ]);

    // Today's attendance (Correctly align local PKT date to UTC Date for DB query)
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todayAttendance = await prisma.attendanceLog.groupBy({
      by: ["status"],
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      _count: true,
    });

    const todayPresent = todayAttendance.find(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    )?._count ?? 0;
    const todayAbsent = todayAttendance.find(
      (a) => a.status === "ABSENT"
    )?._count ?? 0;

    // Monthly payroll (sum of basic salaries for active employees)
    const payrollResult = await prisma.employee.aggregate({
      where: { ...employeeFilter, status: "ACTIVE" },
      _sum: { basicSalary: true },
    });
    const monthlyPayroll = payrollResult?._sum?.basicSalary?.toNumber() ?? 0;

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      totalDepartments,
      todayPresent,
      todayAbsent,
      pendingLeaves,
      ...(session.user.role !== "HR_MANAGER" && { monthlyPayroll }),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
