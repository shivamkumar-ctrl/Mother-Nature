import React, { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { useListCustomers, getListCustomersQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useListCustomers(
    { search: search || undefined }, 
    { query: { queryKey: getListCustomersQueryKey({ search: search || undefined }) } }
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-primary">Customers</h1>
          <p className="text-muted-foreground mt-1">View your customer base and their order history.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search customers by name or email..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-8 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : customers?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No customers found
                  </td>
                </tr>
              ) : (
                customers?.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-serif uppercase text-xs flex-shrink-0">
                        {customer.name?.[0] || customer.firstName?.[0] || customer.email?.[0] || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {customer.firstName} {customer.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {customer.name || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {customer.totalOrders}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${customer.totalSpent.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
