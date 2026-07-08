import React from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { 
  useGetDashboardStats, getGetDashboardStatsQueryKey,
  useGetRecentOrders, getGetRecentOrdersQueryKey,
  useGetLowStockProducts, getGetLowStockProductsQueryKey
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { IndianRupee, ShoppingBag, Users, AlertTriangle, ArrowRight, Package } from "lucide-react";
import { format } from "date-fns";
import { StoreQRCode } from "@/components/StoreQRCode";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: recentOrders, isLoading: ordersLoading } = useGetRecentOrders({ query: { queryKey: getGetRecentOrdersQueryKey() } });
  const { data: lowStock, isLoading: stockLoading } = useGetLowStockProducts({ query: { queryKey: getGetLowStockProductsQueryKey() } });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-primary">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your nursery's performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: stats ? `₹${stats.totalRevenue.toFixed(2)}` : null, icon: IndianRupee },
          { label: "Orders", value: stats?.totalOrders, icon: ShoppingBag },
          { label: "Customers", value: stats?.totalCustomers, icon: Users },
          { label: "Low Stock Items", value: stats?.lowStockCount, icon: AlertTriangle, warning: (stats?.lowStockCount || 0) > 0 }
        ].map((stat, i) => (
          <div key={i} className={`bg-card p-6 rounded-xl border shadow-sm flex items-center gap-4 ${stat.warning ? 'border-destructive/50 bg-destructive/5' : ''}`}>
            <div className={`p-3 rounded-lg ${stat.warning ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className="text-2xl font-bold">
                {statsLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-muted/20">
            <h2 className="font-serif text-xl font-medium">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-secondary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-0">
            {ordersLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentOrders?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No recent orders</div>
            ) : (
              <div className="divide-y">
                {recentOrders?.map(order => (
                  <div key={order.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium">Order #{order.id}</span>
                      <span className="text-sm text-muted-foreground">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">₹{order.total.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground capitalize">{order.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b flex justify-between items-center bg-muted/20">
            <h2 className="font-serif text-xl font-medium">Low Stock Alerts</h2>
            <Link href="/admin/products" className="text-sm text-secondary hover:underline flex items-center gap-1">
              Manage <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="p-0 flex-1">
            {stockLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : lowStock?.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Package className="h-8 w-8 opacity-20" />
                <span>All products are well stocked.</span>
              </div>
            ) : (
              <div className="divide-y">
                {lowStock?.map(product => (
                  <div key={product.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col max-w-[200px]">
                      <span className="font-medium truncate" title={product.name}>{product.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{product.category}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${product.stock === 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-secondary'}`}>
                      {product.stock} left
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/20">
            <h2 className="font-serif text-xl font-medium">Store QR Code</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Print this on packaging, flyers, or in-store signage so customers can scan it and shop online.
            </p>
          </div>
          <div className="p-6 flex justify-center sm:justify-start">
            <StoreQRCode size={160} showDownload />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
