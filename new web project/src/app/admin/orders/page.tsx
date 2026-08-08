"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Hammer, CheckCircle2, PackageCheck, Truck, Gift,
  Clock, X, FileText, Printer, User, MapPin, CreditCard, Layers,
  LayoutGrid, List, GripVertical, ChevronRight,
} from "lucide-react";
import { formatPrice } from "@/lib/pricing";

/* ═══════════════════════════════════════════════════════════
   Module C — Orders Kanban Board & Workshop Viewer
   Drag status updates · Order detail drawer · Job card PDF
   ═══════════════════════════════════════════════════════════ */

type OrderStatus = "NEW" | "CRAFTING" | "QC" | "PACKED" | "SHIPPED" | "DELIVERED";

interface OrderItem {
  name: string;
  qty: number;
  size: string;
  material: string;
  imageUrl: string;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  itemCount: number;
  createdAt: string;
  isCustomStack: boolean;
  stackLayers?: string[];
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: typeof ShoppingCart; color: string; bg: string }> = {
  NEW: { label: "New Orders", icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  CRAFTING: { label: "In Crafting", icon: Hammer, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  QC: { label: "Quality Check", icon: CheckCircle2, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  PACKED: { label: "Packed", icon: PackageCheck, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  SHIPPED: { label: "Shipped", icon: Truck, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
  DELIVERED: { label: "Delivered", icon: Gift, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

const STATUS_ORDER: OrderStatus[] = ["NEW", "CRAFTING", "QC", "PACKED", "SHIPPED", "DELIVERED"];

const SAMPLE_ORDERS: Order[] = [
  { id: "ORD-2851", customer: "Priya Sharma", email: "priya@example.com", phone: "+91 98765 43210", address: "42, MG Road", city: "Delhi", status: "NEW", total: 185600, items: [{ name: "Gold Kangan", qty: 3, size: "2.6", material: "Gold", imageUrl: "/images/products/product-5.jpg" }, { name: "Glass Chudi Set", qty: 12, size: "2.4", material: "Glass", imageUrl: "/images/products/product-2.jpg" }], itemCount: 15, createdAt: "2 min ago", isCustomStack: true, stackLayers: ["Outer Left Gold Kangan", "6× Red Glass Chudi (2.4)", "2× Pearl Bangle (2.4)", "Center Kundan Kada", "6× Red Glass Chudi (2.4)", "Outer Right Gold Kangan"] },
  { id: "ORD-2850", customer: "Meera Patel", email: "meera@example.com", phone: "+91 87654 32109", address: "15, Ring Road", city: "Mumbai", status: "NEW", total: 325000, items: [{ name: "Bridal Kundan Set", qty: 24, size: "2.6", material: "Kundan", imageUrl: "/images/products/product-4.jpg" }], itemCount: 24, createdAt: "18 min ago", isCustomStack: false },
  { id: "ORD-2849", customer: "Anjali Verma", email: "anjali@example.com", phone: "+91 76543 21098", address: "8, Civil Lines", city: "Jaipur", status: "CRAFTING", total: 42300, items: [{ name: "Pearl Bangles", qty: 6, size: "2.4", material: "Pearl", imageUrl: "/images/products/product-1.jpg" }, { name: "Brass Kada", qty: 2, size: "2.6", material: "Brass", imageUrl: "/images/products/product-3.jpg" }], itemCount: 8, createdAt: "1 hour ago", isCustomStack: true, stackLayers: ["2× Brass Kada (2.6)", "6× Pearl Bangle (2.4)"] },
  { id: "ORD-2848", customer: "Ritu Agarwal", email: "ritu@example.com", phone: "+91 65432 10987", address: "22, Park Street", city: "Kolkata", status: "QC", total: 75000, items: [{ name: "Diamond Tennis Bracelet", qty: 1, size: "2.6", material: "Diamond", imageUrl: "/images/products/product-5.jpg" }], itemCount: 1, createdAt: "3 hours ago", isCustomStack: false },
  { id: "ORD-2847", customer: "Kavita Singh", email: "kavita@example.com", phone: "+91 54321 09876", address: "7, Anna Nagar", city: "Chennai", status: "PACKED", total: 210500, items: [{ name: "Custom Stack", qty: 18, size: "2.4", material: "Mixed", imageUrl: "/images/products/product-1.jpg" }], itemCount: 18, createdAt: "6 hours ago", isCustomStack: true, stackLayers: ["2× Gold Kangan", "8× Velvet Chudi", "4× Kundan Bangle", "2× Pearl", "2× Gold Kangan"] },
  { id: "ORD-2846", customer: "Deepa Reddy", email: "deepa@example.com", phone: "+91 43210 98765", address: "3, Jubilee Hills", city: "Hyderabad", status: "SHIPPED", total: 92000, items: [{ name: "Magenta Velvet Set", qty: 8, size: "2.6", material: "Velvet", imageUrl: "/images/products/product-3.jpg" }], itemCount: 8, createdAt: "1 day ago", isCustomStack: false },
  { id: "ORD-2845", customer: "Sunita Joshi", email: "sunita@example.com", phone: "+91 32109 87654", address: "11, Lal Bagh", city: "Lucknow", status: "DELIVERED", total: 156000, items: [{ name: "Yellow Bow Kundan Set", qty: 6, size: "2.4", material: "Kundan", imageUrl: "/images/products/product-1.jpg" }], itemCount: 6, createdAt: "3 days ago", isCustomStack: false },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(SAMPLE_ORDERS);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  function moveOrder(orderId: string, newStatus: OrderStatus) {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
  }

  function advanceOrder(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const currentIdx = STATUS_ORDER.indexOf(order.status);
    if (currentIdx < STATUS_ORDER.length - 1) {
      moveOrder(orderId, STATUS_ORDER[currentIdx + 1]);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-gradient-gold tracking-wider">Order Fulfillment</h1>
          <p className="text-sm text-ivory-muted/50 mt-1">{orders.length} orders · {orders.filter((o) => o.status === "NEW").length} new</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setViewMode("kanban")} className={`p-2 rounded-lg transition-colors ${viewMode === "kanban" ? "bg-gold/10 text-gold" : "text-ivory-muted/40 hover:text-gold"}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition-colors ${viewMode === "table" ? "bg-gold/10 text-gold" : "text-ivory-muted/40 hover:text-gold"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_ORDER.map((status) => {
            const config = STATUS_CONFIG[status];
            const columnOrders = orders.filter((o) => o.status === status);
            return (
              <div key={status} className="flex-shrink-0 w-72">
                {/* Column header */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl border ${config.bg}`}>
                  <config.icon className={`w-4 h-4 ${config.color}`} />
                  <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>{columnOrders.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2 mt-2 min-h-[200px]">
                  {columnOrders.map((order) => (
                    <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl glass p-3 cursor-pointer hover:border-gold/20 transition-all group" onClick={() => setSelectedOrder(order)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gold font-semibold">{order.id}</span>
                        <span className="text-[10px] text-ivory-muted/30">{order.createdAt}</span>
                      </div>
                      <p className="text-sm text-ivory font-medium">{order.customer}</p>
                      <p className="text-[10px] text-ivory-muted/40 mt-0.5">{order.city} · {order.itemCount} pcs</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gold/5">
                        <span className="text-sm text-gold font-bold">{formatPrice(order.total)}</span>
                        {order.isCustomStack && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">3D Stack</span>}
                      </div>
                      {/* Advance button */}
                      {status !== "DELIVERED" && (
                        <button onClick={(e) => { e.stopPropagation(); advanceOrder(order.id); }} className="w-full mt-2 py-1.5 text-[10px] tracking-wider uppercase rounded-lg glass text-ivory-muted/40 hover:text-gold hover:bg-gold/5 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1">
                          Move to {STATUS_CONFIG[STATUS_ORDER[STATUS_ORDER.indexOf(status) + 1]]?.label} <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl glass overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold/10">
                <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Order</th>
                <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Customer</th>
                <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Items</th>
                <th className="text-right px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Amount</th>
                <th className="text-center px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Status</th>
                <th className="text-right px-4 py-3 text-xs tracking-wider uppercase text-ivory-muted/40">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const config = STATUS_CONFIG[order.status];
                return (
                  <tr key={order.id} onClick={() => setSelectedOrder(order)} className="border-b border-gold/[0.03] hover:bg-gold/[0.02] cursor-pointer transition-colors">
                    <td className="px-4 py-3"><span className="text-sm text-gold font-semibold">{order.id}</span></td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-ivory">{order.customer}</p>
                      <p className="text-[10px] text-ivory-muted/35">{order.city}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-ivory-muted">{order.itemCount} pcs</span>
                      {order.isCustomStack && <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">3D</span>}
                    </td>
                    <td className="px-4 py-3 text-right"><span className="text-sm text-gold font-bold">{formatPrice(order.total)}</span></td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-wider uppercase rounded-full border ${config.bg} ${config.color}`}>
                        <config.icon className="w-3 h-3" /> {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right"><span className="text-xs text-ivory-muted/40">{order.createdAt}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ Order Detail Drawer ═══ */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-obsidian-light border-l border-gold/10 overflow-y-auto shadow-2xl">
              <div className="sticky top-0 z-10 bg-obsidian-light/95 backdrop-blur-md border-b border-gold/10 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-lg text-gold">{selectedOrder.id}</h2>
                  <p className="text-xs text-ivory-muted/40">{selectedOrder.createdAt}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-ivory-muted/40 hover:text-gold rounded-lg hover:bg-gold/5"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="space-y-3">
                  <h3 className="text-xs tracking-wider uppercase text-ivory-muted/30 font-semibold">Customer</h3>
                  <div className="glass rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-gold/50" /><span className="text-sm text-ivory">{selectedOrder.customer}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gold/50" /><span className="text-sm text-ivory-muted/70">{selectedOrder.address}, {selectedOrder.city}</span></div>
                    <div className="flex items-center gap-2"><CreditCard className="w-3.5 h-3.5 text-gold/50" /><span className="text-sm text-ivory-muted/70">{selectedOrder.phone}</span></div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h3 className="text-xs tracking-wider uppercase text-ivory-muted/30 font-semibold">Items ({selectedOrder.itemCount})</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass">
                        <img src={item.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-gold/20" />
                        <div className="flex-1">
                          <p className="text-sm text-ivory">{item.name}</p>
                          <p className="text-[10px] text-ivory-muted/40">Size {item.size} · {item.material} · Qty: {item.qty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Stack Blueprint */}
                {selectedOrder.isCustomStack && selectedOrder.stackLayers && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs tracking-wider uppercase text-amber-400 font-semibold">3D Stack Blueprint</h3>
                    </div>
                    <div className="space-y-1">
                      {selectedOrder.stackLayers.map((layer, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg glass">
                          <span className="w-5 h-5 rounded-full bg-gold/10 text-gold text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="text-xs text-ivory">{layer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center p-4 rounded-xl glass-gold">
                  <span className="text-sm text-ivory">Order Total</span>
                  <span className="text-xl text-gold font-bold font-serif">{formatPrice(selectedOrder.total)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedOrder.status !== "DELIVERED" && (
                    <button onClick={() => { advanceOrder(selectedOrder.id); setSelectedOrder({ ...selectedOrder, status: STATUS_ORDER[STATUS_ORDER.indexOf(selectedOrder.status) + 1] }); }} className="btn-primary flex-1">
                      <ChevronRight className="w-4 h-4" /> Advance Status
                    </button>
                  )}
                  {selectedOrder.isCustomStack && (
                    <button onClick={() => window.print()} className="btn-secondary flex-1">
                      <Printer className="w-4 h-4" /> Workshop Card
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
