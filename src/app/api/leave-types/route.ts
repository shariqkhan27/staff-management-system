import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const types = await prisma.leaveType.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(types);
  } catch (error) {
    console.error("[LEAVE_TYPES_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
