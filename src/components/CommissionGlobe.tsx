"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as topojson from "topojson-client";
import * as d3 from "d3";
import type { Commission } from "@/commissions/types";
import { numericIdForTag } from "@/lib/country-codes";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type Arc = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  label: string;
  status: string;
};

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
    arcs.push({
      startLat: a[1],
      startLng: a[0],
      endLat: b[1],
      endLng: b[0],
      label: c.name.englishName,
      status: c.status,
    });
  }
  return arcs;
}

const ARC_COLOR: Record<string, string> = {
  active: "rgba(52, 211, 153, 1)",
  dormant: "rgba(251, 191, 36, 0.95)",
  concluded: "rgba(239, 68, 68, 0.85)",
  unknown: "rgba(239, 68, 68, 0.65)",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GeoFeature = any;

const IDLE_MS = 15_000;
const HOME = { lat: 40, lng: 38 };

export function CommissionGlobe({ commissions }: { commissions: Commission[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [polygons, setPolygons] = useState<GeoFeature[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  const [containerWidth, setContainerWidth] = useState(500);
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
          centroids.set(+f.id, d3.geoCentroid(f));
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
    setArcs(buildArcs(commissions, centroidsRef.current));
    const ids = new Set<number>();
    for (const c of commissions) {
      for (const name of c.memberCountries) {
        const id = numericIdForTag(name);
        if (id != null) ids.add(id);
      }
    }
    setHighlightedIds(ids);
  }, [commissions]);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(containerRef.current);
    setContainerWidth(containerRef.current.clientWidth);
    return () => obs.disconnect();
  }, []);

  const globeWidth = containerWidth;
  const globeHeight = Math.round(containerWidth * 0.7);

  // Height is the limiting dimension. Altitude must fit the sphere within globeHeight.
  // react-globe.gl uses 75° FOV (vertical). minAlt = 1/sin(FOV/2) - 1, plus margin.
  const FOV_RAD = (75 * Math.PI) / 180;
  const minAlt = 1 / Math.sin(FOV_RAD / 2) - 1 + 1;

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
    <div ref={containerRef} className="w-full">
      <div className="flex gap-2 mb-2 text-xs">
        <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: ARC_COLOR.active, color: "#fff" }}>Active</span>
        <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: ARC_COLOR.dormant, color: "#fff" }}>Dormant</span>
        <span className="px-2 py-0.5 rounded-full" style={{ backgroundColor: ARC_COLOR.concluded, color: "#fff" }}>Concluded / Unknown</span>
      </div>
      <div
        className="overflow-hidden"
        style={{ height: globeHeight }}
        onPointerDown={scheduleReset}
        onPointerMove={scheduleReset}
        onWheel={scheduleReset}
      >
        <Globe
          ref={globeRef}
          onGlobeReady={() => {
            globeRef.current?.pointOfView({ ...HOME, altitude: minAlt }, 0);
          }}
          width={globeWidth}
          height={globeHeight}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={null}
          showAtmosphere={false}
          showGraticules={false}
          polygonsData={polygons}
          polygonCapColor={(d: object) => highlightedIds.has(+(d as GeoFeature).id) ? "#94a3b8" : "#d1d5db"}
          polygonSideColor={() => "rgba(0,0,0,0)"}
          polygonStrokeColor={() => "#ffffff"}
          polygonAltitude={(d: object) => highlightedIds.has(+(d as GeoFeature).id) ? 0.014 : 0.006}
          arcsData={arcs}
          arcStartLat={(d) => (d as Arc).startLat}
          arcStartLng={(d) => (d as Arc).startLng}
          arcEndLat={(d) => (d as Arc).endLat}
          arcEndLng={(d) => (d as Arc).endLng}
          arcColor={(d: object) => ARC_COLOR[(d as Arc).status] ?? ARC_COLOR.unknown}
          arcDashLength={0.7}
          arcDashGap={0.02}
          arcDashAnimateTime={4000}
          arcStroke={1.2}
          arcAltitudeAutoScale={0.25}
          enablePointerInteraction={true}
          onZoom={({ altitude }: { altitude: number }) => {
            if (altitude < minAlt) globeRef.current?.pointOfView({ altitude: minAlt }, 0);
          }}
        />
      </div>
    </div>
  );
}
