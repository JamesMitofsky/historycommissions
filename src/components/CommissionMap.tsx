"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { numericIdForTag } from "@/lib/country-codes";

const COLOR_PAIRS = [
  { fill: "#4A90D9", fillHover: "#2E6FAD", stroke: "#2E6FAD" },
  { fill: "#E8724A", fillHover: "#C4522E", stroke: "#C4522E" },
  { fill: "#5CB88A", fillHover: "#3A8F68", stroke: "#3A8F68" },
  { fill: "#C97DD4", fillHover: "#9E5BAA", stroke: "#9E5BAA" },
  { fill: "#E8B84A", fillHover: "#C49028", stroke: "#C49028" },
  { fill: "#6B9E6B", fillHover: "#4A7A4A", stroke: "#4A7A4A" },
];

type Party = { numericId: number; name: string; fill: string; fillHover: string; stroke: string };

export function CommissionMap({ memberCountries }: { memberCountries: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const parties: Party[] = memberCountries
    .map((name, i) => {
      const numericId = numericIdForTag(name);
      if (numericId === null) return null;
      return { numericId, name, ...COLOR_PAIRS[i % COLOR_PAIRS.length] };
    })
    .filter((p): p is Party => p !== null);

  const depKey = parties.map((p) => p.numericId).join(",");

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || parties.length === 0) return;

    const container = containerRef.current;

    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((worldData: any) => {
        const width = container.clientWidth || 600;
        const height = width;

        const svg = d3.select(svgRef.current!);
        svg.selectAll("*").remove();
        svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", "100%").attr("height", height);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allCountries: any = topojson.feature(worldData, worldData.objects.countries);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function keepLargestPolygon(feature: any): any {
          if (feature.geometry?.type !== "MultiPolygon") return feature;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const coords: any[][] = feature.geometry.coordinates;
          let largestIdx = 0;
          let largestArea = -Infinity;
          coords.forEach((polygon, i) => {
            const ring = polygon[0];
            const lons = ring.map((p: number[]) => p[0]);
            const lats = ring.map((p: number[]) => p[1]);
            const area =
              (Math.max(...lons) - Math.min(...lons)) *
              (Math.max(...lats) - Math.min(...lats));
            if (area > largestArea) { largestArea = area; largestIdx = i; }
          });
          return { ...feature, geometry: { ...feature.geometry, coordinates: [coords[largestIdx]] } };
        }

        const highlightedIds = new Set(parties.map((p) => p.numericId));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processedFeatures = allCountries.features.map((f: any) =>
          highlightedIds.has(+f.id) ? keepLargestPolygon(f) : f
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const highlighted: any[] = processedFeatures.filter((f: any) =>
          highlightedIds.has(+f.id)
        );

        if (highlighted.length === 0) return;

        const projection = d3.geoNaturalEarth1();
        const padding = 48;
        projection.fitExtent(
          [
            [padding, padding],
            [width - padding, height - padding],
          ],
          { type: "FeatureCollection" as const, features: highlighted }
        );

        const path = d3.geoPath().projection(projection);

        svg
          .append("rect")
          .attr("width", width)
          .attr("height", height)
          .attr("fill", "#EFF4F8");

        const tooltip = container.querySelector<HTMLDivElement>(".map-tooltip")!;

        svg
          .selectAll("path")
          .data(processedFeatures)
          .enter()
          .append("path")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr("d", (d: any) => path(d) ?? "")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr("fill", (d: any) => parties.find((p) => p.numericId === +d.id)?.fill ?? "#D3D1C7")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr("stroke", (d: any) => parties.find((p) => p.numericId === +d.id)?.stroke ?? "#ffffff")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .attr("stroke-width", (d: any) =>
            parties.some((p) => p.numericId === +d.id) ? 1.5 : 0.3
          )
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .style("cursor", (d: any) =>
            parties.some((p) => p.numericId === +d.id) ? "pointer" : "default"
          )
          .on("mousemove", function (event: MouseEvent, d: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const id = (d as any).id;
            const party = parties.find((p) => p.numericId === +id);
            if (!party) return;
            tooltip.textContent = party.name;
            tooltip.style.opacity = "1";
            tooltip.style.left = event.offsetX + 10 + "px";
            tooltip.style.top = event.offsetY - 36 + "px";
            d3.select(this).attr("fill", party.fillHover);
          })
          .on("mouseleave", function (_event: MouseEvent, d: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const id = (d as any).id;
            const party = parties.find((p) => p.numericId === +id);
            if (!party) return;
            tooltip.style.opacity = "0";
            d3.select(this).attr("fill", party.fill);
          });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  if (parties.length === 0) return null;

  return (
    <div ref={containerRef} className="relative rounded-lg overflow-hidden border border-border/50">
      <svg ref={svgRef} style={{ display: "block", width: "100%" }} />
      <div
        className="map-tooltip pointer-events-none absolute rounded px-2 py-1 text-xs font-medium bg-foreground text-background opacity-0 transition-opacity whitespace-nowrap"
        style={{ top: 0, left: 0 }}
      />
    </div>
  );
}
