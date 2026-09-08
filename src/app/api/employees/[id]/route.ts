import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { employeeUpdateSchema } from "@/lib/validators/employee";

// GET /api/employees/[id] — Get single employee
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Employees can only view their own profile
  if (session.user.role === "EMPLOYEE" && session.user.employeeId !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        documents: { orderBy: { uploadedAt: "desc" } },
        user: { select: { id: true, email: true, role: true, isActive: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Strip sensitive data for HR_MANAGER
    if (session.user.role === "HR_MANAGER") {
      const { basicSalary, cnic, phone, address, dateOfBirth, bankAccountTitle, bankAccountNo, bankName, bankBranch, ...safeData } = employee as any;
      return NextResponse.json(safeData);
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Get employee error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

// PUT /api/employees/[id] — Update employee
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only owner can edit employees now
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const validation = employeeUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.cnic !== undefined) updateData.cnic = data.cnic || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.dateOfBirth !== undefined)
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.joiningDate !== undefined)
      updateData.joiningDate = new Date(data.joiningDate);
    if (data.designation !== undefined) updateData.designation = data.designation || null;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId || null;
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType;
    if (data.basicSalary !== undefined) updateData.basicSalary = data.basicSalary;
    if (data.bankAccountTitle !== undefined) updateData.bankAccountTitle = data.bankAccountTitle || null;
    if (data.bankAccountNo !== undefined) updateData.bankAccountNo = data.bankAccountNo || null;
    if (data.bankName !== undefined) updateData.bankName = data.bankName || null;
    if (data.bankBranch !== undefined) updateData.bankBranch = data.bankBranch || null;
    if (data.status !== undefined) updateData.status = data.status;

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    if (data.role && existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { role: data.role as any },
      });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] — Delete employee (owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only owner can delete
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only the owner can delete employees" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Soft delete — set status to TERMINATED
    await prisma.employee.update({
      where: { id },
      data: { status: "TERMINATED" },
    });

    // Disable user account if exists
    if (employee.userId) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ message: "Employee terminated successfully" });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
