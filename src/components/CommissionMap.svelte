<script module lang="ts">
  import * as topojson from "topojson-client";
  import type { Topology } from "topojson-specification";
  import type { Feature, FeatureCollection, Geometry } from "geojson";

  /**
   * Everything in this block is module-scoped on purpose: it is created once
   * for the page, not once per map. In the instance <script> below, each of the
   * dozens of maps the commissions index renders would get its own copy — its
   * own `worldPromise` to fetch and decode, its own one-slot draw queue — which
   * is precisely the duplication the two comments below exist to prevent.
   */

  /**
   * The world topology is fetched once per page and shared by every map on it —
   * the commissions index renders one card per commission, and without this each
   * would issue its own request for the same 100kB file.
   *
   * It is also *decoded* here rather than in each map. `topojson.feature` rebuilds
   * 177 geometries from ~8k arc points, and the index has one map per commission,
   * so doing it per map meant that work ran dozens of times over.
   *
   * Served from public/ rather than a CDN so the map has no third-party runtime
   * dependency and keeps working offline.
   */
  let worldPromise: Promise<FeatureCollection<Geometry>> | null = null;
  function loadWorld(): Promise<FeatureCollection<Geometry>> {
    worldPromise ??= fetch("/countries-110m.json")
      .then((r) => r.json() as Promise<Topology>)
      .then(
        (t) =>
          topojson.feature(
            t,
            t.objects.countries,
          ) as unknown as FeatureCollection<Geometry>,
      );
    return worldPromise;
  }

  /**
   * Every map on a page becomes drawable in the same microtask, because they all
   * await one shared promise. Projecting and appending the country paths for all
   * of them in a single task blocks the main thread long enough to stutter a
   * running view transition — which is why the maps only jittered when arriving
   * at the index from a commission page, and never on the way out, where a
   * single map is drawn with no list behind it.
   *
   * Draws are queued and drained one slice at a time so the burst yields back to
   * the compositor between maps. The queue is shared for the same reason it is
   * useful at all: a per-map queue would only ever hold that map's own draw and
   * every map would still run in the same frame.
   */
  const drawQueue: (() => void)[] = [];
  let draining = false;
  const nextSlice: (cb: () => void) => void =
    typeof requestIdleCallback === "function"
      ? (cb) => requestIdleCallback(() => cb(), { timeout: 500 })
      : (cb) => requestAnimationFrame(() => cb());

  function enqueueDraw(job: () => void) {
    drawQueue.push(job);
    if (draining) return;
    draining = true;
    const drain = () => {
      drawQueue.shift()?.();
      if (drawQueue.length > 0) nextSlice(drain);
      else draining = false;
    };
    nextSlice(drain);
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
</script>

<script lang="ts">
  import * as d3 from "d3";
  import type { Attachment } from "svelte/attachments";
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

  /**
   * An attachment rather than an `$effect`: d3 owns the contents of the <svg>,
   * which is exactly the "sync state to an external library" case attachments
   * exist for. It also makes the dependencies honest — `currentParties` and
   * `ratio` are arguments, so a change to either re-runs the draw, whereas an
   * effect only tracked what it read *synchronously* and `aspectRatio` was read
   * after the topology `await`, where it went untracked.
   *
   * The container is the attached node, and d3 already works by querying, so
   * the two children it needs are looked up rather than bound into state.
   */
  function drawMap(
    currentParties: Party[],
    ratio: number,
  ): Attachment<HTMLDivElement> {
    return (container) => {
      const svgNode = container.querySelector("svg");
      const tooltip = container.querySelector<HTMLDivElement>(
        "[data-map-tooltip]",
      );
      if (!svgNode || !tooltip) return;

      // Declared with `const` rather than as a hoisted `function`, so the
      // narrowing the guard above established survives into the closure and
      // `svelte-check` does not see `tooltip` as nullable on every use.
      const draw = (allCountries: FeatureCollection<Geometry>) => {
        const width = container.clientWidth || 600;
        const height = Math.round(width * ratio);

        // Only the viewBox is set here. Width and height come from CSS, where
        // the aspect ratio is already reserved before this data arrives —
        // setting a pixel height at this point is what made the map visibly
        // resize once the topology finished loading.
        const svg = d3.select(svgNode);
        svg.selectAll("*").remove();
        svg.attr("viewBox", `0 0 ${width} ${height}`);

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
      };

      let cancelled = false;

      loadWorld().then((allCountries) => {
        if (cancelled) return;
        enqueueDraw(() => {
          if (cancelled) return;

          draw(allCountries);
        });
      });

      return () => {
        cancelled = true;
      };
    };
  }
</script>

{#if parties.length > 0}
  <div
    class="relative rounded-xs overflow-hidden border border-border/50"
    {@attach drawMap(parties, aspectRatio)}
  >
    <!-- aspect-ratio reserves the final height from first paint, so the box does
         not grow when the topology finishes loading. It is the inverse of the
         `aspectRatio` prop, which is height-over-width. The background matches
         the ocean rect d3 draws, so the placeholder and the map are the same
         colour and only the land fades in. -->
    <svg
      style="display: block; width: 100%; aspect-ratio: {1 /
        aspectRatio}; background-color: #EFF4F8"
    ></svg>
    <div
      data-map-tooltip
      class="pointer-events-none absolute rounded-xs px-2 py-1 text-xs font-medium bg-foreground text-background opacity-0 transition-opacity whitespace-nowrap"
      style="top: 0; left: 0"
    ></div>
  </div>
{/if}
