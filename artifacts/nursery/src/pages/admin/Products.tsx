import React, { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { 
  useListProducts, getListProductsQueryKey,
  useCreateProduct, useUpdateProduct, useDeleteProduct
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, Sprout } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product, ProductInput } from "@workspace/api-client-react";

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useListProducts({ search: search || undefined }, { query: { queryKey: getListProductsQueryKey({ search: search || undefined }) } });
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: ProductInput = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      category: formData.get("category") as string,
      stock: parseInt(formData.get("stock") as string, 10),
      imageUrl: formData.get("imageUrl") as string || undefined,
      careLevel: formData.get("careLevel") as string,
      sunlight: formData.get("sunlight") as string,
      watering: formData.get("watering") as string,
      featured: formData.get("featured") === "on",
    };

    createProduct.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Product created successfully" });
        setIsCreateOpen(false);
      },
      onError: (err) => toast({ title: "Failed to create product", variant: "destructive" })
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: parseFloat(formData.get("price") as string),
      category: formData.get("category") as string,
      stock: parseInt(formData.get("stock") as string, 10),
      imageUrl: formData.get("imageUrl") as string || undefined,
      careLevel: formData.get("careLevel") as string,
      sunlight: formData.get("sunlight") as string,
      watering: formData.get("watering") as string,
      featured: formData.get("featured") === "on",
    };

    updateProduct.mutate({ id: editingProduct.id, data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Product updated successfully" });
        setEditingProduct(null);
      },
      onError: (err) => toast({ title: "Failed to update product", variant: "destructive" })
    });
  };

  const handleDelete = () => {
    if (!productToDelete) return;
    deleteProduct.mutate({ id: productToDelete.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Product deleted" });
        setIsDeleteDialogOpen(false);
        setProductToDelete(null);
      },
      onError: (err) => toast({ title: "Failed to delete product", variant: "destructive" })
    });
  };

  const ProductForm = ({ product, onSubmit, onCancel, isPending }: { product?: Product | null, onSubmit: (e: React.FormEvent<HTMLFormElement>) => void, onCancel: () => void, isPending: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </div>
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" defaultValue={product?.category} required />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={product?.description} required />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product?.price} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" name="stock" type="number" min="0" defaultValue={product?.stock} required />
        </div>
        <div className="space-y-2 col-span-2 sm:col-span-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input id="imageUrl" name="imageUrl" defaultValue={product?.imageUrl || ""} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="careLevel">Care Level</Label>
          <Input id="careLevel" name="careLevel" defaultValue={product?.careLevel || ""} placeholder="e.g. Easy" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sunlight">Sunlight</Label>
          <Input id="sunlight" name="sunlight" defaultValue={product?.sunlight || ""} placeholder="e.g. Bright indirect" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="watering">Watering</Label>
          <Input id="watering" name="watering" defaultValue={product?.watering || ""} placeholder="e.g. Weekly" />
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox id="featured" name="featured" defaultChecked={product?.featured} />
        <Label htmlFor="featured" className="cursor-pointer">Feature on storefront</Label>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Product"}</Button>
      </DialogFooter>
    </form>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif text-primary">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your nursery inventory.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm onSubmit={handleCreate} onCancel={() => setIsCreateOpen(false)} isPending={createProduct.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-12 ml-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20 mx-auto" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : products?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <Sprout className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    No products found
                  </td>
                </tr>
              ) : (
                products?.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Sprout className="h-5 w-5 text-muted-foreground opacity-50" />
                        )}
                      </div>
                      <span className="truncate max-w-[200px]">{product.name}</span>
                    </td>
                    <td className="px-6 py-4 capitalize">{product.category}</td>
                    <td className="px-6 py-4 text-right">₹{product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock <= 5 ? (product.stock === 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-secondary') : ''}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {product.featured && <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-medium">Featured</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setProductToDelete(product); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm 
              product={editingProduct} 
              onSubmit={handleEdit} 
              onCancel={() => setEditingProduct(null)} 
              isPending={updateProduct.isPending} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete <strong>{productToDelete?.name}</strong>? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteProduct.isPending}>
              {deleteProduct.isPending ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
