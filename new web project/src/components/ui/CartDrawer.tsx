"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/pricing";

/* ═══════════════════════════════════════════════════════════
   Cart Drawer — Slide-out panel with pricing breakdown
   ═══════════════════════════════════════════════════════════ */

// Material color mapping for thumbnails
const MATERIAL_COLORS: Record<string, string> = {
  gold: "#FFD700",
  glass: "#E63946",
  kundan: "#E8C547",
  pearl: "#FFF8DC",
  brass: "#B5A642",
  diamond: "#B9F2FF",
};

export default function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getTax = useCartStore((s) => s.getTax);
  const getTotal = useCartStore((s) => s.getTotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md glass-gold overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gold/10">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-gold" strokeWidth={1.5} />
                <h2 className="font-serif text-xl tracking-wider text-gold">
                  Your Cart
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="p-2 text-ivory-muted hover:text-gold transition-colors rounded-full hover:bg-gold/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag
                    className="w-16 h-16 text-gold/20 mb-4"
                    strokeWidth={1}
                  />
                  <p className="font-serif text-lg text-ivory-muted mb-2">
                    Your cart is empty
                  </p>
                  <p className="text-sm text-ivory-muted/60">
                    Visit the Studio to build your perfect bangle stack
                  </p>
                </div>
              ) : (
                items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-4 p-4 rounded-lg bg-obsidian-light/50 border border-gold/5"
                  >
                    {/* Material thumbnail */}
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-obsidian-lighter/50 overflow-hidden flex-shrink-0">
                      <div className="flex flex-wrap gap-0.5 p-1">
                        {item.stack.slice(0, 4).map((b, bi) => (
                          <div
                            key={bi}
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                MATERIAL_COLORS[b.material] || "#D4AF37",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-ivory truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-ivory-muted/60 mt-0.5">
                        {item.stack.length} bangles · Size {item.wristSize}
                      </p>
                      <p className="text-sm font-semibold text-gold mt-1">
                        {formatPrice(item.unitPrice)}
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-6 h-6 rounded flex items-center justify-center bg-obsidian-lighter text-ivory-muted hover:text-gold hover:bg-gold/10 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm text-ivory w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-6 h-6 rounded flex items-center justify-center bg-obsidian-lighter text-ivory-muted hover:text-gold hover:bg-gold/10 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-ivory-muted/40 hover:text-ruby transition-colors self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer — Pricing */}
            {items.length > 0 && (
              <div className="border-t border-gold/10 p-6 space-y-3">
                <div className="flex justify-between text-sm text-ivory-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(getSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-ivory-muted">
                  <span>GST (3%)</span>
                  <span>{formatPrice(getTax())}</span>
                </div>
                <div className="divider-gold" />
                <div className="flex justify-between text-lg font-serif">
                  <span className="text-ivory">Total</span>
                  <span className="text-gold font-semibold">
                    {formatPrice(getTotal())}
                  </span>
                </div>
                <button className="btn-primary w-full mt-4">
                  Proceed to Checkout
                </button>
                <button
                  onClick={closeCart}
                  className="w-full text-center text-sm text-ivory-muted hover:text-gold transition-colors mt-2"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
