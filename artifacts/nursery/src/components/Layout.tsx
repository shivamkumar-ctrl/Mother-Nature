import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { useGetCart, useGetWishlist, getGetCartQueryKey, getGetWishlistQueryKey } from "@workspace/api-client-react";
import {
  ShoppingCart, Leaf, Heart, Package, Menu, X,
  LayoutDashboard, ShoppingBag, ClipboardList, Users, ChevronDown,
} from "lucide-react";

const PLANT_SUBCATEGORIES = [
  { label: "Bloom Throughout Year", slug: "bloom-throughout-year" },
  { label: "Summer Flowers",        slug: "summer-flowers" },
  { label: "Winter Flowers",        slug: "winter-flowers" },
  { label: "Monsoon Flowers",       slug: "monsoon-flowers" },
  { label: "Indoor Plants",         slug: "indoor-plants" },
  { label: "Outdoor Plants",        slug: "outdoor-plants" },
  { label: "Air Purifiers",         slug: "air-purifiers" },
  { label: "Medical Herbs",         slug: "medical-herbs" },
];

const MAIN_NAV = [
  { label: "Trees",    href: "/shop?category=trees" },
  { label: "Seeds",    href: "/shop?category=seeds" },
  { label: "Help",     href: "/help" },
  { label: "About Us", href: "/about" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { data: cart }     = useGetCart({ query: { queryKey: getGetCartQueryKey(),     enabled: isAuthenticated } });
  const { data: wishlist } = useGetWishlist({ query: { queryKey: getGetWishlistQueryKey(), enabled: isAuthenticated } });

  const [location] = useLocation();
  const [adminMenuOpen,  setAdminMenuOpen]  = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [plantsOpen,     setPlantsOpen]     = useState(false);
  const [mobilePlantsOpen, setMobilePlantsOpen] = useState(false);

  const plantsRef = useRef<HTMLDivElement>(null);

  // Close desktop Plants dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (plantsRef.current && !plantsRef.current.contains(e.target as Node)) {
        setPlantsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location]);

  const cartItemCount  = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const wishlistCount  = wishlist?.length || 0;
  const isShopActive   = location.startsWith("/shop");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">

        {/* ── Main bar ── */}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* LEFT: mobile hamburger + logo */}
          <div className="flex items-center gap-2">
            {/* Mobile hamburger — left of logo */}
            <button
              className="md:hidden p-2 -ml-2 rounded-md hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
              <Leaf className="h-6 w-6" />
              <span className="font-serif text-xl font-medium tracking-tight">Mother Nature</span>
            </Link>
          </div>

          {/* CENTRE: desktop nav (separate div, hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {/* Plants dropdown */}
            <div className="relative" ref={plantsRef}>
              <button
                onClick={() => setPlantsOpen((o) => !o)}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${isShopActive ? "text-primary" : "text-foreground"}`}
              >
                Plants
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${plantsOpen ? "rotate-180" : ""}`} />
              </button>

              {plantsOpen && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-card border rounded-xl shadow-lg py-1 z-50">
                  {PLANT_SUBCATEGORIES.map(({ label, slug }) => (
                    <Link
                      key={slug}
                      href={`/shop?category=${slug}`}
                      onClick={() => setPlantsOpen(false)}
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Other nav items */}
            {MAIN_NAV.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors ${location === href || location.startsWith(href.split("?")[0]) ? "text-primary" : "text-foreground"}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* RIGHT: admin + icons + login */}
          <div className="flex items-center gap-1">
            {/* Admin hamburger — owner only */}
            {user?.isOwner && (
              <div className="relative">
                <button
                  onClick={() => setAdminMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors px-2 py-1 rounded-md hover:bg-secondary/10"
                  aria-label="Admin menu"
                >
                  {adminMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  <span className="hidden sm:inline">Admin</span>
                </button>

                {adminMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAdminMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-card border rounded-xl shadow-lg py-1 z-50">
                      {[
                        { href: "/admin",           label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
                        { href: "/admin/products",  label: "Products",  icon: <ShoppingBag className="h-4 w-4" /> },
                        { href: "/admin/orders",    label: "Orders",    icon: <ClipboardList className="h-4 w-4" /> },
                        { href: "/admin/customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
                      ].map(({ href, label, icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setAdminMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${location === href || location.startsWith(href + "/") ? "text-primary font-medium" : "text-foreground"}`}
                        >
                          {icon}{label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Auth-only icons */}
            {isAuthenticated && (
              <>
                <Link href="/orders" className={`relative p-2 transition-colors hover:text-primary ${location.startsWith("/orders") ? "text-primary" : "text-foreground"}`} title="Orders">
                  <Package className="h-5 w-5" />
                </Link>
                <Link href="/wishlist" className={`relative p-2 transition-colors hover:text-primary ${location.startsWith("/wishlist") ? "text-primary" : "text-foreground"}`} title="Wishlist">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 h-4 w-4 rounded-full bg-secondary text-secondary-foreground text-[10px] flex items-center justify-center font-bold shadow-sm">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link href="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors" title="Cart">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center font-bold shadow-sm">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              </>
            )}

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

        {/* ── Mobile slide-down menu ── */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur-md">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">

              {/* Plants with sub-items */}
              <div>
                <button
                  onClick={() => setMobilePlantsOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md hover:bg-muted transition-colors text-foreground"
                >
                  <span>Plants</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${mobilePlantsOpen ? "rotate-180" : ""}`} />
                </button>
                {mobilePlantsOpen && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l pl-3">
                    {PLANT_SUBCATEGORIES.map(({ label, slug }) => (
                      <Link
                        key={slug}
                        href={`/shop?category=${slug}`}
                        className="block px-2 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Other nav items */}
              {MAIN_NAV.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className={`block px-3 py-2.5 text-sm font-medium rounded-md hover:bg-muted transition-colors ${location === href || location.startsWith(href.split("?")[0]) ? "text-primary" : "text-foreground"}`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
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
