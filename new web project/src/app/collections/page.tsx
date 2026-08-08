"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Filter, ArrowRight, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import CartDrawer from "@/components/ui/CartDrawer";
import Footer from "@/components/ui/Footer";
import { type BangleCategory } from "@/store/customizer";
import { formatPrice } from "@/lib/pricing";
import { getAssetUrl } from "@/lib/assets";

/* ═══════════════════════════════════════════════════════════
   Collections Page — Product grid featuring Product 1, Product 2, etc.
   ═══════════════════════════════════════════════════════════ */

interface Product {
  id: string;
  title: string;
  description: string;
  category: BangleCategory;
  material: string;
  colorHex: string;
  price: number;
  imageUrl: string;
  tag?: string;
  isNew?: boolean;
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    title: "Product 1 — Yellow Bow Kundan Bangle Set",
    description: "Exquisite handcrafted yellow bangle set embellished with white bow motifs and crystal borders",
    category: "SET",
    material: "Kundan",
    colorHex: "#FFD700",
    price: 10000,
    imageUrl: "/images/products/product-1.jpg",
    tag: "Featured",
    isNew: true,
  },
  {
    id: "prod-2",
    title: "Product 2 — Royal Blue Crystal Velvet Stack",
    description: "Deep sapphire blue velvet bangles studded with shimmering black and blue diamond-cut crystals",
    category: "CHUDI",
    material: "Glass",
    colorHex: "#1D3557",
    price: 10000,
    imageUrl: "/images/products/product-2.jpg",
    tag: "Bestseller",
    isNew: true,
  },
  {
    id: "prod-3",
    title: "Product 3 — Magenta Velvet Crystal Bangle Set",
    description: "Rich maroon magenta velvet bangles with double-row champagne crystal embellishments",
    category: "SET",
    material: "Kundan",
    colorHex: "#7A1B2D",
    price: 10000,
    imageUrl: "/images/products/product-3.jpg",
    tag: "Royal",
    isNew: true,
  },
  {
    id: "prod-4",
    title: "Product 4 — Multicolored Floral Crystal Kangan Pair",
    description: "Traditional cream base Kangans decorated with hand-painted floral beads and pave crystal borders",
    category: "KANGAN",
    material: "Brass",
    colorHex: "#E8C547",
    price: 10000,
    imageUrl: "/images/products/product-4.jpg",
    tag: "Artisan",
    isNew: true,
  },
  {
    id: "prod-5",
    title: "Product 5 — Golden Crystal Paved Broad Kangan Pair",
    description: "Heavy gold finish broad Kangan pair fully encrusted with champagne crystal stone pave work",
    category: "KANGAN",
    material: "Gold",
    colorHex: "#DAA520",
    price: 10000,
    imageUrl: "/images/products/product-5.jpg",
    tag: "Exclusive",
    isNew: true,
  },
];

const CATEGORIES: { key: BangleCategory | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "CHUDI", label: "Chudi" },
  { key: "KANGAN", label: "Kangan" },
  { key: "SET", label: "Sets" },
  { key: "BRACELET", label: "Bracelets" },
];

export default function CollectionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    BangleCategory | "ALL"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = SAMPLE_PRODUCTS.filter((p) => {
    const matchesCategory =
      selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.material.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="bg-obsidian min-h-screen">
      <Navbar />
      <CartDrawer />

      {/* Header */}
      <section className="pt-28 pb-12 bg-festive-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="text-xs tracking-[0.3em] uppercase text-gold">
              Exquisite Craftsmanship
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl text-ivory mt-3">
              Added Collections — ₹10,000
            </h1>
            <div className="divider-gold w-24 mx-auto mt-6" />
          </motion.div>

          {/* Filters */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gold mr-1" />
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                    selectedCategory === cat.key
                      ? "bg-gold text-obsidian font-semibold"
                      : "glass text-ivory-muted hover:text-gold"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-muted/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Product 1, Product 2..."
                className="input-dark pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                layout
              >
                <div className="product-card group relative">
                  {/* Real Product Image */}
                  <div className="relative h-72 w-full bg-obsidian-lighter overflow-hidden">
                    <img
                      src={getAssetUrl(product.imageUrl)}
                      alt={product.title}
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Tag */}
                    {product.tag && (
                      <span className="absolute top-3 right-3 text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full glass-gold text-gold border border-gold/30">
                        {product.tag}
                      </span>
                    )}
                    {product.isNew && (
                      <span className="absolute top-3 left-3 text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full bg-emerald-light/30 text-emerald-light border border-emerald-light/40 backdrop-blur-md">
                        New Arrival
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <p className="text-[10px] uppercase tracking-wider text-gold/70 mb-1 font-semibold">
                      {product.material} · {product.category}
                    </p>
                    <h3 className="font-serif text-lg text-ivory group-hover:text-gold transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-xs text-ivory-muted/60 mt-2 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gold/10">
                      <div>
                        <span className="text-[10px] text-ivory-muted/40 uppercase block">Price</span>
                        <span className="text-gold font-bold text-lg">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      <Link href="/studio" className="btn-primary text-xs px-4 py-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        Customize 3D
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-ivory-muted/40">
              <SlidersHorizontal className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No bangles match your search</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
