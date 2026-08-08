/**
 * Helper to ensure image and asset URLs are properly prefixed with basePath (/e-commerce)
 * when deployed to GitHub Pages or hosted under /e-commerce.
 */
export function getAssetUrl(path?: string | null): string {
  if (!path) return "/e-commerce/logo.jpg";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath.startsWith("/e-commerce/")) {
    return cleanPath;
  }
  return `/e-commerce${cleanPath}`;
}
