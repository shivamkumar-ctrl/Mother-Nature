import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useGetProduct, getGetProductQueryKey, useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { ArrowLeft, Minus, Plus, Droplets, Sun, Sprout, ShieldCheck } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const productId = parseInt(id || "0");
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const { data: product, isLoading } = useGetProduct(productId, { 
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) } 
  });

  const addToCart = useAddToCart();

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      window.location.href = `/api/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    addToCart.mutate({ data: { productId, quantity } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({
          title: "Added to cart",
          description: `${quantity}x ${product?.name} has been added to your cart.`,
        });
        setQuantity(1);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not add to cart. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
          <Skeleton className="w-full md:w-1/2 aspect-[4/5] rounded-2xl" />
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
          <Link href="/shop" className="text-secondary hover:underline">Return to shop</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-lg">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-accent/50 text-muted-foreground">
                <span className="font-serif text-xl italic opacity-50">Bloom & Root</span>
              </div>
            )}
          </div>
        </div>

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
              <span className="text-sm text-muted-foreground">
                {product.stock} available
              </span>
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 text-lg" 
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addToCart.isPending}
            >
              {product.stock === 0 ? "Out of Stock" : !isAuthenticated ? "Log in to Add to Cart" : addToCart.isPending ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
