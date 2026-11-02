"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import AdminNav from "@/components/AdminNav";
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
    variants: [{ name: "Regular", price: "" }],
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

  // Category form state
  const [categoryName, setCategoryName] = useState("");
  const [categoryOrder, setCategoryOrder] = useState(0);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  // Product form state
  const [product, setProduct] = useState<ProductDraft>(newProduct());
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/food-menu/categories", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load menu");
      setCategories(data.categories || []);
      setProducts(data.products || []);
      setMessage(null);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to load menu",
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
    setProduct(newProduct(categories[0]?.id || 0));
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
        body: JSON.stringify({ name: categoryName.trim(), sortOrder: Number(categoryOrder) }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save category");

      resetCategory();
      await refresh();
      setMessage({ type: "success", text: editingCategoryId ? "Category updated successfully." : "Category created successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to save category",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: FoodCategory) => {
    if (!confirm(`Delete the "${category.name}" category? Products under it may be affected.`)) return;
    try {
      const response = await fetch(`/api/admin/food-menu/categories/${category.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete category");
      await refresh();
      setMessage({ type: "success", text: "Category deleted." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to delete category",
      });
    }
  };

  const saveProduct = async (e: FormEvent) => {
    e.preventDefault();
    const variants = product.variants.map((v) => ({
      id: v.id,
      name: v.name.trim(),
      pricePaise: priceToPaise(v.price),
    }));

    if (variants.some((v) => v.pricePaise === null)) {
      setMessage({
        type: "error",
        text: "Please enter a valid price (at least ₹1) for each product variant.",
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
      setMessage({ type: "success", text: editingProductId ? "Product updated successfully." : "Product added to cafe menu." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to save product",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (item: FoodProduct) => {
    if (!confirm(`Delete "${item.name}" from the menu?`)) return;
    try {
      const response = await fetch(`/api/admin/food-menu/products/${item.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete product");
      await refresh();
      setMessage({ type: "success", text: "Product removed from menu." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to delete product",
      });
    }
  };

  const editProduct = (item: FoodProduct) => {
    setEditingProductId(item.id);
    setProduct({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      tag: item.tag || "",
      isAvailable: item.isAvailable,
      sortOrder: item.sortOrder,
      variants: item.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.pricePaise === null ? "" : (v.pricePaise / 100).toFixed(2),
      })),
    });
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateVariant = (index: number, field: "name" | "price", value: string) => {
    setProduct((current) => ({
      ...current,
      variants: current.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const filteredProducts = products.filter((item) => {
    const matchesCat = selectedCategoryFilter === "all" || item.categoryId === selectedCategoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#090c12] text-slate-100">
      <AdminNav title="Menu & Catalog" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Cafe Menu Catalog
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage cinema concession products, multi-size pricing tiers, tags, and category taxonomies.
            </p>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "products"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                <path d="M15 2v19" />
                <path d="M6 2v7a3 3 0 0 0 6 0V2" />
                <path d="M9 2v19" />
              </svg>
              <span>Products ({products.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "categories"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <span>Categories ({categories.length})</span>
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-xs font-semibold ${
              message.type === "error"
                ? "border-rose-500/40 bg-rose-950/40 text-rose-200"
                : "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
            }`}
          >
            <svg
              className={`mt-0.5 h-4 w-4 shrink-0 ${message.type === "error" ? "text-rose-400" : "text-emerald-400"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {message.type === "error" ? (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              ) : (
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </>
              )}
            </svg>
            <span className="flex-1">{message.text}</span>
            <button type="button" onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/30 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-white">Loading menu items & categories...</p>
          </div>
        ) : activeTab === "products" ? (
          /* Products Workspace */
          <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
            {/* Left: Product Form */}
            <div className="h-fit rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-[#0c101a] p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingProductId ? "Edit Concession Item" : "Add Concession Item"}
                  </h2>
                  <p className="text-xs text-slate-400">Configure item details and variant pricing</p>
                </div>
                {editingProductId && (
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                    Editing #{editingProductId}
                  </span>
                )}
              </div>

              <form onSubmit={saveProduct} className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Item Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                    placeholder="e.g. Cheese Popcorn Tub"
                  />
                </div>

                {/* Category & Order */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Category <span className="text-amber-400">*</span>
                    </label>
                    <select
                      required
                      value={product.categoryId || ""}
                      onChange={(e) => setProduct({ ...product, categoryId: Number(e.target.value) })}
                      className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-xs text-white outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      value={product.sortOrder}
                      onChange={(e) => setProduct({ ...product, sortOrder: Number(e.target.value) })}
                      className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-xs text-white outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Description
                  </label>
                  <textarea
                    maxLength={1000}
                    rows={2}
                    value={product.description}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                    placeholder="Crispy gourmet popcorn seasoned with cheddar cheese..."
                  />
                </div>

                {/* Image URL & Tag */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Image URL / Path
                    </label>
                    <input
                      type="text"
                      value={product.imageUrl}
                      onChange={(e) => setProduct({ ...product, imageUrl: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                      placeholder="e.g. /food/popcorn.jpg or https://..."
                    />
                    {product.imageUrl && (
                      <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-900">
                          <Image
                            src={product.imageUrl}
                            alt="Preview"
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="truncate text-[11px] text-slate-400">Preview: {product.imageUrl}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Highlight Tag (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={80}
                      value={product.tag}
                      onChange={(e) => setProduct({ ...product, tag: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                      placeholder="e.g. Best Seller, Veg, Must Try"
                    />
                  </div>
                </div>

                {/* Available toggle */}
                <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                  <input
                    type="checkbox"
                    id="product-available"
                    checked={product.isAvailable}
                    onChange={(e) => setProduct({ ...product, isAvailable: e.target.checked })}
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                  <label htmlFor="product-available" className="cursor-pointer text-xs font-medium text-slate-200">
                    Available for customers to order in cinema
                  </label>
                </div>

                {/* Variants & Pricing */}
                <div className="border-t border-slate-800/80 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Size & Pricing Variants
                      </p>
                      <p className="text-[11px] text-slate-400">Each item needs at least 1 price option</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setProduct({
                          ...product,
                          variants: [...product.variants, { name: "", price: "" }],
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 transition hover:bg-amber-500/20"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add Size</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {product.variants.map((variant, index) => (
                      <div key={variant.id || index} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          maxLength={80}
                          value={variant.name}
                          onChange={(e) => updateVariant(index, "name", e.target.value)}
                          placeholder="e.g. Regular, Large"
                          className="flex-1 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                        />
                        <div className="relative w-28 shrink-0">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            ₹
                          </span>
                          <input
                            type="text"
                            required
                            inputMode="decimal"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, "price", e.target.value)}
                            placeholder="120"
                            className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-7 pr-3 py-2 text-xs font-semibold text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={product.variants.length === 1}
                          onClick={() =>
                            setProduct({
                              ...product,
                              variants: product.variants.filter((_, i) => i !== index),
                            })
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 transition hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-300 disabled:opacity-30"
                          aria-label="Remove variant"
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-2.5 pt-3">
                  <button
                    type="submit"
                    disabled={saving || !categories.length}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingProductId ? "Update Product" : "Save Product"}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={resetProduct}
                      className="rounded-xl border border-slate-700/80 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right: Products Grid */}
            <div className="space-y-4">
              {/* Product Filters Toolbar */}
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter("all")}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      selectedCategoryFilter === "all"
                        ? "bg-amber-500 text-slate-950"
                        : "border border-slate-800 bg-slate-900/90 text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({products.length})
                  </button>
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(cat.id)}
                        className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          selectedCategoryFilter === cat.id
                            ? "bg-amber-500 text-slate-950"
                            : "border border-slate-800 bg-slate-900/90 text-slate-400 hover:text-white"
                        }`}
                      >
                        {cat.name} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Product Search */}
                <div className="relative shrink-0 sm:w-60">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu..."
                    className="h-9 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-9 pr-3 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Items Card List */}
              {filteredProducts.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-amber-400">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
                      <path d="M15 2v19" />
                      <path d="M6 2v7a3 3 0 0 0 6 0V2" />
                      <path d="M9 2v19" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">No products found</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {searchQuery ? `No menu items match "${searchQuery}"` : "Add your first menu item using the form on the left"}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredProducts.map((item) => {
                    const catName = categories.find((c) => c.id === item.categoryId)?.name || "Concessions";
                    return (
                      <div
                        key={item.id}
                        className="group flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-[#0c101a] p-4 shadow-md transition hover:border-slate-700"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h3 className="text-sm font-bold text-white">{item.name}</h3>
                                {item.tag && (
                                  <span className="rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                                    {item.tag}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{catName}</p>
                              {item.description && (
                                <p className="mt-1.5 line-clamp-2 text-xs text-slate-300">{item.description}</p>
                              )}
                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                item.isAvailable
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              }`}
                            >
                              {item.isAvailable ? "Available" : "Hidden"}
                            </span>
                          </div>

                          {/* Variants pricing breakdown */}
                          <div className="mt-3 space-y-1 rounded-xl border border-slate-800/60 bg-slate-950/40 p-2.5">
                            {item.variants.map((v) => (
                              <div key={v.id} className="flex items-center justify-between text-xs">
                                <span className="text-slate-300">{v.name}</span>
                                <span className="font-bold text-amber-400">{formatPrice(v.pricePaise)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-3 flex items-center gap-2 border-t border-slate-800/60 pt-3">
                          <button
                            type="button"
                            onClick={() => editProduct(item)}
                            className="flex-1 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-amber-500/50 hover:bg-slate-700 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteProduct(item)}
                            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Categories Workspace */
          <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
            {/* Category Form */}
            <div className="h-fit rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-[#0c101a] p-6 shadow-xl">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-white">
                  {editingCategoryId ? "Edit Menu Category" : "Add Menu Category"}
                </h2>
                <p className="text-xs text-slate-400">Organize food and drink offerings into sections</p>
              </div>

              <form onSubmit={saveCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Category Name <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none transition focus:border-amber-500"
                    placeholder="e.g. Popcorn, Cold Beverages, Combos"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={categoryOrder}
                    onChange={(e) => setCategoryOrder(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingCategoryId ? "Update Category" : "Create Category"}
                  </button>
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={resetCategory}
                      className="rounded-xl border border-slate-700/80 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Categories List */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Active Categories ({categories.length})</h2>
              </div>

              {categories.length === 0 ? (
                <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-amber-400">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                      <path d="M9 12h6" />
                      <path d="M9 16h6" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">No categories configured</h3>
                  <p className="mt-1 text-xs text-slate-400">Add categories to group your cinema food menu</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {categories.map((category) => {
                    const productCount = products.filter((p) => p.categoryId === category.id).length;
                    return (
                      <div
                        key={category.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-[#0c101a] p-4 shadow-md transition hover:border-slate-700"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-white">{category.name}</h3>
                            <p className="mt-1 text-xs text-slate-400">
                              Sort index: {category.sortOrder} • <span className="font-semibold text-amber-400">{productCount} items</span>
                            </p>
                          </div>
                          <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                            #{category.id}
                          </span>
                        </div>

                        <div className="mt-4 flex gap-2 border-t border-slate-800/60 pt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(category.id);
                              setCategoryName(category.name);
                              setCategoryOrder(category.sortOrder);
                            }}
                            className="flex-1 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-amber-500/50 hover:bg-slate-700 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteCategory(category)}
                            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
