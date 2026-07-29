<script lang="ts">
  import * as d3 from "d3";
  import * as topojson from "topojson-client";
  import type { Topology } from "topojson-specification";
  import type { Feature, FeatureCollection, Geometry } from "geojson";
  import { numericIdForTag } from "@/lib/country-codes";

  interface Props {
    memberCountries: string[];
    aspectRatio?: number;
  }

  let { memberCountries, aspectRatio = 1 }: Props = $props();

  const COLOR_PAIRS = [
    { fill: "#4A90D9", fillHover: "#2E6FAD", stroke: "#2E6FAD" },
    { fill: "#E8724A", fillHover: "#C4522E", stroke: "#C4522E" },
    { fill: "#5CB88A", fillHover: "#3A8F68", stroke: "#3A8F68" },
    { fill: "#C97DD4", fillHover: "#9E5BAA", stroke: "#9E5BAA" },
    { fill: "#E8B84A", fillHover: "#C49028", stroke: "#C49028" },
    { fill: "#6B9E6B", fillHover: "#4A7A4A", stroke: "#4A7A4A" },
  ];

  type Party = {
    numericId: number;
    name: string;
    fill: string;
    fillHover: string;
    stroke: string;
  };

  const parties = $derived(
    memberCountries
      .map((name, i) => {
        const numericId = numericIdForTag(name);
        if (numericId === null) return null;
        return { numericId, name, ...COLOR_PAIRS[i % COLOR_PAIRS.length] };
      })
      .filter((p): p is Party => p !== null),
  );

  let containerEl = $state<HTMLDivElement | null>(null);
  let svgEl = $state<SVGSVGElement | null>(null);
  let tooltipEl = $state<HTMLDivElement | null>(null);

  /**
   * The world topology is fetched once per page and shared by every map on it —
   * the commissions index renders one card per commission, and without this each
   * would issue its own request for the same 100kB file.
   *
   * Served from public/ rather than a CDN so the map has no third-party runtime
   * dependency and keeps working offline.
   */
  let worldPromise: Promise<Topology> | null = null;
  function loadWorld(): Promise<Topology> {
    worldPromise ??= fetch("/countries-110m.json").then((r) => r.json());
    return worldPromise;
  }

  /**
   * Highlighted countries are reduced to their largest landmass so the
   * projection frames the mainland — otherwise a distant overseas territory
   * (French Guiana, Alaska) stretches the extent and shrinks the subject.
   */
  function keepLargestPolygon(feature: Feature<Geometry>): Feature<Geometry> {
    if (feature.geometry?.type !== "MultiPolygon") return feature;
    const coords = feature.geometry.coordinates;
    let largestIdx = 0;
    let largestArea = -Infinity;
    coords.forEach((polygon, i) => {
      const ring = polygon[0];
      const lons = ring.map((p) => p[0]);
      const lats = ring.map((p) => p[1]);
      const area =
        (Math.max(...lons) - Math.min(...lons)) *
        (Math.max(...lats) - Math.min(...lats));
      if (area > largestArea) {
        largestArea = area;
        largestIdx = i;
      }
    });
    return {
      ...feature,
      geometry: { ...feature.geometry, coordinates: [coords[largestIdx]] },
    };
  }

  $effect(() => {
    const container = containerEl;
    const svgNode = svgEl;
    const tooltip = tooltipEl;
    const currentParties = parties;
    if (!container || !svgNode || !tooltip || currentParties.length === 0) return;

    let cancelled = false;

    loadWorld().then((worldData) => {
      if (cancelled) return;

      const width = container.clientWidth || 600;
      const height = Math.round(width * aspectRatio);

      const svg = d3.select(svgNode);
      svg.selectAll("*").remove();
      svg
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", height);

      const allCountries = topojson.feature(
        worldData,
        worldData.objects.countries,
      ) as unknown as FeatureCollection<Geometry>;

      const highlightedIds = new Set(currentParties.map((p) => p.numericId));
      const processedFeatures = allCountries.features.map((f) =>
        highlightedIds.has(Number(f.id)) ? keepLargestPolygon(f) : f,
      );
      const highlighted = processedFeatures.filter((f) =>
        highlightedIds.has(Number(f.id)),
      );
      if (highlighted.length === 0) return;

      const projection = d3.geoNaturalEarth1();
      const padding = 48;
      projection.fitExtent(
        [
          [padding, padding],
          [width - padding, height - padding],
        ],
        { type: "FeatureCollection", features: highlighted },
      );

      const path = d3.geoPath().projection(projection);
      const partyFor = (f: Feature<Geometry>) =>
        currentParties.find((p) => p.numericId === Number(f.id));

      svg
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#EFF4F8");

      svg
        .selectAll("path")
        .data(processedFeatures)
        .enter()
        .append("path")
        .attr("d", (d) => path(d) ?? "")
        .attr("fill", (d) => partyFor(d)?.fill ?? "#D3D1C7")
        .attr("stroke", (d) => partyFor(d)?.stroke ?? "#ffffff")
        .attr("stroke-width", (d) => (partyFor(d) ? 1.5 : 0.3))
        .style("cursor", (d) => (partyFor(d) ? "pointer" : "default"))
        .on("mousemove", function (event: MouseEvent, d) {
          const party = partyFor(d);
          if (!party) return;
          tooltip.textContent = party.name;
          tooltip.style.opacity = "1";
          tooltip.style.left = `${event.offsetX + 10}px`;
          tooltip.style.top = `${event.offsetY - 36}px`;
          d3.select(this).attr("fill", party.fillHover);
        })
        .on("mouseleave", function (_event: MouseEvent, d) {
          const party = partyFor(d);
          if (!party) return;
          tooltip.style.opacity = "0";
          d3.select(this).attr("fill", party.fill);
        });
    });

    return () => {
      cancelled = true;
    };
  });
</script>

{#if parties.length > 0}
  <div
    bind:this={containerEl}
    class="relative rounded-lg overflow-hidden border border-border/50"
  >
    <svg bind:this={svgEl} style="display: block; width: 100%"></svg>
    <div
      bind:this={tooltipEl}
      class="map-tooltip pointer-events-none absolute rounded px-2 py-1 text-xs font-medium bg-foreground text-background opacity-0 transition-opacity whitespace-nowrap"
      style="top: 0; left: 0"
    ></div>
  </div>
{/if}
