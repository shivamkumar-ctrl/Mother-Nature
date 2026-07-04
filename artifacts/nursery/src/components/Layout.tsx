import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { useGetCart } from "@workspace/api-client-react";
import { getGetCartQueryKey } from "@workspace/api-client-react";
import { ShoppingCart, Sprout, User, Menu } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { data: cart } = useGetCart({ query: { queryKey: getGetCartQueryKey() } });
  
  const [location] = useLocation();

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <Sprout className="h-6 w-6" />
              <span className="font-serif text-xl font-medium tracking-tight">Bloom & Root</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/shop" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/shop") ? "text-primary" : "text-muted-foreground"}`}>
                Shop
              </Link>
              <Link href="/orders" className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/orders") ? "text-primary" : "text-muted-foreground"}`}>
                Orders
              </Link>
              {user?.isOwner && (
                <Link href="/admin" className="text-sm font-medium text-secondary hover:text-secondary/80 transition-colors">
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button variant="ghost" onClick={() => logout()} className="text-sm font-medium">
                Log out
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => login()} className="text-sm font-medium">
                Log in
              </Button>
            )}
            
            <Link href="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Sprout className="h-5 w-5" />
            <span className="font-serif text-lg font-medium">Bloom & Root</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Bloom & Root Nursery. Cultivating beauty daily.
          </p>
        </div>
      </footer>
    </div>
  );
}
