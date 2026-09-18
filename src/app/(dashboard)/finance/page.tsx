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

      <div className="flex overflow-x-auto border-b border-border hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 pt-2 px-1 mr-6 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`pb-3 pt-2 px-1 mr-6 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeTab === "income" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`pb-3 pt-2 px-1 mr-6 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeTab === "expenses" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab("petty-cash")}
          className={`pb-3 pt-2 px-1 mr-6 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeTab === "petty-cash" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Petty Cash
        </button>
        <button
          onClick={() => setActiveTab("vendors")}
          className={`pb-3 pt-2 px-1 mr-6 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeTab === "vendors" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
          }`}
        >
          Vendors
        </button>
        <button
          onClick={() => setActiveTab("budgets")}
          className={`pb-3 pt-2 px-1 mr-6 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeTab === "budgets" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
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
