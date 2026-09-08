import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { leaveApprovalSchema } from "@/lib/validators/leave";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: leaveId } = await params;
    const body = await req.json();
    const result = leaveApprovalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.format() }, { status: 400 });
    }

    const { status, approvedDays, reviewComment } = result.data;

    // Fetch the leave request to check current status and days
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { leaveType: true },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const oldStatus = leaveRequest.status;
    const oldPaidDays = oldStatus === "APPROVED" ? (leaveRequest.paidDays > 0 ? leaveRequest.paidDays : leaveRequest.totalDays) : 0;

    let finalTotalDays = approvedDays || leaveRequest.totalDays;
    let finalPaidDays = leaveRequest.paidDays;
    let finalUnpaidDays = leaveRequest.unpaidDays;

    // Recalculate paid vs unpaid days
    if (approvedDays || status === "APPROVED") {
      if (leaveRequest.leaveType.isPaid) {
        const year = leaveRequest.fromDate.getFullYear();
        const balance = await prisma.leaveBalance.findUnique({
          where: {
            employeeId_leaveTypeId_year: {
              employeeId: leaveRequest.employeeId,
              leaveTypeId: leaveRequest.leaveTypeId,
              year,
            },
          },
        });
        
        const currentUsed = (balance?.used || 0) - oldPaidDays;
        const allocated = balance ? balance.allocated : leaveRequest.leaveType.maxDaysPerYear;
        const yearlyRemaining = Math.max(0, allocated - Math.max(0, currentUsed));
        
        let monthlyRemaining = 9999;
        if (leaveRequest.leaveType.maxDaysPerMonth) {
          const month = leaveRequest.fromDate.getMonth();
          const monthlyLeaves = await prisma.leaveRequest.findMany({
            where: {
              employeeId: leaveRequest.employeeId,
              leaveTypeId: leaveRequest.leaveTypeId,
              status: { in: ["APPROVED"] },
              id: { not: leaveId },
              fromDate: {
                gte: new Date(Date.UTC(year, month, 1)),
                lt: new Date(Date.UTC(year, month + 1, 1)),
              },
            },
          });
          const monthlyUsed = monthlyLeaves.reduce((sum, l) => {
            const isLegacy = l.paidDays === 0 && l.unpaidDays === 0;
            return sum + (isLegacy ? l.totalDays : l.paidDays);
          }, 0);
          monthlyRemaining = Math.max(0, leaveRequest.leaveType.maxDaysPerMonth - monthlyUsed);
        }

        const maxPaidAllowed = Math.min(yearlyRemaining, monthlyRemaining);
        finalPaidDays = Math.min(finalTotalDays, maxPaidAllowed);
        finalUnpaidDays = finalTotalDays - finalPaidDays;
      } else {
        finalPaidDays = 0;
        finalUnpaidDays = finalTotalDays;
      }
    }

    // Update the leave request
    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        totalDays: finalTotalDays,
        paidDays: finalPaidDays,
        unpaidDays: finalUnpaidDays,
        reviewComment,
        reviewedById: session.user.id,
      },
    });

    // Handle Leave Balance adjustments
    const year = leaveRequest.fromDate.getFullYear();
    const newPaidDays = status === "APPROVED" ? finalPaidDays : 0;
    const diff = newPaidDays - oldPaidDays;

    if (diff !== 0) {
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year,
          },
        },
      });

      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: {
            used: Math.max(0, balance.used + diff),
          },
        });
      } else if (status === "APPROVED") {
        await prisma.leaveBalance.create({
          data: {
            employeeId: leaveRequest.employeeId,
            leaveTypeId: leaveRequest.leaveTypeId,
            year,
            allocated: leaveRequest.leaveType.maxDaysPerYear,
            used: Math.max(0, diff),
          },
        });
      }
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("[LEAVES_PUT]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: leaveId } = await params;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Only owner or the employee who created it (if still pending) can delete — HR cannot delete
    if (session.user.role === "HR_MANAGER") {
      return NextResponse.json({ error: "HR cannot delete records" }, { status: 403 });
    }

    if (session.user.role === "EMPLOYEE") {
      if (leaveRequest.employeeId !== session.user.employeeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (leaveRequest.status !== "PENDING") {
        return NextResponse.json({ error: "Cannot delete processed request" }, { status: 400 });
      }
    }

    await prisma.leaveRequest.delete({
      where: { id: leaveId },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("[LEAVES_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
