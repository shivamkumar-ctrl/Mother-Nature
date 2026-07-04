import React from "react";
import { useParams, Link } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { useGetOrder, getGetOrderQueryKey, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Truck, Package, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { OrderStatusUpdateStatus } from "@workspace/api-client-react/src/generated/api.schemas";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const orderId = parseInt(id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { enabled: !!orderId, queryKey: getGetOrderQueryKey(orderId) },
  });

  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = (newStatus: OrderStatusUpdateStatus) => {
    updateStatus.mutate({ id: orderId, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "Order status updated" });
      },
      onError: () => {
        toast({ title: "Failed to update status", variant: "destructive" });
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-primary/20 text-primary border-primary/20";
      case "processing": return "bg-secondary/20 text-secondary border-secondary/20";
      case "shipped": return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled": return "bg-destructive/20 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground border-muted-foreground/20";
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-serif text-primary mb-4">Order not found</h2>
          <Link href="/admin/orders" className="text-secondary hover:underline">Back to Orders</Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-primary flex items-center gap-3 flex-wrap">
            Order #{order.id}
            <Badge variant="outline" className={`${getStatusColor(order.status)} capitalize text-sm`}>
              {order.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Placed on {format(new Date(order.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
        <div className="text-2xl font-medium">${order.total.toFixed(2)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-primary mb-3">
            <User className="h-5 w-5" />
            <h3 className="font-serif text-lg">Customer</h3>
          </div>
          <p className="font-medium">{order.customerName || "Guest"}</p>
          <p className="text-sm text-muted-foreground">{order.customerEmail || "No email"}</p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-primary mb-3">
            <MapPin className="h-5 w-5" />
            <h3 className="font-serif text-lg">Shipping Address</h3>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.shippingAddress}</p>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Truck className="h-5 w-5" />
            <h3 className="font-serif text-lg">Update Status</h3>
          </div>
          <Select
            value={order.status}
            onValueChange={(val) => handleStatusChange(val as OrderStatusUpdateStatus)}
            disabled={updateStatus.isPending}
          >
            <SelectTrigger>
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
          {order.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="bg-muted/50 px-6 py-4 border-b">
          <h3 className="font-serif text-lg font-medium">Items Ordered</h3>
        </div>
        <div className="divide-y">
          {order.items.map((item) => (
            <div key={item.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-muted-foreground opacity-50" />
                </div>
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="font-medium self-end sm:self-auto">
                ${(item.unitPrice * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-muted/30 p-6 flex flex-col items-end gap-2 border-t">
          <div className="flex justify-between w-full sm:w-64 text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full sm:w-64 text-sm text-muted-foreground">
            <span>Shipping</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between w-full sm:w-64 text-base font-medium pt-2 border-t mt-2">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
