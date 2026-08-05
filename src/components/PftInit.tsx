"use client";

/**
 * prop-for-that init (spike 2026-08-05).
 *
 * Two important integration notes for Next.js:
 *
 * 1. Plugins must be registered statically — NOT via auto's JIT chunks.
 *    `prop-for-that/auto` lazy-loads plugin chunks via dynamic import(), which
 *    does NOT resolve under Next/Turbopack (the generated chunk names differ —
 *    "Failed to fetch dynamically imported module"). Core sources (visibility,
 *    size, range, clock…) work fine through auto; every PLUGIN you use
 *    (pointer-local, media, field, …) must be imported from
 *    `prop-for-that/plugins` and registered here before the auto scan runs.
 *    The plugins entry statically bundles its chunks, so this is Next-safe.
 *
 * 2. Init after hydration — running the scan during hydration writes the
 *    live/const CSS custom properties into style attributes the server
 *    didn't render, causing React hydration-mismatch warnings. Importing
 *    auto inside useEffect() defers the scan until after hydration.
 */
import { useEffect } from "react";
import { registerPlugins, pointerLocal } from "prop-for-that/plugins";

export default function PftInit() {
  useEffect(() => {
    registerPlugins(pointerLocal);
    import("prop-for-that/auto");
  }, []);
  return null;
}
