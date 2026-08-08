"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Ruler, Printer, Info, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import CartDrawer from "@/components/ui/CartDrawer";
import Footer from "@/components/ui/Footer";
import { BANGLE_SIZES } from "@/store/customizer";

/* ═══════════════════════════════════════════════════════════
   Size Guide Page — Interactive wrist sizing tool
   ═══════════════════════════════════════════════════════════ */

const SIZE_DATA = [
  { size: "2.2", circumference: "17.6 cm", diameter: "5.6 cm", fit: "Very Slim", color: "#FF6B6B" },
  { size: "2.4", circumference: "19.2 cm", diameter: "6.1 cm", fit: "Slim", color: "#FFD93D" },
  { size: "2.6", circumference: "20.8 cm", diameter: "6.6 cm", fit: "Medium", color: "#6BCB77" },
  { size: "2.8", circumference: "22.4 cm", diameter: "7.1 cm", fit: "Large", color: "#4D96FF" },
  { size: "2.10", circumference: "24 cm", diameter: "7.6 cm", fit: "Extra Large", color: "#9B59B6" },
];

const STEPS = [
  "Wrap a soft measuring tape or strip of paper around the widest part of your hand (knuckles).",
  "Note the measurement in centimeters — this is your circumference.",
  "Match your measurement to the closest size in our chart below.",
  "For comfort, choose the size closest to your knuckle width, not your wrist.",
];

export default function SizeGuidePage() {
  const [selectedSize, setSelectedSize] = useState("2.4");
  const selected = SIZE_DATA.find((s) => s.size === selectedSize);

  return (
    <main className="bg-obsidian min-h-screen">
      <Navbar />
      <CartDrawer />

      {/* Header */}
      <section className="pt-28 pb-12 bg-festive-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-xs tracking-[0.3em] uppercase text-gold">
              Perfect Fit
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl text-ivory mt-3">
              Bangle Size Guide
            </h1>
            <div className="divider-gold w-24 mx-auto mt-6" />
            <p className="text-ivory-muted/60 mt-4 max-w-lg mx-auto">
              Find your perfect bangle size with our comprehensive guide.
              Indian bangle sizes are measured by the inner diameter in inches.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* How to Measure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="font-serif text-2xl text-ivory mb-6 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-gold" />
              How to Measure
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-4 rounded-xl glass"
                >
                  <span className="w-6 h-6 rounded-full bg-gold/15 text-gold text-sm flex items-center justify-center flex-shrink-0 font-semibold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-ivory-muted/70 leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Interactive Size Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="font-serif text-2xl text-ivory mb-6">
              Interactive Size Preview
            </h2>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Visual preview */}
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="relative">
                  {/* Wrist reference */}
                  <div className="w-32 h-32 rounded-full bg-ivory/5 border border-ivory/10 flex items-center justify-center">
                    <span className="text-xs text-ivory-muted/30">Wrist</span>
                  </div>
                  {/* Bangle ring */}
                  <motion.div
                    key={selectedSize}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div
                      className="rounded-full border-4"
                      style={{
                        width: `${100 + (parseFloat(selectedSize) - 2.0) * 80}px`,
                        height: `${100 + (parseFloat(selectedSize) - 2.0) * 80}px`,
                        borderColor: selected?.color || "#D4AF37",
                        boxShadow: `0 0 30px ${selected?.color || "#D4AF37"}30`,
                      }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Size buttons & details */}
              <div className="flex-1">
                <div className="flex gap-2 mb-6">
                  {BANGLE_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`flex-1 py-3 text-sm rounded-lg transition-all duration-300 ${
                        selectedSize === size
                          ? "bg-gold text-obsidian font-semibold shadow-gold"
                          : "glass text-ivory-muted hover:text-gold"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                {selected && (
                  <motion.div
                    key={selectedSize}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-xl glass-gold space-y-3"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-ivory-muted">Size</span>
                      <span className="text-gold font-semibold text-lg">{selected.size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ivory-muted">Diameter</span>
                      <span className="text-ivory">{selected.diameter}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ivory-muted">Circumference</span>
                      <span className="text-ivory">{selected.circumference}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-ivory-muted">Fit</span>
                      <span className="text-ivory">{selected.fit}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Size Chart Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="font-serif text-2xl text-ivory mb-6">
              Complete Size Chart
            </h2>
            <div className="overflow-x-auto rounded-xl border border-gold/10">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gold/10">
                    <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-gold">Size</th>
                    <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-gold">Diameter</th>
                    <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-gold">Circumference</th>
                    <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-gold">Fit</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_DATA.map((row) => (
                    <tr
                      key={row.size}
                      className={`border-b border-gold/5 transition-colors ${
                        selectedSize === row.size
                          ? "bg-gold/5"
                          : "hover:bg-ivory/[0.02]"
                      }`}
                      onClick={() => setSelectedSize(row.size)}
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-ivory flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        {row.size}
                      </td>
                      <td className="px-6 py-4 text-sm text-ivory-muted">{row.diameter}</td>
                      <td className="px-6 py-4 text-sm text-ivory-muted">{row.circumference}</td>
                      <td className="px-6 py-4 text-sm text-ivory-muted">{row.fit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-xl glass-gold"
          >
            <h3 className="font-serif text-lg text-gold mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Sizing Tips
            </h3>
            <div className="space-y-2">
              {[
                "Bangles should pass over the knuckles when wearing, so measure the widest part of your hand.",
                "If you're between sizes, go with the larger size for comfort.",
                "Glass and rigid bangles need to fit snugly. Flexible bangles (gold/brass) can be slightly loose.",
                "Your dominant hand may be slightly larger — measure both!",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-ivory-muted/70">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
