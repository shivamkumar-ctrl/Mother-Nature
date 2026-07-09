import React, { useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { useListOrders, getListOrdersQueryKey, useUpdateOrderStatus, useDeleteOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Package, Trash2 } from "lucide-react";
import type { OrderStatusUpdateStatus } from "@workspace/api-client-react";

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: orders, isLoading } = useListOrders(
    { status: statusFilter !== "all" ? statusFilter : undefined }, 
    { query: { queryKey: getListOrdersQueryKey({ status: statusFilter !== "all" ? statusFilter : undefined }) } }
  );
  
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (orderId: number, newStatus: OrderStatusUpdateStatus) => {
    updateStatus.mutate({ id: orderId, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "Order status updated" });
      },
      onError: () => {
        toast({ title: "Failed to update status", variant: "destructive" });
      }
    });
  };

  const handleDelete = (orderId: number) => {
    if (!window.confirm(`Delete order #${orderId}? This cannot be undone.`)) {
      return;
    }
    deleteOrder.mutate({ id: orderId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "Order deleted" });
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message ?? "Failed to delete order";
        toast({ title: msg, variant: "destructive" });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'bg-primary/20 text-primary border-primary/20';
      case 'processing': return 'bg-secondary/20 text-secondary border-secondary/20';
      case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'cancelled': return 'bg-destructive/20 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-muted-foreground/20';
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-primary">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders.</p>
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Mobile Number</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Update Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-9 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-9 w-9" /></td>
                  </tr>
                ))
              ) : orders?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No orders found
                  </td>
                </tr>
              ) : (
                orders?.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-primary hover:underline">
                        #{order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="block hover:text-primary transition-colors">
                        <div className="font-medium">{order.customerName || "Guest"}</div>
                        <div className="text-xs text-muted-foreground">{order.customerEmail || "No email provided"}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {order.phoneNumber || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-[240px] truncate" title={order.shippingAddress ?? undefined}>
                      {order.shippingAddress || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">₹{order.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={`${getStatusColor(order.status)} capitalize`}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Select 
                        value={order.status} 
                        onValueChange={(val) => handleStatusChange(order.id, val as OrderStatusUpdateStatus)}
                        disabled={updateStatus.isPending && updateStatus.variables?.id === order.id}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === "cancelled" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(order.id)}
                          disabled={deleteOrder.isPending && deleteOrder.variables?.id === order.id}
                          aria-label={`Delete order #${order.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
