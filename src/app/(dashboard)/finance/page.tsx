"use client";

import { useState } from "react";
import FinanceOverview from "./_components/finance-overview";
import IncomeTable from "./_components/income-table";
import ExpenseTable from "./_components/expense-table";
import PettyCashTable from "./_components/petty-cash-table";
import VendorTable from "./_components/vendor-table";
import BudgetManager from "./_components/budget-manager";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "income" | "expenses" | "petty-cash" | "vendors" | "budgets">("overview");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
        <p className="text-muted-foreground">Manage company income, expenses, budgets, and vendors.</p>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-lg overflow-x-auto max-w-full w-full sm:w-max hide-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "overview" ? "bg-background shadow-sm" : "hover:bg-background/50 text-muted-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "income" ? "bg-background shadow-sm" : "hover:bg-background/50 text-muted-foreground"
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "expenses" ? "bg-background shadow-sm" : "hover:bg-background/50 text-muted-foreground"
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab("petty-cash")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "petty-cash" ? "bg-background shadow-sm" : "hover:bg-background/50 text-muted-foreground"
          }`}
        >
          Petty Cash
        </button>
        <button
          onClick={() => setActiveTab("vendors")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "vendors" ? "bg-background shadow-sm" : "hover:bg-background/50 text-muted-foreground"
          }`}
        >
          Vendors
        </button>
        <button
          onClick={() => setActiveTab("budgets")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === "budgets" ? "bg-background shadow-sm" : "hover:bg-background/50 text-muted-foreground"
          }`}
        >
          Budgets
        </button>
      </div>

      <div className="mt-6">
        {activeTab === "overview" && <FinanceOverview />}
        {activeTab === "income" && <IncomeTable />}
        {activeTab === "expenses" && <ExpenseTable />}
        {activeTab === "petty-cash" && <PettyCashTable />}
        {activeTab === "vendors" && <VendorTable />}
        {activeTab === "budgets" && <BudgetManager />}
      </div>
    </div>
  );
}
