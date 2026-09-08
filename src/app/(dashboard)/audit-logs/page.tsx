"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Shield, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toaster";
import { Select } from "@/components/ui/select";
import { useUser } from "@/lib/user-context";
import { useRouter } from "next/navigation";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  changes: any;
  createdAt: string;
  userName: string;
}

export default function AuditLogsPage() {
  const { role } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");

  useEffect(() => {
    if (role && role !== "OWNER") {
      router.push("/");
    }
  }, [role, router]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/audit-logs?entity=${entityFilter}&action=${actionFilter}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLogs(data);
    } catch {
      toast({ title: "Error", description: "Failed to load audit logs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, entityFilter, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(search.toLowerCase()) || 
    log.entityId.toLowerCase().includes(search.toLowerCase())
  );

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("ADDED")) return "success";
    if (action.includes("DELETE") || action.includes("EXPENSE") || action.includes("REMOVED")) return "destructive";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "warning";
    if (action.includes("PROCESS")) return "default";
    return "secondary";
  };

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (role !== "OWNER") return null;

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            System Audit Logs
          </h2>
          <p className="text-muted-foreground mt-1">Track all critical actions performed in the system.</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user or entity ID..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select 
                value={entityFilter} 
                onChange={(e) => setEntityFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Entities" },
                  { value: "EMPLOYEE", label: "Employees" },
                  { value: "PAYROLL", label: "Payroll" },
                  { value: "EXPENSE", label: "Expenses" },
                  { value: "SETTING", label: "Settings" },
                  { value: "USER", label: "Users" },
                ]}
                className="w-full sm:w-36"
              />
              <Select 
                value={actionFilter} 
                onChange={(e) => setActionFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Actions" },
                  { value: "CREATE", label: "Create" },
                  { value: "UPDATE", label: "Update" },
                  { value: "DELETE", label: "Delete" },
                  { value: "PROCESS", label: "Process" },
                ]}
                className="w-full sm:w-36"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr className="border-b border-border">
                  <th className="p-4 text-left font-medium text-muted-foreground">Timestamp</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">User</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Action</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Entity</th>
                  <th className="p-4 text-left font-medium text-muted-foreground">Details / Changes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No logs found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 table-row-hover">
                      <td className="p-4 text-xs whitespace-nowrap text-muted-foreground">
                        {format(new Date(log.createdAt), "dd MMM yyyy, hh:mm a")}
                      </td>
                      <td className="p-4 font-medium">{log.userName}</td>
                      <td className="p-4">
                        <Badge variant={getActionColor(log.action) as any} className="text-[10px]">
                          {log.action.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs bg-secondary px-2 py-1 rounded text-secondary-foreground">
                          {log.entity}
                        </span>
                        {log.changes?.module && (
                          <Badge variant="outline" className="ml-2 text-[9px] uppercase border-border text-muted-foreground">
                            {log.changes.module}
                          </Badge>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1">ID: {log.entityId}</div>
                      </td>
                      <td className="p-4">
                        {log.changes ? (
                          <div className="flex flex-col gap-1">
                            {log.changes.details && (
                              <span className="text-sm text-foreground">{log.changes.details}</span>
                            )}
                            {Object.keys(log.changes).filter(k => k !== 'details' && k !== 'module').length > 0 && (
                              <pre className="text-[10px] bg-muted/50 p-2 rounded-md overflow-x-auto max-w-xs sm:max-w-md text-muted-foreground mt-1">
                                {JSON.stringify(
                                  Object.fromEntries(Object.entries(log.changes).filter(([k]) => k !== 'details' && k !== 'module')), 
                                  null, 2
                                )}
                              </pre>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No details</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
