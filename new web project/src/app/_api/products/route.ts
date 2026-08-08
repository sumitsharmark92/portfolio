import { NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════
   Products API — Updated with User Uploaded Products
   Product 1, Product 2, Product 3, Product 4, Product 5 @ ₹10,000
   ═══════════════════════════════════════════════════════════ */

export interface ProductItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: "CHUDI" | "KANGAN" | "SET" | "BRACELET";
  material: string;
  colorHex: string;
  basePrice: number;
  inventory: number;
  isPublished: boolean;
  imageUrl: string;
  sizes: string[];
  tag?: string;
  isNew?: boolean;
}

let PRODUCTS: ProductItem[] = [
  {
    id: "prod-1",
    title: "Product 1 — Yellow Bow Kundan Bangle Set",
    slug: "product-1",
    description: "Exquisite handcrafted yellow bangle set embellished with intricate white bow motifs and crystal borders",
    category: "SET",
    material: "Kundan",
    colorHex: "#FFD700",
    basePrice: 10000,
    inventory: 50,
    isPublished: true,
    imageUrl: "/images/products/product-1.jpg",
    sizes: ["2.2", "2.4", "2.6", "2.8"],
    tag: "Featured",
    isNew: true,
  },
  {
    id: "prod-2",
    title: "Product 2 — Royal Blue Crystal Velvet Stack",
    slug: "product-2",
    description: "Deep sapphire blue velvet bangles studded with shimmering black and blue diamond-cut crystals",
    category: "CHUDI",
    material: "Glass",
    colorHex: "#1D3557",
    basePrice: 10000,
    inventory: 75,
    isPublished: true,
    imageUrl: "/images/products/product-2.jpg",
    sizes: ["2.2", "2.4", "2.6", "2.8", "2.10"],
    tag: "Bestseller",
    isNew: true,
  },
  {
    id: "prod-3",
    title: "Product 3 — Magenta Velvet Crystal Bangle Set",
    slug: "product-3",
    description: "Rich maroon magenta velvet bangles with double-row champagne crystal embellishments",
    category: "SET",
    material: "Kundan",
    colorHex: "#7A1B2D",
    basePrice: 10000,
    inventory: 40,
    isPublished: true,
    imageUrl: "/images/products/product-3.jpg",
    sizes: ["2.4", "2.6", "2.8"],
    tag: "Royal",
    isNew: true,
  },
  {
    id: "prod-4",
    title: "Product 4 — Multicolored Floral Crystal Kangan Pair",
    slug: "product-4",
    description: "Traditional cream base Kangans decorated with hand-painted floral beads and pave crystal borders",
    category: "KANGAN",
    material: "Brass",
    colorHex: "#E8C547",
    basePrice: 10000,
    inventory: 30,
    isPublished: true,
    imageUrl: "/images/products/product-4.jpg",
    sizes: ["2.4", "2.6", "2.8"],
    tag: "Artisan",
    isNew: true,
  },
  {
    id: "prod-5",
    title: "Product 5 — Golden Crystal Paved Broad Kangan Pair",
    slug: "product-5",
    description: "Heavy gold finish broad Kangan pair fully encrusted with champagne crystal stone pave work",
    category: "KANGAN",
    material: "Gold",
    colorHex: "#DAA520",
    basePrice: 10000,
    inventory: 20,
    isPublished: true,
    imageUrl: "/images/products/product-5.jpg",
    sizes: ["2.4", "2.6", "2.8"],
    tag: "Exclusive",
    isNew: true,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const published = searchParams.get("published");

  let results = PRODUCTS;

  if (category) {
    results = results.filter((p) => p.category === category);
  }

  if (published === "true") {
    results = results.filter((p) => p.isPublished);
  }

  return NextResponse.json({
    products: results,
    total: results.length,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProduct: ProductItem = {
      id: `prod-${Date.now()}`,
      title: body.title || `Product ${PRODUCTS.length + 1}`,
      slug: (body.title || `product-${PRODUCTS.length + 1}`).toLowerCase().replace(/\s+/g, "-"),
      description: body.description || "Custom handcrafted bangle set",
      category: body.category || "KANGAN",
      material: body.material || "Gold",
      colorHex: body.colorHex || "#FFD700",
      basePrice: Number(body.basePrice) || 10000,
      inventory: Number(body.inventory) || 50,
      isPublished: true,
      imageUrl: body.imageUrl || `/images/products/product-1.jpg`,
      sizes: body.sizes || ["2.4", "2.6", "2.8"],
      isNew: true,
    };

    PRODUCTS.unshift(newProduct);

    return NextResponse.json(
      { message: "Product created successfully", product: newProduct },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
