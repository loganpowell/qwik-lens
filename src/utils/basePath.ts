/**
 * Base path utilities for GitHub Pages deployment
 *
 * When deployed to GitHub Pages, the app is served from a subdirectory
 * (e.g., /qwik-lens/). These utilities ensure all paths are correctly
 * prefixed with the base path.
 */

/**
 * Get the base path from Vite's BASE_URL environment variable.
 * For GitHub Pages: "/qwik-lens/"
 * For root deployment: "/"
 */
export const getBase = (): string => {
  return import.meta.env.BASE_URL || "/";
};

/**
 * Get the base path without trailing slash.
 * Useful for constructing resource URLs like "/qwik-lens/features.json"
 *
 * @returns Empty string for root ("/"), or base path without trailing slash
 */
export const getBasePath = (): string => {
  const base = getBase();
  return base === "/" ? "" : base.replace(/\/$/, "");
};

/**
 * Get a resource path with the base path prepended.
 *
 * @param path - The resource path (e.g., "/features.json" or "features.json")
 * @returns Full path with base (e.g., "/qwik-lens/features.json")
 *
 * @example
 * ```ts
 * const url = getResourcePath("/features.json");
 * // Returns: "/qwik-lens/features.json" on GitHub Pages
 * // Returns: "/features.json" on root deployment
 * ```
 */
export const getResourcePath = (path: string): string => {
  const basePath = getBasePath();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
};

/**
 * Get a route path with the base path prepended.
 *
 * @param route - The route path (e.g., "/features" or "features")
 * @returns Full route with base (e.g., "/qwik-lens/features")
 *
 * @example
 * ```tsx
 * <Link href={getRoutePath("/features")}>Features</Link>
 * // Navigates to: /qwik-lens/features on GitHub Pages
 * ```
 */
export const getRoutePath = (route: string): string => {
  const basePath = getBasePath();

  // Handle root/home route
  if (route === "/" || route === "") {
    return basePath || "/";
  }

  // Handle other routes
  const cleanRoute = route.startsWith("/") ? route : `/${route}`;
  return `${basePath}${cleanRoute}`;
};
