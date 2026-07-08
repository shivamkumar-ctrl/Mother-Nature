import React from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import {
  useGetWishlist,
  useRemoveFromWishlist,
  getGetWishlistQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, ShoppingCart, Leaf } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { useToast } from "@/hooks/use-toast";

export default function Wishlist() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: wishlist, isLoading } = useGetWishlist({
    query: { queryKey: getGetWishlistQueryKey(), enabled: isAuthenticated },
  });
  const removeFromWishlist = useRemoveFromWishlist();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center space-y-4">
          <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <h2 className="text-2xl font-serif text-primary">Sign in to view your wishlist</h2>
          <Button onClick={() => navigate("/login")}>Log in</Button>
        </div>
      </Layout>
    );
  }

  const handleRemove = (productId: number, productName: string) => {
    removeFromWishlist.mutate(
      { productId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
          toast({
            title: "Removed from wishlist",
            description: `${productName} was removed from your wishlist.`,
          });
        },
      }
    );
  };

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-primary fill-primary/20" />
            <h1 className="text-4xl font-serif text-primary">My Wishlist</h1>
          </div>
          {!isLoading && wishlist && (
            <p className="text-muted-foreground mt-2">
              {wishlist.length} item{wishlist.length !== 1 ? "s" : ""} saved
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full aspect-[4/5] rounded-xl" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            ))}
          </div>
        ) : wishlist?.length === 0 ? (
          <div className="py-24 text-center space-y-6">
            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <div>
              <h2 className="text-2xl font-serif text-primary mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground">
                Browse plants and tap the heart icon to save your favorites.
              </p>
            </div>
            <Button asChild>
              <Link href="/shop">Browse Plants</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist?.map((item) => (
              <div
                key={item.id}
                className="group bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <Link
                  href={`/product/${item.productId}`}
                  className="block relative aspect-[4/5] overflow-hidden bg-muted"
                >
                  {item.product?.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent/50">
                      <Leaf className="h-12 w-12 text-muted-foreground opacity-20" />
                    </div>
                  )}
                </Link>
                <div className="p-4">
                  <Link
                    href={`/product/${item.productId}`}
                    className="font-serif text-lg font-medium hover:text-primary transition-colors block"
                  >
                    {item.product?.name}
                  </Link>
                  <p className="text-sm text-muted-foreground capitalize mb-1">
                    {item.product?.category}
                  </p>
                  <p className="font-medium mb-4">₹{item.product?.price.toFixed(2)}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                      <Link href={`/product/${item.productId}`}>
                        <ShoppingCart className="h-4 w-4" />
                        View Product
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        handleRemove(item.productId, item.product?.name ?? "Item")
                      }
                      disabled={removeFromWishlist.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
