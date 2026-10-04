"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { FoodCategory, FoodProduct } from "@/lib/foodMenu";
import { formatPrice } from "@/lib/foodMenu";

type VariantDraft = { id?: string; name: string; price: string };
type ProductDraft = {
  categoryId: number;
  name: string;
  description: string;
  imageUrl: string;
  tag: string;
  isAvailable: boolean;
  sortOrder: number;
  variants: VariantDraft[];
};

function newProduct(categoryId = 0): ProductDraft {
  return { 
    categoryId, 
    name: "", 
    description: "", 
    imageUrl: "", 
    tag: "", 
    isAvailable: true, 
    sortOrder: 0, 
    variants: [{ name: "Regular", price: "" }] 
  };
}

function priceToPaise(value: string) {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return null;
  const [rupees, paise = ""] = trimmed.split(".");
  const amount = Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount >= 100 && amount <= 100000000 ? amount : null;
}

export default function CafeMenuPage() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Category form
  const [categoryName, setCategoryName] = useState("");
  const [categoryOrder, setCategoryOrder] = useState(0);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  
  // Product form
  const [product, setProduct] = useState<ProductDraft>(newProduct());
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/food-menu/categories", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load menu");
      setCategories(data.categories);
      setProducts(data.products);
      setMessage(null);
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Unable to load menu" 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const resetCategory = () => {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategoryOrder(0);
  };

  const resetProduct = () => {
    setEditingProductId(null);
    setProduct(newProduct(categories[0]?.id));
  };

  const saveCategory = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingCategoryId 
        ? `/api/admin/food-menu/categories/${editingCategoryId}` 
        : "/api/admin/food-menu/categories";
      
      const response = await fetch(url, {
        method: editingCategoryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName, sortOrder: categoryOrder }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save category");
      
      resetCategory();
      await refresh();
      setMessage({ type: "success", text: "Category saved" });
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Unable to save category" 
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: FoodCategory) => {
    if (!confirm(`Delete the ${category.name} category?`)) return;
    try {
      const response = await fetch(`/api/admin/food-menu/categories/${category.id}`, { 
        method: "DELETE" 
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete category");
      await refresh();
      setMessage({ type: "success", text: "Category deleted" });
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Unable to delete category" 
      });
    }
  };

  const saveProduct = async (e: FormEvent) => {
    e.preventDefault();
    const variants = product.variants.map((v) => ({ 
      id: v.id, 
      name: v.name.trim(), 
      pricePaise: priceToPaise(v.price) 
    }));
    
    if (variants.some((v) => v.pricePaise === null)) {
      setMessage({ 
        type: "error", 
        text: "Enter a price of at least ₹1 for every variant" 
      });
      return;
    }
    
    setSaving(true);
    try {
      const url = editingProductId 
        ? `/api/admin/food-menu/products/${editingProductId}` 
        : "/api/admin/food-menu/products";
      
      const response = await fetch(url, {
        method: editingProductId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, variants }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save product");
      
      resetProduct();
      await refresh();
      setMessage({ type: "success", text: "Product saved" });
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Unable to save product" 
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (item: FoodProduct) => {
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      const response = await fetch(`/api/admin/food-menu/products/${item.id}`, { 
        method: "DELETE" 
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete product");
      await refresh();
      setMessage({ type: "success", text: "Product deleted" });
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Unable to delete product" 
      });
    }
  };

  const editProduct = (item: FoodProduct) => {
    setEditingProductId(item.id);
    setProduct({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      tag: item.tag || "",
      isAvailable: item.isAvailable,
      sortOrder: item.sortOrder,
      variants: item.variants.map((v) => ({ 
        id: v.id, 
        name: v.name, 
        price: v.pricePaise === null ? "" : (v.pricePaise / 100).toFixed(2) 
      })),
    });
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateVariant = (index: number, field: "name" | "price", value: string) => {
    setProduct((current) => ({ 
      ...current, 
      variants: current.variants.map((v, i) => 
        i === index ? { ...v, [field]: value } : v
      ) 
    }));
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-green-400">
                Cafe Menu Management
              </p>
              <h1 className="mt-1 text-2xl font-bold">Sri Murugan Cinema</h1>
            </div>
            <Link
              href="/admin/dashboard"
              className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold transition-colors hover:border-green-500"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("products")}
            className={`rounded-lg px-6 py-3 text-sm font-bold uppercase transition-colors ${
              activeTab === "products" 
                ? "bg-green-500 text-white" 
                : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`rounded-lg px-6 py-3 text-sm font-bold uppercase transition-colors ${
              activeTab === "categories" 
                ? "bg-green-500 text-white" 
                : "border border-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm font-semibold ${
              message.type === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-green-500/30 bg-green-500/10 text-green-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-green-400" />
              <p className="mt-4 text-gray-400">Loading menu...</p>
            </div>
          </div>
        ) : activeTab === "products" ? (
          <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
            {/* Product Form */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="mb-4 text-xl font-bold text-green-400">
                {editingProductId ? "Edit Product" : "Add Product"}
              </h2>

              <form onSubmit={saveProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Product Name</label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-green-500"
                    placeholder="e.g., Popcorn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Category</label>
                  <select
                    required
                    value={product.categoryId || ""}
                    onChange={(e) => setProduct({ ...product, categoryId: Number(e.target.value) })}
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-green-500"
                  >
                    <option value="">Choose category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Description</label>
                  <textarea
                    maxLength={1000}
                    rows={3}
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-green-500"
                    placeholder="Product description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Image URL</label>
                  <input
                    type="text"
                    value={product.imageUrl}
                    onChange={(e) => setProduct({ ...product, imageUrl: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-green-500"
                    placeholder="/food/popcorn.jpg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300">Tag</label>
                    <input
                      type="text"
                      maxLength={80}
                      value={product.tag}
                      onChange={(e) => setProduct({ ...product, tag: e.target.value })}
                      className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-green-500"
                      placeholder="Popular"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">Order</label>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      value={product.sortOrder}
                      onChange={(e) => setProduct({ ...product, sortOrder: Number(e.target.value) })}
                      className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.isAvailable}
                    onChange={(e) => setProduct({ ...product, isAvailable: e.target.checked })}
                    className="h-4 w-4 accent-green-500"
                  />
                  <span className="text-sm text-gray-300">Available to order</span>
                </label>

                {/* Variants */}
                <div className="border-t border-gray-800 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-bold uppercase tracking-wider text-green-400">
                      Variants & Prices
                    </label>
                    <button
                      type="button"
                      onClick={() => setProduct({ 
                        ...product, 
                        variants: [...product.variants, { name: "", price: "" }] 
                      })}
                      className="rounded border border-green-500 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400 hover:bg-green-500/20"
                    >
                      + Add Variant
                    </button>
                  </div>

                  <div className="space-y-2">
                    {product.variants.map((variant, index) => (
                      <div key={variant.id || index} className="flex gap-2">
                        <input
                          type="text"
                          required
                          maxLength={80}
                          value={variant.name}
                          onChange={(e) => updateVariant(index, "name", e.target.value)}
                          placeholder="Variant name"
                          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm outline-none focus:border-green-500"
                        />
                        <input
                          type="text"
                          required
                          inputMode="decimal"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, "price", e.target.value)}
                          placeholder="0.00"
                          className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm outline-none focus:border-green-500"
                        />
                        <button
                          type="button"
                          disabled={product.variants.length === 1}
                          onClick={() => setProduct({ 
                            ...product, 
                            variants: product.variants.filter((_, i) => i !== index) 
                          })}
                          className="rounded bg-red-600 px-3 text-lg hover:bg-red-700 disabled:opacity-30"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving || !categories.length}
                    className="flex-1 rounded-lg bg-green-500 px-5 py-3 text-sm font-bold uppercase hover:bg-green-600 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingProductId ? "Update" : "Add Product"}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={resetProduct}
                      className="rounded-lg border border-gray-700 px-5 text-sm font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Products List */}
            <div>
              <h2 className="mb-4 text-xl font-bold">
                Products ({products.length})
              </h2>

              {products.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-700 py-16 text-center">
                  <div className="text-5xl">🍿</div>
                  <p className="mt-4 text-gray-500">No products yet</p>
                  <p className="mt-1 text-sm text-gray-600">Add your first menu item</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {products.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-800 bg-gray-900 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">{item.name}</h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                item.isAvailable
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {item.isAvailable ? "Available" : "Hidden"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-400">
                            {categories.find((c) => c.id === item.categoryId)?.name || "Unknown"}
                          </p>
                          {item.description && (
                            <p className="mt-2 text-xs text-gray-500">{item.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 space-y-1 border-t border-gray-800 pt-3">
                        {item.variants.map((variant) => (
                          <div key={variant.id} className="flex justify-between text-sm">
                            <span className="text-gray-300">{variant.name}</span>
                            <span className="font-semibold text-green-400">
                              {formatPrice(variant.pricePaise)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => editProduct(item)}
                          className="flex-1 rounded border border-green-500 bg-green-500/10 px-3 py-2 text-xs font-bold text-green-400 hover:bg-green-500/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(item)}
                          className="flex-1 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Categories Tab */
          <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
            {/* Category Form */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="mb-4 text-xl font-bold text-green-400">
                {editingCategoryId ? "Edit Category" : "Add Category"}
              </h2>

              <form onSubmit={saveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Category Name</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-green-500"
                    placeholder="Snacks, Drinks, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={categoryOrder}
                    onChange={(e) => setCategoryOrder(Number(e.target.value))}
                    className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm outline-none focus:border-green-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-lg bg-green-500 px-5 py-3 text-sm font-bold uppercase hover:bg-green-600 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingCategoryId ? "Update" : "Add Category"}
                  </button>
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={resetCategory}
                      className="rounded-lg border border-gray-700 px-5 text-sm font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Categories List */}
            <div>
              <h2 className="mb-4 text-xl font-bold">
                Categories ({categories.length})
              </h2>

              {categories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-700 py-16 text-center">
                  <div className="text-5xl">📋</div>
                  <p className="mt-4 text-gray-500">No categories yet</p>
                  <p className="mt-1 text-sm text-gray-600">Add your first category</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-5"
                    >
                      <div>
                        <h3 className="font-bold">{category.name}</h3>
                        <p className="mt-1 text-xs text-gray-400">
                          Order {category.sortOrder} •{" "}
                          {products.filter((p) => p.categoryId === category.id).length} products
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            setCategoryName(category.name);
                            setCategoryOrder(category.sortOrder);
                          }}
                          className="rounded border border-green-500 bg-green-500/10 px-4 py-2 text-xs font-bold text-green-400 hover:bg-green-500/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCategory(category)}
                          className="rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
