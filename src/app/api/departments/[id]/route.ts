import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { departmentSchema } from "@/lib/validators/department";

// PUT /api/departments/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const validation = departmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, headEmployeeId } = validation.data;

    const existing = await prisma.department.findFirst({
      where: { name, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Another department with this name already exists" },
        { status: 409 }
      );
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        headEmployeeId: headEmployeeId || null,
      },
      include: {
        headEmployee: { select: { id: true, name: true, employeeId: true } },
        _count: { select: { employees: true } },
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error("Update department error:", error);
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    );
  }
}

// DELETE /api/departments/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const employeeCount = await prisma.employee.count({
      where: { departmentId: id },
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete department with ${employeeCount} employee(s). Reassign them first.` },
        { status: 400 }
      );
    }

    await prisma.department.delete({ where: { id } });

    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Delete department error:", error);
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
