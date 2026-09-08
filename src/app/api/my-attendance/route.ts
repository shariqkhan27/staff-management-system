import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employeeId = session.user.employeeId;
    if (!employeeId) {
      return NextResponse.json({ error: "No employee profile linked" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let query: any = { employeeId };

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      query.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const attendanceLogs = await prisma.attendanceLog.findMany({
      where: query,
      orderBy: { date: "desc" },
    });

    return NextResponse.json(attendanceLogs);
  } catch (error) {
    console.error("[MY_ATTENDANCE_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
