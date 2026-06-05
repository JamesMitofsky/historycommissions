"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as topojson from "topojson-client";
import worldCountries from "world-countries";
import { MeshPhongMaterial, Color } from "three";
import type { Commission } from "@/commissions/types";
import { numericIdForTag } from "@/lib/country-codes";

// Pre-build centroid map from world-countries (manually curated latlng, not polygon-derived).
// Keyed by ISO 3166-1 numeric id (ccn3 as number). latlng is [lat, lng].
const WORLD_CENTROIDS = new Map<number, [number, number]>(
  worldCountries
    .filter((c) => c.ccn3 && c.latlng.length === 2)
    .map((c) => [parseInt(c.ccn3, 10), [c.latlng[1], c.latlng[0]] as [number, number]])
);

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type Arc = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  altitude: number;
  label: string;
  status: string;
  slug: string;
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Peak altitude (fraction of globe radius) for the shortest arcs.
const ARC_ALT_MAX = 0.03;
// Floor altitude for arcs at or beyond ARC_DIST_MAX_KM.
const ARC_ALT_MIN = 0.1;
// Distance (km) treated as "maximum" — arcs this long or longer clamp to ARC_ALT_MIN.
const ARC_DIST_MAX_KM = 10000;

function arcAltitudeForDistance(distKm: number): number {
  const t = Math.min(distKm / ARC_DIST_MAX_KM, 1);
  return ARC_ALT_MAX - t * (ARC_ALT_MAX - ARC_ALT_MIN);
}

function buildArcs(
  commissions: Commission[],
  centroids: Map<number, [number, number]>
): Arc[] {
  const arcs: Arc[] = [];
  for (const c of commissions) {
    if (c.memberCountries.length < 2) continue;
    const ids = c.memberCountries.map((name) => numericIdForTag(name)).filter((id): id is number => id != null);
    if (ids.length < 2) continue;
    const [id1, id2] = ids;
    const a = centroids.get(id1);
    const b = centroids.get(id2);
    if (!a || !b) continue;
    const dist = haversineKm(a[1], a[0], b[1], b[0]);
    arcs.push({
      startLat: a[1],
      startLng: a[0],
      endLat: b[1],
      endLng: b[0],
      altitude: arcAltitudeForDistance(dist),
      label: c.name.englishName,
      status: c.status,
      slug: c.slug,
    });
  }
  return arcs;
}

