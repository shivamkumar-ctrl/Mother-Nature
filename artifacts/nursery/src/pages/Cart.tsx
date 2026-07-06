import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { useGetCart, getGetCartQueryKey, useUpdateCartItem, useRemoveFromCart, useCheckoutCart } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Cart() {
  const { data: cart, isLoading } = useGetCart({ query: { queryKey: getGetCartQueryKey() } });
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();
  const checkout = useCheckoutCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    updateItem.mutate({ productId, data: { quantity } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
    });
  };

  const handleRemove = (productId: number) => {
    removeItem.mutate({ productId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Item removed" });
      }
    });
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      toast({ title: "Shipping address is required", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Mobile number is required", variant: "destructive" });
      return;
    }

    checkout.mutate({ data: { shippingAddress: address, phoneNumber: phone, notes } }, {
      onSuccess: (order) => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Order placed successfully!" });
        setLocation(`/orders/${order.id}`);
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message ?? "Checkout failed";
        toast({ title: msg, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-serif text-primary">Your Cart</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {isEmpty ? (
          <div className="text-center py-16 bg-card border rounded-2xl shadow-sm">
            <div className="text-muted-foreground mb-4">Your cart is empty</div>
            <Link href="/shop" className="inline-flex items-center gap-2 text-secondary font-medium hover:underline">
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b">
                  <div className="w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-serif font-medium">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{item.product.category}</p>
                        <p className={`text-xs mt-0.5 font-medium ${item.product.stock <= 5 ? "text-orange-500" : "text-muted-foreground"}`}>
                          {item.product.stock === 0
                            ? "Out of stock"
                            : item.product.stock <= 5
                            ? `Only ${item.product.stock} left in stock`
                            : `${item.product.stock} in stock`}
                        </p>
                      </div>
                      <p className="font-medium">${item.product.price.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center border rounded-md">
                        <button
                          className="p-1 hover:bg-muted transition-colors disabled:opacity-50"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updateItem.isPending}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          className="p-1 hover:bg-muted transition-colors disabled:opacity-50"
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock || updateItem.isPending}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        disabled={removeItem.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors text-sm flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full lg:w-[380px] flex-shrink-0">
              <div className="bg-card border rounded-2xl p-6 shadow-sm sticky top-24">
                <h3 className="font-serif text-xl mb-4">Order Summary</h3>
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-medium text-base">
                    <span>Total</span>
                    <span>${cart.total.toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Shipping Address <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="address"
                      placeholder="123 Garden Lane, City, State, ZIP"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Mobile Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Leave at front door"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 mt-4" disabled={checkout.isPending}>
                    {checkout.isPending ? "Processing..." : "Place Order"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
