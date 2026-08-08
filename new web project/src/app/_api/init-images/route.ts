import { NextResponse } from "next/server";
import { mkdir, copyFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

/* ═══════════════════════════════════════════════════════════
   Init Images API — Copies product images and logo to public/
   ═══════════════════════════════════════════════════════════ */

export async function GET() {
  const srcDir =
    "C:\\Users\\Sumit\\.gemini\\antigravity-ide\\brain\\99fcee9a-9354-40b1-91f6-dea70d7969eb";
  const destDir = path.join(process.cwd(), "public", "images", "products");
  const publicDir = path.join(process.cwd(), "public");

  try {
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true });
    }

    const results: string[] = [];

    // Copy logo
    const logoSrc = path.join(srcDir, "media__1786141814801.jpg");
    const logoDest1 = path.join(publicDir, "logo.jpg");
    const logoDest2 = path.join(publicDir, "images", "logo.jpg");

    if (existsSync(logoSrc)) {
      await copyFile(logoSrc, logoDest1);
      if (existsSync(path.join(publicDir, "images"))) {
        await copyFile(logoSrc, logoDest2);
      }
      results.push("Copied logo.jpg");
    }

    // Copy product images
    const mediaFiles = [
      "media__1786139624097.jpg",
      "media__1786139624100.jpg",
      "media__1786139624106.jpg",
      "media__1786139624113.jpg",
      "media__1786139624121.jpg",
    ];

    for (let i = 0; i < mediaFiles.length; i++) {
      const destPath = path.join(destDir, `product-${i + 1}.jpg`);
      const srcPath = path.join(srcDir, mediaFiles[i]);
      if (existsSync(srcPath)) {
        await copyFile(srcPath, destPath);
        results.push(`Copied product-${i + 1}.jpg`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to init images" },
      { status: 500 }
    );
  }
}
