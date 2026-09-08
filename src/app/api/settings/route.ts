import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET: Fetch current admin profile and system settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        employee: {
          select: {
            name: true,
            phone: true,
            photoUrl: true,
          }
        }
      },
    });

    // Get system stats
    const [totalEmployees, totalDepartments, totalLeaveTypes, totalUsers] = await Promise.all([
      prisma.employee.count(),
      prisma.department.count(),
      prisma.leaveType.count(),
      prisma.user.count(),
    ]);

    // Get leave types
    const leaveTypes = await prisma.leaveType.findMany({
      orderBy: { name: "asc" },
    });

    // Get all users for user management
    const users = await prisma.user.findMany({
      include: {
        employee: { select: { name: true, employeeId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      user,
      systemStats: {
        totalEmployees,
        totalDepartments,
        totalLeaveTypes,
        totalUsers,
      },
      leaveTypes,
      users,
    });
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// PUT: Update settings
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "UPDATE_PROFILE": {
        const { name, phone, email } = body;
        // Update user email
        if (email) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { email },
          });
        }
        // Update employee name & phone
        const emp = await prisma.employee.findFirst({ where: { userId: session.user.id } });
        if (emp) {
          await prisma.employee.update({
            where: { id: emp.id },
            data: { 
              ...(name && { name }),
              ...(phone && { phone }),
            },
          });
        }
        return NextResponse.json({ success: true, message: "Profile updated" });
      }

      case "CHANGE_PASSWORD": {
        const { currentPassword, newPassword } = body;
        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
        
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        
        const hash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
          where: { id: session.user.id },
          data: { passwordHash: hash },
        });
        return NextResponse.json({ success: true, message: "Password changed" });
      }

      case "UPDATE_LEAVE_TYPE": {
        const { id, name, maxDaysPerYear, maxDaysPerMonth, isPaid } = body;
        await prisma.leaveType.update({
          where: { id },
          data: { name, maxDaysPerYear, maxDaysPerMonth, isPaid },
        });
        return NextResponse.json({ success: true, message: "Leave type updated" });
      }

      case "CREATE_LEAVE_TYPE": {
        const { name, maxDaysPerYear, maxDaysPerMonth, isPaid } = body;
        await prisma.leaveType.create({
          data: { name, maxDaysPerYear, maxDaysPerMonth, isPaid: isPaid ?? true },
        });
        return NextResponse.json({ success: true, message: "Leave type created" });
      }

      case "RESET_USER_PASSWORD": {
        const { userId, newPassword: resetPassword } = body;
        const hash = await bcrypt.hash(resetPassword, 12);
        await prisma.user.update({
          where: { id: userId },
          data: { passwordHash: hash },
        });
        return NextResponse.json({ success: true, message: "User password reset" });
      }

      case "TOGGLE_USER_STATUS": {
        const { userId } = body;
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
        if (targetUser.id === session.user.id) return NextResponse.json({ error: "Cannot disable your own account" }, { status: 400 });
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: !targetUser.isActive },
        });
        return NextResponse.json({ success: true, message: `User ${targetUser.isActive ? "disabled" : "enabled"}` });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[SETTINGS_PUT]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
