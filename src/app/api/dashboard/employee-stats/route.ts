import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/dashboard/employee-stats — Employee self-service stats
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employeeId = session.user.employeeId;
  if (!employeeId) {
    return NextResponse.json({ error: "No employee profile linked" }, { status: 404 });
  }

  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get employee basic info
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        name: true,
        designation: true,
        department: { select: { name: true } },
        joiningDate: true,
        status: true,
      },
    });

    // Current month attendance
    // Map local month start to UTC for @db.Date column
    const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));

    const attendanceLogs = await prisma.attendanceLog.findMany({
      where: {
        employeeId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const presentDays = attendanceLogs.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    const absentDays = attendanceLogs.filter(
      (a) => a.status === "ABSENT"
    ).length;
    const lateDays = attendanceLogs.filter(
      (a) => a.status === "LATE"
    ).length;
    const halfDays = attendanceLogs.filter(
      (a) => a.status === "HALF_DAY"
    ).length;

    // Pending leave requests
    const pendingLeaves = await prisma.leaveRequest.count({
      where: { employeeId, status: "PENDING" },
    });

    // Leave balances
    let leaveBalances = await prisma.leaveBalance.findMany({
      where: { employeeId, year: currentYear },
      include: { leaveType: { select: { name: true } } },
    });

    if (leaveBalances.length === 0) {
      const activeLeaveTypes = await prisma.leaveType.findMany();

      if (activeLeaveTypes.length > 0) {
        const createPromises = activeLeaveTypes.map((type) =>
          prisma.leaveBalance.create({
            data: {
              employeeId,
              leaveTypeId: type.id,
              year: currentYear,
              allocated: type.maxDaysPerYear,
              used: 0,
            },
          })
        );
        await prisma.$transaction(createPromises);

        leaveBalances = await prisma.leaveBalance.findMany({
          where: { employeeId, year: currentYear },
          include: { leaveType: { select: { name: true } } },
        });
      }
    }

    // Latest salary
    const latestSalary = await prisma.salaryRecord.findFirst({
      where: { employeeId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      select: { month: true, year: true, netSalary: true, status: true },
    });

    return NextResponse.json({
      employee,
      attendance: {
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        totalMarked: attendanceLogs.length,
      },
      pendingLeaves,
      leaveBalances: leaveBalances.map((lb) => ({
        type: lb.leaveType.name,
        allocated: lb.allocated,
        used: lb.used,
        remaining: lb.allocated - lb.used,
      })),
      latestSalary: latestSalary
        ? {
            month: latestSalary.month,
            year: latestSalary.year,
            netSalary: latestSalary.netSalary.toNumber(),
            status: latestSalary.status,
          }
        : null,
    });
  } catch (error) {
    console.error("Employee stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
