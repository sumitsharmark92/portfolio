"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Filter,
  Package,
  CheckCircle2,
  MoreHorizontal,
  Eye,
  EyeOff,
  DollarSign,
  ArrowUpDown,
} from "lucide-react";
import { formatPrice } from "@/lib/pricing";
import ProductWizard from "./ProductWizard";

/* ═══════════════════════════════════════════════════════════
   Admin Products — Virtualized Directory with Bulk Actions
   ═══════════════════════════════════════════════════════════ */

interface AdminProduct {
  id: string;
  title: string;
  category: string;
  material: string;
  colorHex: string;
  basePrice: number;
  inventory: number;
  isPublished: boolean;
  imageUrl: string;
  sizes: string[];
}

const INITIAL_PRODUCTS: AdminProduct[] = [
  { id: "prod-1", title: "Product 1 — Yellow Bow Kundan Bangle Set", category: "SET", material: "Kundan", colorHex: "#FFD700", basePrice: 10000, inventory: 50, isPublished: true, imageUrl: "/images/products/product-1.jpg", sizes: ["2.2", "2.4", "2.6", "2.8"] },
  { id: "prod-2", title: "Product 2 — Royal Blue Crystal Velvet Stack", category: "CHUDI", material: "Glass", colorHex: "#1D3557", basePrice: 10000, inventory: 75, isPublished: true, imageUrl: "/images/products/product-2.jpg", sizes: ["2.2", "2.4", "2.6", "2.8", "2.10"] },
  { id: "prod-3", title: "Product 3 — Magenta Velvet Crystal Bangle Set", category: "SET", material: "Kundan", colorHex: "#7A1B2D", basePrice: 10000, inventory: 40, isPublished: true, imageUrl: "/images/products/product-3.jpg", sizes: ["2.4", "2.6", "2.8"] },
  { id: "prod-4", title: "Product 4 — Multicolored Floral Crystal Kangan Pair", category: "KANGAN", material: "Brass", colorHex: "#E8C547", basePrice: 10000, inventory: 30, isPublished: true, imageUrl: "/images/products/product-4.jpg", sizes: ["2.4", "2.6", "2.8"] },
  { id: "prod-5", title: "Product 5 — Golden Crystal Paved Broad Kangan Pair", category: "KANGAN", material: "Gold", colorHex: "#DAA520", basePrice: 10000, inventory: 20, isPublished: true, imageUrl: "/images/products/product-5.jpg", sizes: ["2.4", "2.6", "2.8"] },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  function handleWizardSubmit(data: { title: string; category: string; material: string; basePrice: number; inventory: number; imageUrl: string; sizes: string[] }) {
    const newProduct: AdminProduct = {
      id: `prod-${Date.now()}`,
      title: data.title,
      category: data.category.toUpperCase(),
      material: data.material,
      colorHex: "#FFD700",
      basePrice: data.basePrice,
      inventory: data.inventory,
      isPublished: true,
      imageUrl: data.imageUrl,
      sizes: data.sizes,
    };
    setProducts([newProduct, ...products]);
    setShowWizard(false);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  }

  function bulkDelete() {
    setProducts(products.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
  }

  function bulkTogglePublish(publish: boolean) {
    setProducts(products.map((p) => (selected.has(p.id) ? { ...p, isPublished: publish } : p)));
    setSelected(new Set());
  }

  function handleDelete(id: string) {
    setProducts(products.filter((p) => p.id !== id));
  }

  function togglePublish(id: string) {
    setProducts(products.map((p) => (p.id === id ? { ...p, isPublished: !p.isPublished } : p)));
  }

  const filtered = products.filter((p) => {
    const matchCat = categoryFilter === "ALL" || p.category === categoryFilter;
    const matchSearch = searchQuery === "" || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.material.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gradient-gold tracking-wider">Products</h1>
          <p className="text-sm text-ivory-muted/50 mt-1">{products.length} total · {products.filter((p) => p.isPublished).length} published</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted/40" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..." className="input-dark pl-10 w-full" />
        </div>

        <div className="flex items-center gap-1.5">
          {["ALL", "SET", "CHUDI", "KANGAN", "BRACELET"].map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 text-xs rounded-lg transition-all ${categoryFilter === cat ? "bg-gold text-obsidian font-semibold" : "glass text-ivory-muted/50 hover:text-gold"}`}>
              {cat === "ALL" ? "All" : cat}
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gold font-medium">{selected.size} selected</span>
              <button onClick={() => bulkTogglePublish(true)} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                <Eye className="w-3 h-3 inline mr-1" /> Publish
              </button>
              <button onClick={() => bulkTogglePublish(false)} className="px-3 py-1.5 text-xs rounded-lg bg-ivory/5 text-ivory-muted/50 border border-ivory/10 hover:bg-ivory/10 transition-colors">
                <EyeOff className="w-3 h-3 inline mr-1" /> Unpublish
              </button>
              <button onClick={bulkDelete} className="px-3 py-1.5 text-xs rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors">
                <Trash2 className="w-3 h-3 inline mr-1" /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="rounded-xl glass overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gold/10">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} className="accent-gold w-3.5 h-3.5" />
              </th>
              <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Product</th>
              <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Category</th>
              <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Material</th>
              <th className="text-right px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Price</th>
              <th className="text-center px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Stock</th>
              <th className="text-center px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Status</th>
              <th className="text-right px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-gold/[0.03] hover:bg-gold/[0.02] transition-colors" onMouseEnter={() => setHoveredId(p.id)} onMouseLeave={() => setHoveredId(null)}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-gold w-3.5 h-3.5" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 relative">
                    <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-gold/20 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-ivory font-medium truncate max-w-xs">{p.title}</p>
                      <p className="text-[10px] text-ivory-muted/35">{p.sizes.join(", ")}</p>
                    </div>
                    {/* Hover image expansion */}
                    {hoveredId === p.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute left-0 top-full mt-1 z-30 w-48 h-48 rounded-xl overflow-hidden shadow-2xl border border-gold/20">
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                      </motion.div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3"><span className="text-xs text-ivory-muted/60 uppercase tracking-wider">{p.category}</span></td>
                <td className="px-4 py-3"><span className="text-sm text-ivory-muted">{p.material}</span></td>
                <td className="px-4 py-3 text-right"><span className="text-sm text-gold font-bold">{formatPrice(p.basePrice)}</span></td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-sm font-medium ${p.inventory === 0 ? "text-rose-400" : p.inventory < 20 ? "text-amber-400" : "text-emerald-400"}`}>{p.inventory}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => togglePublish(p.id)} className={`inline-flex px-2.5 py-1 text-[10px] tracking-wider uppercase rounded-full transition-all ${p.isPublished ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-ivory/5 text-ivory-muted/40 border border-ivory/10"}`}>
                    {p.isPublished ? "Published" : "Draft"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-ivory-muted/40 hover:text-rose-400 transition-colors rounded-md hover:bg-rose-500/5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-ivory-muted/30">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No products match your search</p>
          </div>
        )}
      </div>

      {/* Product Wizard */}
      <AnimatePresence>
        {showWizard && <ProductWizard isOpen={showWizard} onClose={() => setShowWizard(false)} onSubmit={handleWizardSubmit} />}
      </AnimatePresence>
    </div>
  );
}
