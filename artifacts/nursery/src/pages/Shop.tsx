import React, { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { Layout } from "@/components/Layout";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { value: "all",                  label: "All Categories" },
  { value: "bloom-throughout-year", label: "Bloom Throughout Year" },
  { value: "summer-flowers",        label: "Summer Flowers" },
  { value: "winter-flowers",        label: "Winter Flowers" },
  { value: "monsoon-flowers",       label: "Monsoon Flowers" },
  { value: "indoor-plants",         label: "Indoor Plants" },
  { value: "outdoor-plants",        label: "Outdoor Plants" },
  { value: "air-purifiers",         label: "Air Purifiers" },
  { value: "medical-herbs",         label: "Medical Herbs" },
  { value: "trees",                 label: "Trees" },
  { value: "seeds",                 label: "Seeds" },
];

export default function Shop() {
  const searchStr = useSearch();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(() => {
    const params = new URLSearchParams(searchStr);
    const cat = params.get("category") || "all";
    return CATEGORIES.some((c) => c.value === cat) ? cat : "all";
  });

  // Re-sync when the URL query changes (e.g. clicking a navbar subcategory)
  useEffect(() => {
    const params = new URLSearchParams(searchStr);
    const cat = params.get("category") || "all";
    setCategory(CATEGORIES.some((c) => c.value === cat) ? cat : "all");
  }, [searchStr]);

  const { data: products, isLoading } = useListProducts(
    {
      search: search || undefined,
      category: category !== "all" ? category : undefined,
    },
    { query: { queryKey: getListProductsQueryKey({ search: search || undefined, category: category !== "all" ? category : undefined }) } }
  );

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-serif text-primary mb-2">Our Collection</h1>
              <p className="text-muted-foreground">Find the perfect addition to your space.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 space-y-6 flex-shrink-0">
          <div className="space-y-4">
            <h3 className="font-serif text-lg border-b pb-2">Search</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search plants..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif text-lg border-b pb-2">Category</h3>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full aspect-[4/5] rounded-xl" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-5 w-1/3" />
                </div>
              ))
            ) : products?.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <p className="text-lg text-muted-foreground">No plants found matching your search.</p>
                <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCategory("all"); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              products?.map((product) => (
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
                        <span className="font-serif italic opacity-50">Mother Nature</span>
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-card text-card-foreground px-3 py-1 font-bold text-sm rounded uppercase tracking-wider shadow">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors">{product.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                    </div>
                    <p className="font-medium">${product.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
