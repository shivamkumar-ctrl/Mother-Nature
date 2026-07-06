import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, Leaf } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-serif">Admin Access Required</h1>
          <Button onClick={() => window.location.href = '/login'}>Log In</Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/products", label: "Products", icon: Package },
    { path: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { path: "/admin/customers", label: "Customers", icon: Users },
  ];

  return (
    <div className="min-h-[100dvh] flex bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold">
            <Leaf className="h-5 w-5" />
            <span className="font-serif text-lg">Mother Nature</span>
          </Link>
          <div className="text-xs text-muted-foreground mt-1">Nursery Management</div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== '/admin' && location.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10 md:hidden">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold">
            <Leaf className="h-5 w-5" />
            <span className="font-serif text-lg">Mother Nature</span>
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || (item.path !== '/admin' && location.startsWith(item.path));
              return (
                <Link key={item.path} href={item.path} className={`p-2 rounded-md transition-colors ${isActive ? 'text-primary bg-accent' : 'text-muted-foreground hover:text-primary'}`} title={item.label}>
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
            <button onClick={() => logout()} className="p-2 rounded-md text-muted-foreground hover:text-primary transition-colors" title="Sign Out">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div className="flex-1 p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
