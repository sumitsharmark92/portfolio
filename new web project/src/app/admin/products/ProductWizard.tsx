"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Upload,
  ImageIcon,
  Loader2,
  CheckCircle2,
  Sparkles,
  Trash2,
  Star,
  Box,
  IndianRupee,
  Calculator,
  Layers,
} from "lucide-react";
import { formatPrice } from "@/lib/pricing";

/* ═══════════════════════════════════════════════════════════
   Product Wizard — 3-Step Frictionless Product Onboarding
   Native HTML5 Drag & Drop (Zero external dependencies)
   ═══════════════════════════════════════════════════════════ */

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  url?: string;
  isPrimary: boolean;
}

interface ProductFormData {
  title: string;
  category: string;
  description: string;
  basePrice: number;
  goldWeight: number;
  goldKarat: "18K" | "22K" | "24K";
  gemstoneCost: number;
  makingCharge: number;
  images: UploadedImage[];
  model3dFile: File | null;
  model3dPreview: boolean;
  sizes: string[];
  material: string;
  stockPerSize: Record<string, number>;
}

const CATEGORIES = [
  "Chudi",
  "Kangan",
  "Full Chura Set",
  "Kundan Kada",
  "Bracelet",
  "Pearl Set",
];

const MATERIALS = [
  "Glass Chudi",
  "Brass",
  "Gold Plated",
  "Solid Gold",
  "Velvet Finish",
  "Kundan Studded",
  "Pearl Encrusted",
  "Diamond Cut",
];

const SIZES = ["2.2", "2.4", "2.6", "2.8", "2.10"];

const GOLD_RATES: Record<string, number> = {
  "18K": 5900,
  "22K": 7200,
  "24K": 7800,
};

interface ProductWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    category: string;
    material: string;
    basePrice: number;
    inventory: number;
    imageUrl: string;
    sizes: string[];
  }) => void;
}

