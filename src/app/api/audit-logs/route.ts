import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");

    const query: any = {};
    if (entity && entity !== "ALL") query.entity = entity;
    if (action && action !== "ALL") query.action = action;

    const logs = await prisma.auditLog.findMany({
      where: query,
      take: limit,
      orderBy: { createdAt: "desc" }
    });

    // Manually fetch users to map names
    const userIds = [...new Set(logs.map(l => l.userId).filter(Boolean))] as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { employee: { select: { name: true } } }
    });

    const userMap = new Map(users.map(u => [u.id, u.employee?.name || u.email || "System Admin"]));

    const enrichedLogs = logs.map(log => ({
      ...log,
      userName: log.userId ? (userMap.get(log.userId) || "Unknown User") : "System",
    }));

    return NextResponse.json(enrichedLogs);
  } catch (error) {
    console.error("[AUDIT_LOGS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
