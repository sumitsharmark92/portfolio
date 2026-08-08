"use client";

import Link from "next/link";
import { Crown, Instagram, Facebook, Twitter, Mail } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   Footer — Elegant brand footer with newsletter signup
   ═══════════════════════════════════════════════════════════ */

const FOOTER_LINKS = {
  collections: [
    { label: "Gold Kangan", href: "/collections?category=KANGAN" },
    { label: "Glass Chudi", href: "/collections?category=CHUDI" },
    { label: "Kundan Sets", href: "/collections?category=SET" },
    { label: "Diamond Bracelets", href: "/collections?category=BRACELET" },
    { label: "Wedding Collection", href: "/collections?tag=wedding" },
  ],
  support: [
    { label: "Size Guide", href: "/size-guide" },
    { label: "Shipping & Returns", href: "#" },
    { label: "Care Instructions", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "Contact Us", href: "#" },
  ],
  company: [
    { label: "Our Story", href: "#" },
    { label: "Artisan Partners", href: "#" },
    { label: "Sustainability", href: "#" },
    { label: "Press", href: "#" },
    { label: "Careers", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-obsidian-light border-t border-gold/5">
      {/* Decorative gold line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gold/40 shadow-gold flex-shrink-0">
                <img
                  src="/logo.jpg"
                  alt="Anand Kangan Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-serif text-xl tracking-wider text-gradient-gold">
                ANAND KANGAN
              </span>
            </Link>
            <p className="text-sm text-ivory-muted/70 leading-relaxed max-w-sm mb-6">
              Where centuries of Indian craftsmanship meet cutting-edge 3D
              technology. Each piece tells a story of heritage, designed for
              the modern connoisseur.
            </p>

            {/* Newsletter */}
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="input-dark flex-1 text-sm"
              />
              <button className="btn-primary text-xs px-4 py-2.5">
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-serif text-sm tracking-wider text-gold uppercase mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ivory-muted/60 hover:text-gold transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="divider-gold mt-12 mb-8" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ivory-muted/40">
            © {new Date().getFullYear()} Resplendence 3D. All rights reserved.
            Crafted with reverence.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="p-2 text-ivory-muted/40 hover:text-gold transition-colors duration-300"
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
