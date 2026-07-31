"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CAPE_TOWN_CENTER } from "@/lib/map/suburbs";

// Leaflet is imported dynamically inside useEffect (no SSR — see task brief).

export interface MapProvider {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryName: string;
  lat: number;
  lng: number;
  rating: number;
  verifiedTier: "trusted" | "verified" | "listed";
  suburb: string;
}

export interface DensityRow {
  suburb: string;
  lat: number;
  lng: number;
  count: number;
}

export interface MapCategory {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
}

interface ProviderMapProps {
  categories: MapCategory[];
}

type LeafletModule = typeof import("leaflet");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function ProviderMap({ categories }: ProviderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const pinsLayerRef = useRef<LayerGroup | null>(null);
  const densityLayerRef = useRef<LayerGroup | null>(null);

  const [providers, setProviders] = useState<MapProvider[]>([]);
  const [density, setDensity] = useState<DensityRow[]>([]);
  const [category, setCategory] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  // ── Initialise the map once (dynamic import — no SSR) ──
  useEffect(() => {
    let disposed = false;
    let map: LeafletMap | null = null;

    (async () => {
      // `export =` module: runtime default is the Leaflet namespace,
      // but the type has no `.default` — cast through a narrow shape.
      const mod = (await import("leaflet")) as unknown as {
        default: LeafletModule;
      };
      const L = mod.default;
      if (disposed || !containerRef.current) return;

      leafletRef.current = L;

      map = L.map(containerRef.current, {
        center: CAPE_TOWN_CENTER,
        zoom: 12,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      pinsLayerRef.current = L.layerGroup().addTo(map);
      densityLayerRef.current = L.layerGroup().addTo(map);
    })();

    return () => {
      disposed = true;
      if (map) {
        map.remove();
        mapRef.current = null;
        leafletRef.current = null;
      }
    };
  }, []);

  // ── Fetch provider + density data from the API routes ──
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [providersRes, densityRes] = await Promise.all([
          fetch("/api/map/providers"),
          fetch("/api/map/density"),
        ]);
        if (!providersRes.ok || !densityRes.ok) {
          throw new Error("map data fetch failed");
        }
        const providersJson = await providersRes.json();
        const densityJson = await densityRes.json();
        if (cancelled) return;
        setProviders(providersJson.data ?? []);
        setDensity(densityJson.data ?? []);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProviders = useCallback(() => {
    return providers.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (verifiedOnly && p.verifiedTier === "listed") return false;
      return true;
    });
  }, [providers, category, verifiedOnly]);

  // ── Render provider pins (re-runs on filter change) ──
  useEffect(() => {
    const L = leafletRef.current;
    const layer = pinsLayerRef.current;
    if (!L || !layer) return;

    layer.clearLayers();

    for (const provider of visibleProviders()) {
      const verified = provider.verifiedTier !== "listed";
      const marker = L.circleMarker([provider.lat, provider.lng], {
        radius: 9,
        color: verified ? "#047857" : "#64748b",
        weight: 2,
        fillColor: verified ? "#10b981" : "#cbd5e1",
        fillOpacity: 0.9,
      }).addTo(layer);

      marker.bindPopup(
        `<div style="font-family: Inter, ui-sans-serif, system-ui, sans-serif; min-width: 160px;">
          <div style="font-weight: 700; font-size: 14px; color: #0f172a;">${escapeHtml(
            provider.name
          )}</div>
          <div style="margin-top: 2px; font-size: 12px; color: #475569;">
            ${escapeHtml(provider.categoryName)} · ${
          verified ? "✅ Verified" : "Listed"
        }
          </div>
          <div style="margin-top: 2px; font-size: 12px; color: #64748b;">
            ⭐ ${provider.rating.toFixed(1)} · ${escapeHtml(provider.suburb)}
          </div>
          <a href="/clubs/${provider.slug}" target="_blank" rel="noopener noreferrer"
             style="display: inline-block; margin-top: 8px; font-size: 13px; font-weight: 600; color: #0d9488;">
            View Club →
          </a>
        </div>`
      );
    }
  }, [providers, category, verifiedOnly, visibleProviders]);

  // ── Render density circles (blue, sized by count) ──
  useEffect(() => {
    const L = leafletRef.current;
    const layer = densityLayerRef.current;
    if (!L || !layer) return;

    layer.clearLayers();

    for (const row of density) {
      // Radius scales with the square root of the parent count (metres).
      const radius = Math.max(6000, Math.sqrt(row.count) * 6000);
      L.circle([row.lat, row.lng], {
        radius,
        color: "#3b82f6",
        weight: 1,
        fillColor: "#3b82f6",
        fillOpacity: 0.22,
      })
        .addTo(layer)
        .bindPopup(
          `<div style="font-family: Inter, ui-sans-serif, system-ui, sans-serif;">
            <strong>${escapeHtml(row.suburb)}</strong><br/>
            <span style="color: #475569;">${row.count} parent${
            row.count === 1 ? "" : "s"
          } nearby</span>
          </div>`
        );
    }
  }, [density]);

  const shown = visibleProviders();

  return (
    <div className="w-full">
      {/* Filter bar — category + verified only (client-side filtering) */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setVerifiedOnly((v) => !v)}
          aria-pressed={verifiedOnly}
          className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium shadow-sm transition-colors ${
            verifiedOnly
              ? "border-ilali-400 bg-ilali-50 text-ilali-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-ilali-300 hover:text-ilali-600 hover:bg-ilali-50"
          }`}
        >
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
              verifiedOnly
                ? "border-ilali-500 bg-ilali-500 text-white"
                : "border-slate-300 bg-white"
            }`}
          >
            {verifiedOnly && "✓"}
          </span>
          Verified only
        </button>

        <span
          className="ml-auto text-sm text-slate-500"
          data-testid="map-status"
          aria-live="polite"
        >
          {status === "loading" && "Loading clubs…"}
          {status === "error" && "Couldn't load map data."}
          {status === "ready" &&
            `${shown.length} of ${providers.length} clubs shown`}
        </span>
      </div>

      {/* Map */}
      <div className="relative">
        <div
          ref={containerRef}
          aria-label="Map of activity clubs in Cape Town"
          className="relative z-0 h-[65vh] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2.5 text-xs shadow-md">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-800 bg-emerald-500" />
            Verified
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-slate-700">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-slate-500 bg-slate-300" />
            Listed
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-slate-700">
            <span className="inline-block h-3 w-3 rounded-full border border-blue-500 bg-blue-400/30" />
            Parents nearby
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Density circles show the number of ILALI parents per suburb —
        anonymised at suburb level. Coordinates for pins fall back to suburb
        lookups, so positions are approximate.
      </p>
    </div>
  );
}
