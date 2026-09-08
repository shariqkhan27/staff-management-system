import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "OWNER" && session.user.role !== "HR_MANAGER" && session.user.role !== "FINANCE_MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Current month totals
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const currentIncome = await prisma.incomeRecord.aggregate({
      where: { date: { gte: currentMonthStart, lte: currentMonthEnd } },
      _sum: { amount: true }
    });

    const currentExpenses = await prisma.expense.aggregate({
      where: { date: { gte: currentMonthStart, lte: currentMonthEnd } },
      _sum: { amount: true }
    });

    const currentPayroll = await prisma.salaryRecord.aggregate({
      where: { month: now.getMonth() + 1, year: now.getFullYear(), status: { not: "DRAFT" } },
      _sum: { netSalary: true }
    });

    const totalIncome = Number(currentIncome._sum.amount || 0);
    const totalExpenses = Number(currentExpenses._sum.amount || 0) + Number(currentPayroll._sum.netSalary || 0);
    const netProfit = totalIncome - totalExpenses;

    // Last 6 months chart data
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));
      
      const inc = await prisma.incomeRecord.aggregate({
        where: { date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true }
      });
      
      const exp = await prisma.expense.aggregate({
        where: { date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true }
      });

      const pr = await prisma.salaryRecord.aggregate({
        where: { month: monthStart.getMonth() + 1, year: monthStart.getFullYear(), status: { not: "DRAFT" } },
        _sum: { netSalary: true }
      });

      chartData.push({
        name: format(monthStart, "MMM"),
        Income: Number(inc._sum.amount || 0),
        Expenses: Number(exp._sum.amount || 0) + Number(pr._sum.netSalary || 0),
      });
    }

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpenses,
        netProfit
      },
      chartData
    });
  } catch (error) {
    console.error("[FINANCE_SUMMARY_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
