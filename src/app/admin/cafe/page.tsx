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
  return { categoryId, name: "", description: "", imageUrl: "", tag: "", isAvailable: true, sortOrder: 0, variants: [{ name: "Regular", price: "" }] };
}

function priceToPaise(value: string) {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return null;
  const [rupees, paise = ""] = trimmed.split(".");
  const amount = Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount >= 100 && amount <= 100000000 ? amount : null;
}

const inputClass = "mt-1 w-full rounded-lg border border-white/20 bg-[#171410] px-3 py-2.5 text-sm text-white outline-none focus:border-gold";
const labelClass = "block text-sm font-medium text-white/75";

export default function CafeAdminPage() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryOrder, setCategoryOrder] = useState(0);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [product, setProduct] = useState<ProductDraft>(newProduct());
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/food-menu/categories", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load menu.");
      setCategories(data.categories);
      setProducts(data.products);
      setMessage(null);
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to load menu." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  function resetCategory() {
    setEditingCategoryId(null);
    setCategoryName("");
    setCategoryOrder(0);
  }

  function resetProduct() {
    setEditingProductId(null);
    setProduct(newProduct(categories[0]?.id));
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(editingCategoryId ? `/api/admin/food-menu/categories/${editingCategoryId}` : "/api/admin/food-menu/categories", {
        method: editingCategoryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName, sortOrder: categoryOrder }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save category.");
      resetCategory();
      await refresh();
      setMessage({ type: "success", text: "Category saved." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save category." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(category: FoodCategory) {
    if (!confirm(`Delete the ${category.name} category?`)) return;
    try {
      const response = await fetch(`/api/admin/food-menu/categories/${category.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete category.");
      await refresh();
      setMessage({ type: "success", text: "Category deleted." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to delete category." });
    }
  }

  function editProduct(item: FoodProduct) {
    setEditingProductId(item.id);
    setProduct({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      tag: item.tag || "",
      isAvailable: item.isAvailable,
      sortOrder: item.sortOrder,
      variants: item.variants.map((variant) => ({ id: variant.id, name: variant.name, price: variant.pricePaise === null ? "" : (variant.pricePaise / 100).toFixed(2) })),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateVariant(index: number, field: "name" | "price", value: string) {
    setProduct((current) => ({ ...current, variants: current.variants.map((variant, i) => i === index ? { ...variant, [field]: value } : variant) }));
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const variants = product.variants.map((variant) => ({ id: variant.id, name: variant.name.trim(), pricePaise: priceToPaise(variant.price) }));
    if (variants.some((variant) => variant.pricePaise === null)) {
      setMessage({ type: "error", text: "Enter a price of at least ₹1 for every variant. Existing products need prices before they can be updated." });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(editingProductId ? `/api/admin/food-menu/products/${editingProductId}` : "/api/admin/food-menu/products", {
        method: editingProductId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, variants }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save product.");
      resetProduct();
      await refresh();
      setMessage({ type: "success", text: "Product saved." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to save product." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(item: FoodProduct) {
    if (!confirm(`Delete ${item.name}? Existing orders will keep their saved item details.`)) return;
    try {
      const response = await fetch(`/api/admin/food-menu/products/${item.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete product.");
      await refresh();
      setMessage({ type: "success", text: "Product deleted." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to delete product." });
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-gold">Sri Murugan Cinema</p><h1 className="mt-1 text-3xl font-bold">Cafe menu</h1><p className="mt-2 text-sm text-muted">Manage categories, products, variants and prices.</p></div>
          <Link href="/admin" className="rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-gold">← Admin panel</Link>
        </div>
        {message && <p role="status" className={`mb-6 rounded-xl border p-4 text-sm ${message.type === "error" ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-green-500/30 bg-green-500/10 text-green-300"}`}>{message.text}</p>}
        {loading ? <p className="text-muted">Loading cafe menu…</p> : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
            <div className="space-y-8">
              <form onSubmit={saveProduct} className="rounded-2xl border border-white/15 bg-card p-5 sm:p-7">
                <h2 className="text-xl font-bold text-gold">{editingProductId ? "Edit product" : "Add product"}</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>Product name<input required maxLength={120} className={inputClass} value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} /></label>
                  <label className={labelClass}>Category<select required className={inputClass} value={product.categoryId || ""} onChange={(event) => setProduct({ ...product, categoryId: Number(event.target.value) })}><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                  <label className={`${labelClass} sm:col-span-2`}>Description<textarea maxLength={1000} rows={3} className={inputClass} value={product.description} onChange={(event) => setProduct({ ...product, description: event.target.value })} /></label>
                  <label className={`${labelClass} sm:col-span-2`}>Image URL or local path<input className={inputClass} value={product.imageUrl} onChange={(event) => setProduct({ ...product, imageUrl: event.target.value })} placeholder="/food/coke.jpg or https://…" /><span className="mt-1 block text-xs text-muted">Leave blank for a simple placeholder.</span></label>
                  <label className={labelClass}>Tag (optional)<input maxLength={80} className={inputClass} value={product.tag} onChange={(event) => setProduct({ ...product, tag: event.target.value })} placeholder="Popular" /></label>
                  <label className={labelClass}>Display order<input type="number" min="0" max="10000" className={inputClass} value={product.sortOrder} onChange={(event) => setProduct({ ...product, sortOrder: Number(event.target.value) })} /></label>
                </div>
                <label className="mt-5 flex items-center gap-3 text-sm text-white/80"><input type="checkbox" checked={product.isAvailable} onChange={(event) => setProduct({ ...product, isAvailable: event.target.checked })} className="h-4 w-4 accent-gold" />Available to order</label>
                <div className="mt-7 border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold uppercase tracking-widest text-gold">Variants and prices</h3><button type="button" onClick={() => setProduct({ ...product, variants: [...product.variants, { name: "", price: "" }] })} className="rounded border border-gold px-3 py-2 text-xs font-bold text-gold hover:bg-gold/10">Add variant</button></div>
                  <p className="mt-2 text-xs text-muted">Use “Regular” for products with one option. For example: Coke can have 450 ml and 750 ml.</p>
                  <div className="mt-4 space-y-3">{product.variants.map((variant, index) => <div key={variant.id || index} className="grid grid-cols-[minmax(0,1fr)_110px_36px] items-end gap-2"><label className={labelClass}>Variant<input required maxLength={80} className={inputClass} value={variant.name} onChange={(event) => updateVariant(index, "name", event.target.value)} placeholder="450 ml" /></label><label className={labelClass}>Price ₹<input required inputMode="decimal" className={inputClass} value={variant.price} onChange={(event) => updateVariant(index, "price", event.target.value)} placeholder="0.00" /></label><button type="button" disabled={product.variants.length === 1} onClick={() => setProduct({ ...product, variants: product.variants.filter((_, i) => i !== index) })} className="mb-0.5 h-10 rounded border border-white/20 text-lg text-white/70 disabled:opacity-30" aria-label={`Remove ${variant.name || "variant"}`}>×</button></div>)}</div>
                </div>
                <div className="mt-7 flex flex-wrap gap-3"><button type="submit" disabled={saving || !categories.length} className="rounded-lg bg-gold px-5 py-3 text-sm font-bold text-background disabled:opacity-50">{saving ? "Saving…" : editingProductId ? "Update product" : "Add product"}</button>{editingProductId && <button type="button" onClick={resetProduct} className="rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold">Cancel edit</button>}</div>
              </form>
            </div>
            <div className="space-y-8">
              <section className="rounded-2xl border border-white/15 bg-card p-5 sm:p-7">
                <h2 className="text-xl font-bold text-gold">Categories</h2>
                <form onSubmit={saveCategory} className="mt-5 space-y-3"><label className={labelClass}>Name<input required maxLength={80} className={inputClass} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Snacks, Drinks…" /></label><label className={labelClass}>Display order<input type="number" min="0" max="10000" className={inputClass} value={categoryOrder} onChange={(event) => setCategoryOrder(Number(event.target.value))} /></label><div className="flex gap-2"><button type="submit" disabled={saving} className="rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-background">{editingCategoryId ? "Update category" : "Add category"}</button>{editingCategoryId && <button type="button" onClick={resetCategory} className="rounded-lg border border-white/20 px-4 py-2.5 text-sm">Cancel</button>}</div></form>
                <ul className="mt-6 space-y-2">{categories.map((category) => <li key={category.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 p-3"><div><p className="font-semibold">{category.name}</p><p className="text-xs text-muted">Order {category.sortOrder} · {products.filter((item) => item.categoryId === category.id).length} products</p></div><div className="flex gap-2"><button type="button" onClick={() => { setEditingCategoryId(category.id); setCategoryName(category.name); setCategoryOrder(category.sortOrder); }} className="text-xs font-semibold text-gold">Edit</button><button type="button" onClick={() => deleteCategory(category)} className="text-xs font-semibold text-red-300">Delete</button></div></li>)}</ul>
              </section>
            </div>
            <section className="lg:col-span-2">
              <h2 className="mb-4 text-xl font-bold text-gold">Products ({products.length})</h2>
              {products.length === 0 ? <p className="rounded-xl border border-dashed border-white/20 p-8 text-center text-muted">No products yet. Add one above.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{products.map((item) => <article key={item.id} className="rounded-xl border border-white/15 bg-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-gold">{categories.find((category) => category.id === item.categoryId)?.name || "Unknown category"}</p><h3 className="mt-1 text-lg font-bold">{item.name}</h3></div><span className={`rounded-full px-2 py-1 text-[.65rem] font-bold ${item.isAvailable ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>{item.isAvailable ? "Available" : "Hidden"}</span></div><p className="mt-2 text-xs leading-5 text-muted">{item.description}</p><ul className="mt-4 space-y-1 border-t border-white/10 pt-3 text-sm">{item.variants.map((variant) => <li key={variant.id} className="flex justify-between gap-2"><span>{variant.name}</span><span className="font-semibold text-gold">{formatPrice(variant.pricePaise)}</span></li>)}</ul><div className="mt-5 flex gap-3"><button type="button" onClick={() => editProduct(item)} className="rounded border border-gold px-3 py-2 text-xs font-bold text-gold">Edit</button><button type="button" onClick={() => deleteProduct(item)} className="rounded border border-red-500/40 px-3 py-2 text-xs font-bold text-red-300">Delete</button></div></article>)}</div>}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
