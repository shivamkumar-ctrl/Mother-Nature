import React, { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearch, Link } from "wouter";
import { Layout } from "@/components/Layout";
import {
  useGetProduct,
  getGetProductQueryKey,
  useAddToCart,
  useAddToWishlist,
  useRemoveFromWishlist,
  useGetWishlist,
  getGetCartQueryKey,
  getGetWishlistQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import {
  ArrowLeft, Minus, Plus, Droplets, Sun, Sprout, ShieldCheck, Heart,
  ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut,
} from "lucide-react";

function getImages(product: { imageUrl?: string | null; imageUrls?: string | null }): string[] {
  if (product.imageUrls) {
    try {
      const parsed = JSON.parse(product.imageUrls) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
    } catch {
      // fall through
    }
  }
  if (product.imageUrl) return [product.imageUrl];
  return [];
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}

function Lightbox({ images, index, onClose, onNav }: LightboxProps) {
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLImageElement>(null);

  const toggleZoom = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!zoomed) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPos({ x, y });
      setZoomed(true);
    } else {
      setZoomed(false);
    }
  }, [zoomed]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) { setZoomed(false); onClose(); }
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setZoomed(false); onClose(); }
      if (e.key === "ArrowLeft" && !zoomed) onNav((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight" && !zoomed) onNav((index + 1) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onNav, zoomed]);

  // Prevent scroll on body when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center"
      onClick={handleBackdrop}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
        <span className="text-white/70 text-sm">{index + 1} / {images.length}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomed((z) => !z)}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={zoomed ? "Zoom out" : "Zoom in"}
          >
            {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </button>
          <button
            onClick={() => { setZoomed(false); onClose(); }}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div
        className={`relative flex items-center justify-center w-full h-full px-12 py-16 ${zoomed ? "overflow-hidden" : "overflow-visible"}`}
      >
        <img
          ref={imgRef}
          src={images[index]}
          alt={`Product image ${index + 1}`}
          onClick={toggleZoom}
          className="max-h-full max-w-full object-contain select-none transition-transform duration-300"
          style={
            zoomed
              ? {
                  transform: "scale(2.5)",
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  cursor: "zoom-out",
                }
              : { cursor: "zoom-in" }
          }
          draggable={false}
        />
      </div>

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setZoomed(false); onNav((index - 1 + images.length) % images.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setZoomed(false); onNav((index + 1) % images.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setZoomed(false); onNav(i); }}
              className={`h-12 w-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                i === index ? "border-white scale-110" : "border-white/30 opacity-60 hover:opacity-90"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProductDetail() {
  const { id } = useParams();
  const productId = parseInt(id || "0");
  const searchStr = useSearch();
  const backToShopHref = (() => {
    const fromQuery = new URLSearchParams(searchStr).get("from");
    return fromQuery ? `/shop?${fromQuery}` : "/shop";
  })();
  const [quantity, setQuantity] = useState(1);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) },
  });

  const { data: wishlist } = useGetWishlist({
    query: { queryKey: getGetWishlistQueryKey(), enabled: isAuthenticated },
  });

  const isWishlisted = wishlist?.some((w) => w.productId === productId) ?? false;
  const addToCart = useAddToCart();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const images = product ? getImages(product) : [];

  useEffect(() => {
    setSelectedIdx(0);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const scrollToIdx = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    isProgrammaticScroll.current = true;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    window.setTimeout(() => { isProgrammaticScroll.current = false; }, 400);
  };

  const goToIdx = (i: number) => {
    setSelectedIdx(i);
    scrollToIdx(i);
  };

  const handleGalleryScroll = () => {
    const el = scrollRef.current;
    if (!el || isProgrammaticScroll.current) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setSelectedIdx((prev) => (prev === i ? prev : i));
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    addToCart.mutate(
      { data: { productId, quantity } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Added to cart", description: `${quantity}x ${product?.name} has been added to your cart.` });
          setQuantity(1);
        },
        onError: () => {
          toast({ title: "Error", description: "Could not add to cart. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (isWishlisted) {
      removeFromWishlist.mutate(
        { productId },
        { onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
            toast({ title: "Removed from wishlist", description: `${product?.name} was removed from your wishlist.` });
        }},
      );
    } else {
      addToWishlist.mutate(
        { data: { productId } },
        { onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
            toast({ title: "Added to wishlist", description: `${product?.name} was saved to your wishlist.` });
        }},
      );
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/2 space-y-3">
            <Skeleton className="w-full aspect-[4/5] rounded-2xl" />
            <div className="flex gap-2">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <Skeleton className="h-16 w-16 rounded-xl" />
              <Skeleton className="h-16 w-16 rounded-xl" />
            </div>
          </div>
          <div className="w-full md:w-1/2 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h2 className="text-2xl font-serif text-primary mb-4">Product not found</h2>
          <Link href={backToShopHref} className="text-secondary hover:underline">Return to shop</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {lightboxOpen && (
        <Lightbox
          images={images}
          index={selectedIdx}
          onClose={() => setLightboxOpen(false)}
          onNav={goToIdx}
        />
      )}

      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href={backToShopHref} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-10">

        {/* ── Left: image gallery ────────────────────────── */}
        <div className="w-full md:w-1/2 flex flex-col gap-3">

          {/* Main image */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-lg group">
            {images.length > 0 ? (
              <>
                <div
                  ref={scrollRef}
                  onScroll={handleGalleryScroll}
                  className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${product.name} ${i + 1}`}
                      className="object-cover w-full h-full flex-shrink-0 snap-center cursor-zoom-in transition-transform duration-300 md:group-hover:scale-105"
                      onClick={() => { setSelectedIdx(i); setLightboxOpen(true); }}
                      draggable={false}
                    />
                  ))}
                </div>
                {/* Zoom hint */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1.5 rounded-full opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none">
                  <ZoomIn className="h-3.5 w-3.5" /> Tap to zoom
                </div>
                {/* Prev / Next arrows over main image (desktop) */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => goToIdx((selectedIdx - 1 + images.length) % images.length)}
                      className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white/80 hover:bg-white shadow text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => goToIdx((selectedIdx + 1) % images.length)}
                      className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 items-center justify-center rounded-full bg-white/80 hover:bg-white shadow text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                {/* Swipe hint + dot indicators (mobile) */}
                {images.length > 1 && (
                  <>
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[11px] px-2.5 py-1 rounded-full md:hidden pointer-events-none">
                      Swipe to see more
                    </div>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden pointer-events-none">
                      {images.map((_, i) => (
                        <span
                          key={i}
                          className={`h-2 w-2 rounded-full transition-all ${i === selectedIdx ? "bg-white w-4" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-accent/50 text-muted-foreground">
                <span className="font-serif text-xl italic opacity-50">Mother Nature</span>
              </div>
            )}

            {/* Wishlist heart */}
            <button
              onClick={handleToggleWishlist}
              className={`absolute top-4 right-4 h-10 w-10 rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
                isWishlisted ? "bg-primary text-primary-foreground" : "bg-white/90 text-foreground hover:bg-white"
              }`}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Thumbnail strip (desktop) */}
          {images.length > 1 && (
            <div className="hidden md:flex gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => goToIdx(i)}
                  className={`flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    i === selectedIdx
                      ? "border-primary shadow-md scale-105"
                      : "border-transparent opacity-60 hover:opacity-100 hover:border-muted-foreground/30"
                  }`}
                >
                  <img src={src} alt={`View ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: product info ────────────────────────── */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="mb-2 uppercase tracking-wider text-xs font-bold text-muted-foreground">
            {product.category}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4">{product.name}</h1>
          <p className="text-2xl font-medium mb-6">${product.price.toFixed(2)}</p>

          <div className="prose prose-stone mb-8 text-muted-foreground">
            <p>{product.description}</p>
          </div>

          <div className="bg-accent/50 rounded-xl p-6 mb-8 grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Droplets className="h-5 w-5 text-secondary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Watering</h4>
                <p className="text-sm text-muted-foreground">{product.watering || "Moderate watering"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sun className="h-5 w-5 text-[#EAB308] mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Light</h4>
                <p className="text-sm text-muted-foreground">{product.sunlight || "Bright indirect light"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sprout className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Care Level</h4>
                <p className="text-sm text-muted-foreground">{product.careLevel || "Easy"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Guarantee</h4>
                <p className="text-sm text-muted-foreground">Arrives healthy</p>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center border rounded-md">
                <button
                  className="p-2 hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  className="p-2 hover:bg-muted transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-muted-foreground">{product.stock} available</span>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 h-14 text-lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addToCart.isPending}
              >
                {product.stock === 0
                  ? "Out of Stock"
                  : !isAuthenticated
                  ? "Log in to Add to Cart"
                  : addToCart.isPending
                  ? "Adding..."
                  : "Add to Cart"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-14"
                onClick={handleToggleWishlist}
                title={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? "fill-primary text-primary" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
