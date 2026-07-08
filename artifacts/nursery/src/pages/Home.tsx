import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Droplets, Sun, Sprout } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: products, isLoading } = useListProducts(
    { featured: "true" } as any, 
    { query: { queryKey: getListProductsQueryKey({ search: "" }) } }
  );

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-accent/30 py-24 md:py-32">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 z-10">
            <h1 className="text-5xl md:text-7xl font-serif text-primary leading-[1.1] tracking-tight">
              Bring the <br/><span className="text-secondary italic">outdoors</span> in.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Curated botanical beauties, grown with care. Transform your space into a living sanctuary with our boutique nursery collection.
            </p>
            <div className="pt-4 flex gap-4">
              <Link href="/shop" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                Shop the Collection
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full aspect-square md:aspect-[4/3] relative rounded-2xl overflow-hidden shadow-2xl z-10">
            <img 
              src="https://images.unsplash.com/photo-1466781783364-36c955e42a7f?q=80&w=2071&auto=format&fit=crop" 
              alt="Lush green potted plants in a sunny room" 
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Categories / Trust Builders */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x border-y py-12">
          <div className="px-6 flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent text-primary flex items-center justify-center mb-2">
              <Leaf className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl">Expertly Grown</h3>
            <p className="text-muted-foreground text-sm">Nurtured in optimal conditions until they're ready for your home.</p>
          </div>
          <div className="px-6 flex flex-col items-center gap-3 py-8 md:py-0">
            <div className="h-12 w-12 rounded-full bg-accent text-primary flex items-center justify-center mb-2">
              <Droplets className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl">Care Instructions</h3>
            <p className="text-muted-foreground text-sm">Every plant comes with detailed guides for watering and maintenance.</p>
          </div>
          <div className="px-6 flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent text-primary flex items-center justify-center mb-2">
              <Sun className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl">Perfect Placement</h3>
            <p className="text-muted-foreground text-sm">Find exactly what thrives in your unique lighting conditions.</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-serif text-primary">New Arrivals</h2>
              <p className="text-muted-foreground mt-2">Freshly potted and ready for their new home.</p>
            </div>
            <Link href="/shop" className="hidden md:flex items-center gap-2 text-secondary font-medium hover:text-secondary/80 transition-colors group">
              View all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full aspect-[4/5] rounded-xl" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-5 w-1/3" />
                </div>
              ))
            ) : products?.slice(0, 4).map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted mb-4 shadow-sm group-hover:shadow-md transition-all">
                  {product.imageUrl ? (
                    <img 
                      src={product.imageUrl} 
                      alt={product.name} 
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-accent/50 text-muted-foreground">
                      <Sprout className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  {product.stock < 5 && product.stock > 0 && (
                    <span className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-sm shadow">
                      Only {product.stock} left
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-muted-foreground">₹{(product.price).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
