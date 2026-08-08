"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Menu,
  X,
  Crown,
  Search,
  User,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";

/* ═══════════════════════════════════════════════════════════
   Navbar — Glassmorphism navigation with gold accents
   ═══════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/studio", label: "Studio" },
  { href: "/collections", label: "Collections" },
  { href: "/size-guide", label: "Size Guide" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);
  const toggleMobileMenu = useUIStore((s) => s.toggleMobileMenu);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass shadow-gold py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-gold/40 shadow-gold group-hover:scale-105 transition-transform flex-shrink-0">
              <img
                src="/logo.jpg"
                alt="Anand Kangan Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image not yet copied
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <span className="font-serif text-xl tracking-wider text-gradient-gold">
              ANAND KANGAN
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm tracking-widest uppercase text-ivory-muted hover:text-gold transition-colors duration-300 group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button
              className="hidden md:flex p-2 text-ivory-muted hover:text-gold transition-colors duration-300"
              aria-label="Search"
            >
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </button>

            <button
              className="hidden md:flex p-2 text-ivory-muted hover:text-gold transition-colors duration-300"
              aria-label="Account"
            >
              <User className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative p-2 text-ivory-muted hover:text-gold transition-colors duration-300"
              aria-label={`Shopping cart with ${itemCount} items`}
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-obsidian text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-ivory-muted hover:text-gold transition-colors duration-300"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 glass pt-24"
          >
            <div className="flex flex-col items-center gap-8 py-12">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={toggleMobileMenu}
                    className="font-serif text-2xl tracking-wider text-ivory hover:text-gold transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="divider-gold w-24 my-4" />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  href="/auth/login"
                  onClick={toggleMobileMenu}
                  className="btn-secondary"
                >
                  Sign In
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
