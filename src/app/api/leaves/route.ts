import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { leaveRequestSchema } from "@/lib/validators/leave";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const query: any = {};
    
    // If regular employee, only show their own leaves
    if (session.user.role === "EMPLOYEE") {
      query.employeeId = session.user.employeeId;
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (status) {
      query.status = status;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: query,
      include: {
        employee: { select: { name: true, employeeId: true } },
        leaveType: { select: { name: true, isPaid: true } },
        reviewedBy: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leaves);
  } catch (error) {
    console.error("[LEAVES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = leaveRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.format() }, { status: 400 });
    }

    const { employeeId, leaveTypeId, fromDate, toDate, reason } = result.data;

    // Validate employeeId if logged in user is EMPLOYEE
    if (session.user.role === "EMPLOYEE" && employeeId !== session.user.employeeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rawStart = new Date(fromDate);
    const rawEnd = new Date(toDate);
    const start = new Date(Date.UTC(rawStart.getFullYear(), rawStart.getMonth(), rawStart.getDate()));
    const end = new Date(Date.UTC(rawEnd.getFullYear(), rawEnd.getMonth(), rawEnd.getDate()));
    
    // Check for overlapping leaves
    const overlappingLeave = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { not: "REJECTED" },
        AND: [
          { fromDate: { lte: end } },
          { toDate: { gte: start } }
        ]
      }
    });

    if (overlappingLeave) {
      return NextResponse.json({ error: "You already have a pending or approved leave during these dates." }, { status: 400 });
    }

    // Calculate total days (inclusive)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Server-side calculation for paid/unpaid split
    const currentYear = start.getFullYear();
    const currentMonth = start.getMonth();

    const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
    if (!leaveType) return NextResponse.json({ error: "Invalid leave type" }, { status: 400 });

    let paidDays = 0;
    let unpaidDays = totalDays;

    if (leaveType.isPaid) {
      const balance = await prisma.leaveBalance.findUnique({
        where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year: currentYear } }
      });
      
      const yearlyUsed = balance ? balance.used : 0;
      const yearlyAllocated = balance ? balance.allocated : leaveType.maxDaysPerYear;
      const yearlyRemaining = Math.max(0, yearlyAllocated - yearlyUsed);

      let monthlyRemaining = 9999;
      if (leaveType.maxDaysPerMonth) {
        const monthlyLeaves = await prisma.leaveRequest.findMany({
          where: {
            employeeId,
            leaveTypeId,
            status: { in: ["APPROVED", "PENDING"] },
            fromDate: {
              gte: new Date(Date.UTC(currentYear, currentMonth, 1)),
              lt: new Date(Date.UTC(currentYear, currentMonth + 1, 1)),
            },
          },
        });
        const monthlyUsed = monthlyLeaves.reduce((sum, l) => {
          const isLegacy = l.paidDays === 0 && l.unpaidDays === 0;
          return sum + (isLegacy ? l.totalDays : l.paidDays);
        }, 0);
        monthlyRemaining = Math.max(0, leaveType.maxDaysPerMonth - monthlyUsed);
      }

      const maxPaidAllowed = Math.min(yearlyRemaining, monthlyRemaining);
      paidDays = Math.min(totalDays, maxPaidAllowed);
      unpaidDays = totalDays - paidDays;
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        fromDate: start,
        toDate: end,
        totalDays,
        paidDays,
        unpaidDays,
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error("[LEAVES_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
