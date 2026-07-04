import React from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, Package, Truck, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const orderId = parseInt(id || "0");

  const { data: order, isLoading } = useGetOrder(orderId, { 
    query: { enabled: !!orderId, queryKey: getGetOrderQueryKey(orderId) } 
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-2xl font-serif text-primary mb-4">Order not found</h2>
          <Link href="/orders" className="text-secondary hover:underline">Return to orders</Link>
        </div>
      </Layout>
    );
  }

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
      <div className="bg-muted/30 py-4 border-b">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Orders
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif text-primary flex items-center gap-3">
              Order #{order.id}
              <Badge variant="secondary" className={`${getStatusColor(order.status)} border-0 text-sm capitalize`}>
                {order.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1">Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}</p>
          </div>
          <div className="text-xl font-medium">${order.total.toFixed(2)}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary mb-2">
              <MapPin className="h-5 w-5" />
              <h3 className="font-serif text-lg">Shipping Address</h3>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.shippingAddress}</p>
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Truck className="h-5 w-5" />
              <h3 className="font-serif text-lg">Order Status</h3>
            </div>
            <p className="text-sm text-muted-foreground capitalize">Currently {order.status}</p>
            <p className="text-xs text-muted-foreground italic">Updates are sent via email.</p>
          </div>

          {order.notes && (
            <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Package className="h-5 w-5" />
                <h3 className="font-serif text-lg">Order Notes</h3>
              </div>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="bg-muted/50 px-6 py-4 border-b">
            <h3 className="font-serif text-lg font-medium">Items Ordered</h3>
          </div>
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-muted-foreground opacity-50" />
                  </div>
                  <div>
                    <Link href={`/product/${item.productId}`} className="font-medium hover:text-primary transition-colors hover:underline">
                      {item.productName}
                    </Link>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
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
      </div>
    </Layout>
  );
}
