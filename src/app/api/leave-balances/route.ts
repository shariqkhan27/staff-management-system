import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || session.user.employeeId;

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    const year = new Date().getFullYear();

    let balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
        year,
      },
      include: {
        leaveType: true,
      }
    });

    // Lazy Auto-Initialization: Check if any active leave types are missing from this employee's balances
    const activeLeaveTypes = await prisma.leaveType.findMany();
    const existingTypeIds = balances.map(b => b.leaveTypeId);
    const missingTypes = activeLeaveTypes.filter(type => !existingTypeIds.includes(type.id));

    if (missingTypes.length > 0) {
      const createPromises = missingTypes.map((type) =>
        prisma.leaveBalance.create({
          data: {
            employeeId,
            leaveTypeId: type.id,
            year,
            allocated: type.maxDaysPerYear,
            used: 0,
          },
        })
      );
      
      await prisma.$transaction(createPromises);

      // Fetch the updated balances
      balances = await prisma.leaveBalance.findMany({
        where: {
          employeeId,
          year,
        },
        include: {
          leaveType: true,
        }
      });
    }
    // Calculate monthly usage
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Find all approved/pending leaves for this employee in the current month
    const monthlyLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: { in: ["APPROVED", "PENDING"] },
        fromDate: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
    });

    const balancesWithMonthly = balances.map((balance) => {
      const usedThisMonth = monthlyLeaves
        .filter((l) => l.leaveTypeId === balance.leaveTypeId)
        .reduce((sum, l) => {
          const isLegacy = l.paidDays === 0 && l.unpaidDays === 0;
          return sum + (isLegacy ? l.totalDays : l.paidDays);
        }, 0);

      return {
        ...balance,
        usedThisMonth,
      };
    });

    return NextResponse.json(balancesWithMonthly);
  } catch (error) {
    console.error("[LEAVE_BALANCES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
