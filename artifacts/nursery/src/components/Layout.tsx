import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { useGetCart, useGetWishlist, getGetCartQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { ShoppingCart, Leaf, Heart, Package, Menu, X, LayoutDashboard, ShoppingBag, ClipboardList, Users } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { data: cart } = useGetCart({ query: { queryKey: getGetCartQueryKey(), enabled: isAuthenticated } });
  const { data: wishlist } = useGetWishlist({ query: { queryKey: getGetWishlistQueryKey(), enabled: isAuthenticated } });

  const [location] = useLocation();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const wishlistCount = wishlist?.length || 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

          {/* Left: Logo + Shop + Admin hamburger */}
          <div className="flex items-center gap-5">
            <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <Leaf className="h-6 w-6" />
              <span className="font-serif text-xl font-medium tracking-tight">Mother Nature</span>
            </Link>

            <Link
              href="/shop"
              className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/shop") ? "text-primary" : "text-muted-foreground"}`}
            >
              Shop
            </Link>

            {/* Admin hamburger — only shown when logged in as owner */}
            {user?.isOwner && (
              <div className="relative">
                <button
                  onClick={() => setAdminMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors px-2 py-1 rounded-md hover:bg-secondary/10"
                  aria-label="Admin menu"
                >
                  {adminMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  <span>Admin</span>
                </button>

                {adminMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-52 bg-card border rounded-xl shadow-lg py-1 z-50">
                    {[
                      { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
                      { href: "/admin/products", label: "Products", icon: <ShoppingBag className="h-4 w-4" /> },
                      { href: "/admin/orders", label: "Orders", icon: <ClipboardList className="h-4 w-4" /> },
                      { href: "/admin/customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
                    ].map(({ href, label, icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setAdminMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${location === href || location.startsWith(href + "/") ? "text-primary font-medium" : "text-foreground"}`}
                      >
                        {icon}
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: icons + Login/Logout */}
          <div className="flex items-center gap-1">
            {isAuthenticated && (
              <>
                <Link
                  href="/orders"
                  className={`relative p-2 transition-colors hover:text-primary ${location.startsWith("/orders") ? "text-primary" : "text-foreground"}`}
                  title="Order History"
                >
                  <Package className="h-5 w-5" />
                </Link>
                <Link
                  href="/wishlist"
                  className={`relative p-2 transition-colors hover:text-primary ${location.startsWith("/wishlist") ? "text-primary" : "text-foreground"}`}
                  title="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 h-4 w-4 rounded-full bg-secondary text-secondary-foreground text-[10px] flex items-center justify-center font-bold shadow-sm">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            <Link href="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors" title="Cart">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Login / Logout — always visible */}
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={() => logout()} className="text-sm font-medium ml-1">
                Log out
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => { window.location.href = "/api/login"; }} className="text-sm font-medium ml-1">
                Log in
              </Button>
            )}
          </div>
        </div>

        {/* Click-away overlay to close admin menu */}
        {adminMenuOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setAdminMenuOpen(false)} />
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Leaf className="h-5 w-5" />
            <span className="font-serif text-lg font-medium">Mother Nature</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Mother Nature Nursery. Cultivating beauty daily.
          </p>
        </div>
      </footer>
    </div>
  );
}
