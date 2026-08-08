"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Crown,
  Sparkles,
  Palette,
  Gem,
  Ruler,
  ArrowRight,
  Star,
} from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import CartDrawer from "@/components/ui/CartDrawer";
import Footer from "@/components/ui/Footer";
import { formatPrice } from "@/lib/pricing";
import { getAssetUrl } from "@/lib/assets";

// Dynamic import for 3D scene — no SSR
const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), {
  ssr: false,
});

/* ═══════════════════════════════════════════════════════════
   Home Page — Featuring Product 1, Product 2, Product 3, Product 4, Product 5
   ═══════════════════════════════════════════════════════════ */

const FEATURED_PRODUCTS = [
  {
    id: "prod-1",
    title: "Product 1 — Yellow Bow Kundan Bangle Set",
    description: "Exquisite handcrafted yellow bangle set embellished with white bow motifs and crystal borders",
    price: 10000,
    imageUrl: "/images/products/product-1.jpg",
    tag: "Featured",
  },
  {
    id: "prod-2",
    title: "Product 2 — Royal Blue Crystal Velvet Stack",
    description: "Deep sapphire blue velvet bangles studded with shimmering black and blue diamond-cut crystals",
    price: 10000,
    imageUrl: "/images/products/product-2.jpg",
    tag: "Bestseller",
  },
  {
    id: "prod-3",
    title: "Product 3 — Magenta Velvet Crystal Bangle Set",
    description: "Rich maroon magenta velvet bangles with double-row champagne crystal embellishments",
    price: 10000,
    imageUrl: "/images/products/product-3.jpg",
    tag: "Royal",
  },
  {
    id: "prod-4",
    title: "Product 4 — Multicolored Floral Crystal Kangan Pair",
    description: "Traditional cream base Kangans decorated with hand-painted floral beads and pave crystal borders",
    price: 10000,
    imageUrl: "/images/products/product-4.jpg",
    tag: "Artisan",
  },
  {
    id: "prod-5",
    title: "Product 5 — Golden Crystal Paved Broad Kangan Pair",
    description: "Heavy gold finish broad Kangan pair fully encrusted with champagne crystal stone pave work",
    price: 10000,
    imageUrl: "/images/products/product-5.jpg",
    tag: "Exclusive",
  },
];

const VALUE_PROPS = [
  {
    icon: Gem,
    title: "Certified Purity",
    description: "BIS hallmarked gold & premium crystal workmanship",
  },
  {
    icon: Palette,
    title: "3D Customizer",
    description: "Design your perfect stack in our immersive 3D studio",
  },
  {
    icon: Ruler,
    title: "Perfect Fit",
    description: "Millimeter-accurate sizing tool (2.2 to 2.10 wrist sizes)",
  },
  {
    icon: Sparkles,
    title: "Master Craftsmanship",
    description: "Each piece handcrafted by master heritage artisans",
  },
];

export default function HomePage() {
  return (
    <main className="bg-obsidian min-h-screen">
      <Navbar />
      <CartDrawer />

      {/* ─── Hero Section ─── */}
      <section className="relative h-screen overflow-hidden">
        {/* 3D Scene Background */}
        <HeroScene />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/90 via-obsidian/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent z-10 pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-20 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl"
            >
              {/* Tag */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-gold mb-6"
              >
                <Crown className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs tracking-widest uppercase text-gold">
                  Heritage Reimagined
                </span>
              </motion.div>

              {/* Headline */}
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6">
                <span className="text-ivory">Adorn Your</span>
                <br />
                <span className="text-gradient-gold">Resplendence</span>
              </h1>

              {/* Subtitle */}
              <p className="text-ivory-muted/70 text-lg leading-relaxed mb-8 max-w-md">
                Discover Product 1, Product 2 & our new signature collection.
                All products at flat ₹10,000 with 360° 3D stack customizer.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <Link href="/studio" className="btn-primary">
                  <Sparkles className="w-4 h-4" />
                  Build Your Stack
                </Link>
                <Link href="/collections" className="btn-secondary">
                  Explore Collection (₹10,000)
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex items-center gap-6 mt-12"
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-gold text-gold"
                    />
                  ))}
                  <span className="text-xs text-ivory-muted/50 ml-2">
                    4.9/5 · 2,847 Connoisseurs
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        >
          <div className="w-6 h-10 rounded-full border border-gold/30 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-1 h-1 rounded-full bg-gold"
            />
          </div>
        </motion.div>
      </section>

      {/* ─── Featured Products ─── */}
      <section className="py-24 bg-festive-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs tracking-[0.3em] uppercase text-gold">
              New Additions
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl text-ivory mt-3">
              Product 1 to Product 5 — ₹10,000
            </h2>
            <div className="divider-gold w-24 mx-auto mt-6" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURED_PRODUCTS.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="product-card group relative">
                  <div className="relative h-64 w-full bg-obsidian-lighter overflow-hidden">
                    <img
                      src={getAssetUrl(item.imageUrl)}
                      alt={item.title}
                      className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-60" />
                    <span className="absolute top-3 right-3 text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full glass-gold text-gold border border-gold/30">
                      {item.tag}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="font-serif text-lg text-ivory group-hover:text-gold transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-ivory-muted/60 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gold/10">
                      <span className="text-gold font-bold text-lg">
                        {formatPrice(item.price)}
                      </span>
                      <Link href="/collections" className="text-xs text-ivory-muted/60 group-hover:text-gold transition-colors flex items-center gap-1">
                        View Item <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Value Propositions ─── */}
      <section className="py-24 bg-obsidian">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs tracking-[0.3em] uppercase text-gold">
              Why Choose Us
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl text-ivory mt-3">
              Crafted with Reverence
            </h2>
            <div className="divider-gold w-24 mx-auto mt-6" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUE_PROPS.map((prop, i) => (
              <motion.div
                key={prop.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="w-14 h-14 mx-auto mb-5 rounded-xl glass-gold flex items-center justify-center transition-all duration-300 group-hover:shadow-gold group-hover:scale-105">
                  <prop.icon
                    className="w-6 h-6 text-gold"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-serif text-lg text-ivory mb-2">
                  {prop.title}
                </h3>
                <p className="text-sm text-ivory-muted/50 leading-relaxed">
                  {prop.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
