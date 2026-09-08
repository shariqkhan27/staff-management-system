"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";

export default function BudgetManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, budRes] = await Promise.all([
        fetch("/api/finance/expense-categories"),
        fetch(`/api/finance/budgets?month=${month}&year=${year}`)
      ]);
      
      if (catRes.ok) setCategories(await catRes.json());
      
      if (budRes.ok) {
        const b = await budRes.json();
        const bMap: Record<string, any> = {};
        b.forEach((item: any) => {
          bMap[item.categoryId] = item.budgetedAmount;
        });
        setBudgets(bMap);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const handleSaveBudget = async (categoryId: string, amount: string) => {
    try {
      const res = await fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          month,
          year,
          budgetedAmount: parseFloat(amount || "0")
        }),
      });

      if (!res.ok) throw new Error("Failed to save budget");
      
      toast({ title: "Success", description: "Budget updated." });
    } catch (error) {
      toast({ title: "Error", description: "Could not save budget.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Monthly Budgets</h2>
          <p className="text-sm text-muted-foreground">Set spending limits for expense categories.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="space-y-1 w-full sm:w-auto">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Month</label>
            <select 
              className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={month} 
              onChange={e => setMonth(parseInt(e.target.value))}
            >
              {Array.from({length: 12}).map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1 w-full sm:w-auto">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Year</label>
            <select 
              className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={year} 
              onChange={e => setYear(parseInt(e.target.value))}
            >
              {[...Array(15)].map((_, i) => {
                const y = new Date().getFullYear() + 5 - i;
                return (
                  <option key={y} value={y}>{y}</option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Expense Category</th>
                <th className="px-6 py-4">Budgeted Amount (PKR)</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">Loading categories...</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No expense categories found. Please add categories in the Expenses tab first.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const currentBudget = budgets[cat.id] || "";
                  return (
                    <tr key={cat.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-bold">{cat.name}</td>
                      <td className="px-6 py-4">
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="max-w-[200px]"
                          defaultValue={currentBudget}
                          onBlur={(e) => {
                            if (e.target.value !== String(currentBudget)) {
                              handleSaveBudget(cat.id, e.target.value);
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs text-muted-foreground">Saves automatically</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
