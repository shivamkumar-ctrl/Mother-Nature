import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Package, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CustomerOrders() {
  const { data: orders, isLoading } = useListOrders({}, { query: { queryKey: getListOrdersQueryKey({}) } });
  const { user } = useAuth();

  const orderNumberById = new Map(
    [...(orders ?? [])]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((o, idx) => [o.id, idx + 1])
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'bg-primary/20 text-primary';
      case 'processing': return 'bg-secondary/20 text-secondary';
      case 'shipped': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-serif text-primary">Order History</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-16 bg-card border rounded-2xl shadow-sm">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-serif mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4">When you place an order, it will appear here.</p>
            <Link href="/shop" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="block">
                <div className="bg-card border rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">Order #{user?.isOwner ? order.id : orderNumberById.get(order.id)}</span>
                      <Badge variant="secondary" className={`${getStatusColor(order.status)} border-0 capitalize`}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), 'MMM d, yyyy')} • {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    <span className="font-medium">₹{order.total.toFixed(2)}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