export default function ProductWizard({
  isOpen,
  onClose,
  onSubmit,
}: ProductWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const [isModelDragOver, setIsModelDragOver] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductFormData>({
    title: "",
    category: "Chudi",
    description: "",
    basePrice: 0,
    goldWeight: 0,
    goldKarat: "22K",
    gemstoneCost: 0,
    makingCharge: 0,
    images: [],
    model3dFile: null,
    model3dPreview: false,
    sizes: ["2.4", "2.6"],
    material: "Glass Chudi",
    stockPerSize: { "2.4": 50, "2.6": 50 },
  });

  // Computed gold price
  const goldPrice =
    form.goldWeight > 0 ? form.goldWeight * GOLD_RATES[form.goldKarat] : 0;
  const calculatedTotal =
    (form.basePrice || 0) + goldPrice + form.gemstoneCost + form.makingCharge;

  // Process image files
  const processImageFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (fileArray.length === 0) return;

    const newImages: UploadedImage[] = fileArray.map((file, i) => ({
      id: `img-${Date.now()}-${i}`,
      file,
      preview: URL.createObjectURL(file),
      uploaded: false,
      isPrimary: form.images.length === 0 && i === 0,
    }));

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));

    // Upload each image to server API
    newImages.forEach(async (img) => {
      try {
        const fd = new FormData();
        fd.append("file", img.file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (res.ok) {
          setForm((prev) => ({
            ...prev,
            images: prev.images.map((i) =>
              i.id === img.id
                ? { ...i, uploaded: true, url: data.imageUrl }
                : i
            ),
          }));
        }
      } catch {}
    });
  }, [form.images.length]);

  // Handle image drag & drop
  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsImageDragOver(false);
    if (e.dataTransfer.files) {
      processImageFiles(e.dataTransfer.files);
    }
  }

  // Handle 3D model drop
  function handleModelDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsModelDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const modelFile = files.find(
      (f) => f.name.endsWith(".glb") || f.name.endsWith(".gltf")
    );
    if (modelFile) {
      setForm((prev) => ({
        ...prev,
        model3dFile: modelFile,
        model3dPreview: true,
      }));
    }
  }

  function removeImage(id: string) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((i) => i.id !== id),
    }));
  }

  function setPrimaryImage(id: string) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((i) => ({ ...i, isPrimary: i.id === id })),
    }));
  }

  function toggleSize(size: string) {
    setForm((prev) => {
      const hasSz = prev.sizes.includes(size);
      const newSizes = hasSz
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      const newStock = { ...prev.stockPerSize };
      if (!hasSz) newStock[size] = 50;
      else delete newStock[size];
      return { ...prev, sizes: newSizes, stockPerSize: newStock };
    });
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const primaryImg = form.images.find((i) => i.isPrimary && i.url);
    const fallbackImg = form.images.find((i) => i.url);
    const imageUrl =
      primaryImg?.url || fallbackImg?.url || "/images/products/product-1.jpg";

    const totalInventory = Object.values(form.stockPerSize).reduce(
      (a, b) => a + b,
      0
    );

    onSubmit({
      title: form.title || "New Product",
      category: form.category,
      material: form.material,
      basePrice: calculatedTotal > 0 ? calculatedTotal : 10000,
      inventory: totalInventory,
      imageUrl,
      sizes: form.sizes,
    });

    setIsSubmitting(false);
    resetForm();
  }

  function resetForm() {
    setStep(1);
    setForm({
      title: "",
      category: "Chudi",
      description: "",
      basePrice: 0,
      goldWeight: 0,
      goldKarat: "22K",
      gemstoneCost: 0,
      makingCharge: 0,
      images: [],
      model3dFile: null,
      model3dPreview: false,
      sizes: ["2.4", "2.6"],
      material: "Glass Chudi",
      stockPerSize: { "2.4": 50, "2.6": 50 },
    });
  }

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          resetForm();
          onClose();
        }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-obsidian-light border-l border-gold/10 overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-obsidian-light/95 backdrop-blur-md border-b border-gold/10 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-xl text-gradient-gold">
                Add New Product
              </h2>
              <p className="text-xs text-ivory-muted/40 mt-0.5">
                Step {step} of 3
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="p-2 text-ivory-muted/40 hover:text-gold transition-colors rounded-lg hover:bg-gold/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                  s <= step ? "bg-gold" : "bg-ivory-muted/10"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* ═══ STEP 1: Info & Pricing ═══ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="w-5 h-5 text-gold" />
                  <h3 className="font-serif text-lg text-ivory">
                    Essential Information & Pricing
                  </h3>
                </div>

                <div>
                  <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-1.5 block">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="input-dark w-full"
                    placeholder="e.g., Royal Meenakari Gold Kangan Pair"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-1.5 block">
                      Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                      className="input-dark w-full"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-1.5 block">
                      Base Price (₹)
                    </label>
                    <input
                      type="number"
                      value={form.basePrice || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          basePrice: Number(e.target.value),
                        })
                      }
                      className="input-dark w-full"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-1.5 block">
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      rows={3}
                      className="input-dark w-full resize-none"
                      placeholder="Handcrafted bangle with intricate detailing..."
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          description: `Exquisite handcrafted ${form.category} featuring intricate traditional artistry, premium finish, and meticulous craftsmanship by master artisans. Perfect for weddings, festivals, and everyday elegance.`,
                        })
                      }
                      className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 text-[10px] text-gold bg-gold/10 border border-gold/20 rounded-md hover:bg-gold/15 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      AI Generate
                    </button>
                  </div>
                </div>

                {/* Gold Pricing Engine */}
                <div className="rounded-xl border border-gold/15 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calculator className="w-4 h-4 text-gold" />
                    <span className="text-xs tracking-wider uppercase text-gold font-semibold">
                      Gold Pricing Engine
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-ivory-muted/40 mb-1 block">
                        Gold Weight (g)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.goldWeight || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            goldWeight: Number(e.target.value),
                          })
                        }
                        className="input-dark w-full text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-ivory-muted/40 mb-1 block">
                        Karat
                      </label>
                      <select
                        value={form.goldKarat}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            goldKarat: e.target.value as "18K" | "22K" | "24K",
                          })
                        }
                        className="input-dark w-full text-sm"
                      >
                        <option value="18K">
                          18K (₹{GOLD_RATES["18K"]}/g)
                        </option>
                        <option value="22K">
                          22K (₹{GOLD_RATES["22K"]}/g)
                        </option>
                        <option value="24K">
                          24K (₹{GOLD_RATES["24K"]}/g)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-ivory-muted/40 mb-1 block">
                        Gold Value
                      </label>
                      <div className="input-dark w-full text-sm text-gold font-semibold flex items-center">
                        {formatPrice(goldPrice)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-ivory-muted/40 mb-1 block">
                        Gemstone/Kundan Cost
                      </label>
                      <input
                        type="number"
                        value={form.gemstoneCost || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            gemstoneCost: Number(e.target.value),
                          })
                        }
                        className="input-dark w-full text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-ivory-muted/40 mb-1 block">
                        Making Charges
                      </label>
                      <input
                        type="number"
                        value={form.makingCharge || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            makingCharge: Number(e.target.value),
                          })
                        }
                        className="input-dark w-full text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gold/10">
                    <span className="text-sm text-ivory-muted">
                      Calculated Total
                    </span>
                    <span className="text-lg text-gold font-bold font-serif">
                      {formatPrice(calculatedTotal)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 2: Media Upload ═══ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-5 h-5 text-gold" />
                  <h3 className="font-serif text-lg text-ivory">
                    Media & Image Upload
                  </h3>
                </div>

                {/* Hidden image input */}
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => e.target.files && processImageFiles(e.target.files)}
                  className="hidden"
                />

                {/* Native Drag & Drop Zone */}
                <div>
                  <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-2 block">
                    Product Images (Drag & Drop Multiple)
                  </label>
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsImageDragOver(true);
                    }}
                    onDragLeave={() => setIsImageDragOver(false)}
                    onDrop={handleImageDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      isImageDragOver
                        ? "border-gold bg-gold/10 scale-[1.01]"
                        : "border-gold/20 hover:border-gold/40 hover:bg-gold/5"
                    }`}
                  >
                    <Upload className="w-8 h-8 text-gold/40 mx-auto mb-2" />
                    <p className="text-sm text-ivory-muted/60">
                      {isImageDragOver
                        ? "Drop images here..."
                        : "Drop images here or click to browse"}
                    </p>
                    <p className="text-[10px] text-ivory-muted/30 mt-1">
                      JPEG, PNG, WebP · Max 10MB each · Multiple files
                    </p>
                  </div>
                </div>

                {/* Image Preview Grid */}
                {form.images.length > 0 && (
                  <div>
                    <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-2 block">
                      Uploaded ({form.images.length}) — Click star to set primary
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {form.images.map((img) => (
                        <div
                          key={img.id}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all group ${
                            img.isPrimary
                              ? "border-gold shadow-gold"
                              : "border-gold/10 hover:border-gold/30"
                          }`}
                        >
                          <img
                            src={img.preview}
                            alt=""
                            className="w-full h-28 object-cover"
                          />
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-obsidian/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(img.id)}
                              className="p-1.5 rounded-full bg-obsidian/60 text-gold hover:bg-gold/20 transition-colors"
                              title="Set as primary"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="p-1.5 rounded-full bg-obsidian/60 text-rose-400 hover:bg-rose-500/20 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {/* Status badges */}
                          {img.isPrimary && (
                            <span className="absolute top-1.5 left-1.5 text-[8px] tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-gold text-obsidian font-bold">
                              Cover
                            </span>
                          )}
                          <div className="absolute bottom-1.5 right-1.5">
                            {img.uploaded ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Loader2 className="w-4 h-4 text-gold animate-spin" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden 3D model input */}
                <input
                  ref={modelInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setForm((prev) => ({ ...prev, model3dFile: f, model3dPreview: true }));
                  }}
                  className="hidden"
                />

                {/* 3D Model Upload Dropzone */}
                <div>
                  <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-2 block">
                    3D Model (.glb / .gltf) — Optional
                  </label>
                  <div
                    onClick={() => modelInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsModelDragOver(true);
                    }}
                    onDragLeave={() => setIsModelDragOver(false)}
                    onDrop={handleModelDrop}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isModelDragOver
                        ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                        : form.model3dFile
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-gold/15 hover:border-gold/30 hover:bg-gold/5"
                    }`}
                  >
                    {form.model3dFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm text-emerald-400">
                          {form.model3dFile.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm({
                              ...form,
                              model3dFile: null,
                              model3dPreview: false,
                            });
                          }}
                          className="ml-2 text-ivory-muted/40 hover:text-rose-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Box className="w-6 h-6 text-gold/30 mx-auto mb-1.5" />
                        <p className="text-sm text-ivory-muted/50">
                          {isModelDragOver ? "Drop 3D model file..." : "Click or drop .glb / .gltf 3D model file"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 3: Variants & Stock ═══ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-5 h-5 text-gold" />
                  <h3 className="font-serif text-lg text-ivory">
                    Materials, Sizes & Stock
                  </h3>
                </div>

                {/* Material Selection */}
                <div>
                  <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-2 block">
                    Material Preset
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {MATERIALS.map((mat) => (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => setForm({ ...form, material: mat })}
                        className={`px-2 py-2 rounded-lg text-xs text-center transition-all ${
                          form.material === mat
                            ? "bg-gold/15 text-gold border border-gold/25 font-semibold"
                            : "glass text-ivory-muted/60 hover:text-gold"
                        }`}
                      >
                        {mat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-2 block">
                    Available Sizes
                  </label>
                  <div className="flex gap-2">
                    {SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${
                          form.sizes.includes(size)
                            ? "bg-gold text-obsidian font-bold shadow-gold"
                            : "glass text-ivory-muted/50 hover:text-gold"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stock Per Size Matrix */}
                <div>
                  <label className="text-xs tracking-wider uppercase text-ivory-muted/50 mb-2 block">
                    Stock Quantity Per Size
                  </label>
                  <div className="space-y-2">
                    {form.sizes.map((size) => (
                      <div
                        key={size}
                        className="flex items-center gap-3 p-3 rounded-lg glass"
                      >
                        <span className="text-sm text-gold font-semibold w-10">
                          {size}
                        </span>
                        <input
                          type="number"
                          value={form.stockPerSize[size] || 0}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              stockPerSize: {
                                ...form.stockPerSize,
                                [size]: Number(e.target.value),
                              },
                            })
                          }
                          className="input-dark flex-1 text-sm"
                          min={0}
                        />
                        <span className="text-xs text-ivory-muted/30">pcs</span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center mt-3 p-3 rounded-lg glass-gold">
                    <span className="text-sm text-ivory-muted">
                      Total Inventory
                    </span>
                    <span className="text-lg text-gold font-bold">
                      {Object.values(form.stockPerSize).reduce(
                        (a, b) => a + b,
                        0
                      )}{" "}
                      pcs
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-gold/15 p-4 space-y-2">
                  <h4 className="text-xs tracking-wider uppercase text-gold font-semibold mb-2">
                    Product Summary
                  </h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-ivory-muted/60">Title</span>
                    <span className="text-ivory">
                      {form.title || "Untitled"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ivory-muted/60">Category</span>
                    <span className="text-ivory">{form.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ivory-muted/60">Material</span>
                    <span className="text-ivory">{form.material}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ivory-muted/60">Images</span>
                    <span className="text-ivory">{form.images.length}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gold/10">
                    <span className="text-ivory font-semibold">
                      Final Price
                    </span>
                    <span className="text-gold font-bold text-lg">
                      {formatPrice(calculatedTotal > 0 ? calculatedTotal : 10000)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gold/10">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="btn-secondary flex-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="btn-primary flex-1"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Create Product
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
