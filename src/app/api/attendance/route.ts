import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { batchAttendanceSchema } from "@/lib/validators/attendance";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const employeeId = searchParams.get("employeeId");

    let query: any = {};

    if (dateStr) {
      const dateOnly = dateStr.split('T')[0];
      const [year, month, day] = dateOnly.split('-').map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        query.date = new Date(Date.UTC(year, month - 1, day));
      }
    }
    
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const attendanceLogs = await prisma.attendanceLog.findMany({
      where: query,
      include: {
        employee: {
          select: {
            name: true,
            employeeId: true,
            department: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(attendanceLogs);
  } catch (error) {
    console.error("[ATTENDANCE_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const result = batchAttendanceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", details: result.error.format() }, { status: 400 });
    }

    const { date, records } = result.data;
    // Robustly extract YYYY-MM-DD to avoid timezone shifting
    const dateStr = date.split('T')[0];
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(Date.UTC(year, month - 1, day));

    // Get all existing records for this date
    const existingLogs = await prisma.attendanceLog.findMany({
      where: { date: targetDate },
      include: { employee: { select: { name: true, employeeId: true } } },
    });

    const existingMap = new Map(existingLogs.map(log => [log.employeeId, log]));

    // Track which records HR is editing (not creating fresh)
    const hrEdits: { employeeName: string; employeeId: string; oldStatus: string; newStatus: string }[] = [];

    const upsertPromises = records.map((record) => {
      const existingLog = existingMap.get(record.employeeId);
      
      const data = {
        status: record.status,
        overtimeHours: record.overtimeHours,
        editedById: session.user.id,
        checkIn: record.checkIn ? new Date(record.checkIn) : null,
        checkOut: record.checkOut ? new Date(record.checkOut) : null,
      };

      if (existingLog) {
        // Track HR edits to existing attendance
        if (session.user.role === "HR_MANAGER" && existingLog.status !== record.status) {
          hrEdits.push({
            employeeName: existingLog.employee.name,
            employeeId: existingLog.employee.employeeId,
            oldStatus: existingLog.status,
            newStatus: record.status,
          });
        }

        return prisma.attendanceLog.update({
          where: { id: existingLog.id },
          data,
        });
      } else {
        return prisma.attendanceLog.create({
          data: {
            employeeId: record.employeeId,
            date: targetDate,
            ...data,
          },
        });
      }
    });

    await prisma.$transaction(upsertPromises);

    // If HR edited existing attendance, notify all OWNERs
    if (hrEdits.length > 0) {
      const owners = await prisma.user.findMany({
        where: { role: "OWNER" },
        select: { id: true },
      });

      const hrUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { employee: { select: { name: true } } },
      });

      const hrName = hrUser?.employee?.name || session.user.email || "HR Manager";
      const dateStr = targetDate.toISOString().split("T")[0];

      const editSummary = hrEdits
        .map((e) => `${e.employeeName} (${e.employeeId}): ${e.oldStatus} → ${e.newStatus}`)
        .join(", ");

      const notifications = owners.map((owner) =>
        prisma.notification.create({
          data: {
            userId: owner.id,
            type: "ATTENDANCE_EDIT",
            title: "⚠️ Attendance Modified by HR",
            message: `${hrName} changed attendance for ${dateStr}: ${editSummary}`,
            metadata: { date: dateStr, edits: hrEdits, editedBy: session.user.id },
          },
        })
      );

      await Promise.all(notifications);
    }

    return NextResponse.json({ message: "Attendance saved successfully" });
  } catch (error) {
    console.error("[ATTENDANCE_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