// Non-active groups use agnostic colors; `unknown` is grouped with `dormant`.
const ARC_COLOR: Record<string, string> = {
  active: "rgba(52, 211, 153, 1)",
  dormant: "rgba(14, 165, 233, 0.95)",
  concluded: "rgba(113, 113, 122, 0.85)",
  unknown: "rgba(14, 165, 233, 0.7)",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoFeature = any;

const IDLE_MS = 15_000;
const HOME = { lat: 40, lng: 38 };

export function CommissionGlobe({ commissions, visibleSlugs, onCountryClick }: { commissions: Commission[]; visibleSlugs?: Set<string>; onCountryClick?: (country: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [polygons, setPolygons] = useState<GeoFeature[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  // Cache annotated feature objects by id — only create new objects for features
  // whose highlight status changed so globe.gl only re-renders those polygons.
  const annotatedCacheRef = useRef<Map<number, GeoFeature>>(new Map());
  const [annotatedPolygons, setAnnotatedPolygons] = useState<GeoFeature[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const centroidsRef = useRef<Map<number, [number, number]>>(new Map());

  useEffect(() => {
    fetch("/countries-110m.json")
      .then((r) => r.json())
      .then((raw: GeoFeature) => {
        const features = (topojson.feature(raw, raw.objects.countries) as GeoFeature).features as GeoFeature[];
        setPolygons(features);
        const centroids = new Map<number, [number, number]>();
        for (const f of features) {
          const id = +f.id;
          const pt = WORLD_CENTROIDS.get(id);
          if (pt) centroids.set(id, pt);
        }
        centroidsRef.current = centroids;
        setArcs(buildArcs(commissions, centroids));
        const ids = new Set<number>();
        for (const c of commissions) {
          for (const name of c.memberCountries) {
            const id = numericIdForTag(name);
            if (id != null) ids.add(id);
          }
        }
        setHighlightedIds(ids);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (centroidsRef.current.size === 0) return;
    const ids = new Set<number>();
    const visible = visibleSlugs ?? new Set(commissions.map((c) => c.slug));
    for (const c of commissions) {
      if (!visible.has(c.slug)) continue;
      for (const name of c.memberCountries) {
        const id = numericIdForTag(name);
        if (id != null) ids.add(id);
      }
    }
    setHighlightedIds(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commissions, visibleSlugs]);

  useEffect(() => {
    if (polygons.length === 0) return;
    const cache = annotatedCacheRef.current;
    let changed = false;
    const next = polygons.map((f) => {
      const id = +f.id;
      const highlighted = highlightedIds.has(id);
      const existing = cache.get(id);
      if (existing && existing._highlighted === highlighted) return existing;
      const updated = { ...f, _highlighted: highlighted };
      cache.set(id, updated);
      changed = true;
      return updated;
    });
    if (changed || annotatedPolygons.length === 0) setAnnotatedPolygons(next);
  }, [polygons, highlightedIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const numericIdToTag = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of commissions) {
      for (const tag of c.memberCountries) {
        const id = numericIdForTag(tag);
        if (id != null && !map.has(id)) map.set(id, tag);
      }
    }
    return map;
  }, [commissions]);

  const waterMaterial = useMemo(() => {
    const mat = new MeshPhongMaterial();
    mat.color = new Color(0x4a7a91);
    return mat;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(containerRef.current);
    setContainerWidth(containerRef.current.clientWidth);
    return () => obs.disconnect();
  }, []);

  // Canvas height as a fraction of width. Smaller ratio = smaller, shorter globe.
  const GLOBE_HEIGHT_RATIO = 0.6;
  // Fraction of canvas height the sphere should fill. Near 1 = tight vertical
  // whitespace; lower leaves margin above/below.
  const GLOBE_FILL = 0.92;

  const globeWidth = containerWidth;
  const globeHeight = Math.round(containerWidth * GLOBE_HEIGHT_RATIO);

  // react-globe.gl uses a 75° vertical FOV. The sphere (radius 1) subtends a
  // half-angle θ where sin θ = 1/(1+altitude). On screen it fills
  // tan(θ)/tan(FOV/2) of the canvas height, so to hit GLOBE_FILL we invert that.
  const FOV_RAD = (75 * Math.PI) / 180;
  const theta = Math.atan(GLOBE_FILL * Math.tan(FOV_RAD / 2));
  const minAlt = 1 / Math.sin(theta) - 1;

  useEffect(() => {
    if (!globeRef.current || globeHeight === 0) return;
    globeRef.current.pointOfView({ ...HOME, altitude: minAlt }, 0);
  }, [globeHeight, minAlt]);

  const scheduleReset = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      globeRef.current?.pointOfView({ ...HOME, altitude: minAlt }, 1200);
    }, IDLE_MS);
  };

  useEffect(() => {
    scheduleReset();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div className="flex gap-2 mb-2 text-xs animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both" style={{ animationDelay: "220ms" }}>
        <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: ARC_COLOR.active, color: "#fff" }}>Active</span>
        <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: ARC_COLOR.dormant, color: "#fff" }}>Dormant / Unknown</span>
        <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: ARC_COLOR.concluded, color: "#fff" }}>Ended</span>
      </div>
      <div
        className="overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-900 fill-mode-both"
        style={{ height: containerWidth > 0 ? globeHeight : undefined, aspectRatio: `1 / ${GLOBE_HEIGHT_RATIO}`, animationDelay: "340ms" }}
        onPointerDown={scheduleReset}
        onPointerMove={scheduleReset}
      >
        {containerWidth > 0 && <Globe
          ref={globeRef}
          animateIn={false}
          onGlobeReady={() => {
            const startLng = HOME.lng + 55;
            const duration = 2200;
            const startTime = performance.now();
            const spin = (now: number) => {
              const t = Math.min((now - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - t, 3);
              globeRef.current?.pointOfView({ lat: HOME.lat, lng: startLng + (HOME.lng - startLng) * eased, altitude: minAlt }, 0);
              if (t < 1) requestAnimationFrame(spin);
            };
            requestAnimationFrame(spin);
            const controls = globeRef.current?.controls();
            if (controls) {
              controls.rotateSpeed = 0.4;
              controls.enableZoom = true;
              controls.dampingFactor = 0.08;
              controls.enableDamping = true;
            }
          }}
          width={globeWidth}
          height={globeHeight}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={null}
          globeMaterial={waterMaterial}
          showAtmosphere={false}
          showGraticules={false}
          polygonsData={annotatedPolygons}
          polygonCapColor={(d: object) => (d as GeoFeature & { _highlighted: boolean })._highlighted ? "#9b7d5e" : "#b8a48a"}
          polygonSideColor={() => "rgba(0,0,0,0)"}
          polygonStrokeColor={() => "rgba(255,255,255,0.25)"}
          polygonAltitude={(d: object) => (d as GeoFeature & { _highlighted: boolean })._highlighted ? 0.008 : 0.003}
          polygonLabel={(d: object) => {
            const name = (d as GeoFeature).properties?.name;
            return name ? `<div style="background:rgba(15,23,42,0.85);color:#f1f5f9;padding:4px 8px;border-radius:4px;font-size:12px;font-family:sans-serif;pointer-events:none">${name}</div>` : "";
          }}
          onPolygonClick={(d: object) => {
            if (!onCountryClick) return;
            const id = +(d as GeoFeature).id;
            const tag = numericIdToTag.get(id);
            if (tag) onCountryClick(tag);
          }}
          arcsData={arcs}
          arcStartLat={(d) => (d as Arc).startLat}
          arcStartLng={(d) => (d as Arc).startLng}
          arcEndLat={(d) => (d as Arc).endLat}
          arcEndLng={(d) => (d as Arc).endLng}
          arcColor={(d: object) => {
            const arc = d as Arc;
            if (visibleSlugs && !visibleSlugs.has(arc.slug)) return "rgba(0,0,0,0)";
            return ARC_COLOR[arc.status] ?? ARC_COLOR.unknown;
          }}
          arcDashLength={0.8}
          arcDashGap={0.01}
          arcDashAnimateTime={12000}
          arcStroke={.4}
          arcAltitude={(d) => (d as Arc).altitude}
          enablePointerInteraction={true}
        />}
      </div>
    </div>
  );
}
