/**
 * Local Lighthouse runs against the production build.
 *
 * PageSpeed Insights is Lighthouse running on Google's machines, so this is the
 * same audit with the same defaults — mobile form factor, simulated slow 4G,
 * 4x CPU slowdown — without needing the site to be publicly reachable. Numbers
 * will not match a PSI run digit for digit (different CPU, no real network),
 * but the ranking of problems and the direction of a change do carry over,
 * which is what makes it useful while iterating.
 *
 *   pnpm perf                      # build, then audit the default routes
 *   pnpm perf --no-build           # audit dist/ as it stands
 *   pnpm perf --desktop            # desktop form factor instead of mobile
 *   pnpm perf --runs=3             # median of N runs per route (LCP is noisy)
 *   pnpm perf /commissions /about  # audit specific routes
 *
 * Reports land in .lighthouse/ as JSON and HTML; the HTML one is the same
 * report UI PSI shows, openable in a browser for the full waterfall.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";

const DIST = path.resolve("dist");
const OUT_DIR = path.resolve(".lighthouse");
const DEFAULT_ROUTES = ["/", "/commissions", "/about"];

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string, fallback: string) =>
  args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;

const routes = args.filter((a) => a.startsWith("/"));
const RUNS = Number(option("runs", "1"));
const DESKTOP = flag("desktop");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

// Compressible types only. Re-compressing woff2 or webp costs bytes rather than
// saving them, and serving them gzipped would make the measured transfer sizes
// wrong in the opposite direction.
const COMPRESSIBLE = /^(text\/|application\/(json|xml|javascript)|image\/svg)/;

/**
 * Serves dist/ the way a static host does — gzip on text, immutable caching on
 * hashed assets. Both matter: Lighthouse's simulated throttling derives load
 * time from transfer size, so serving 220KB of uncompressed HTML would inflate
 * exactly the numbers this script exists to watch.
 */
function serve(): Promise<{ origin: string; close: () => Promise<void> }> {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    let filePath = path.join(DIST, decodeURIComponent(url.pathname));

    // Astro's static output writes directory-style routes as index.html.
    if (!path.extname(filePath)) filePath = path.join(filePath, "index.html");

    if (!filePath.startsWith(DIST) || !fs.existsSync(filePath)) {
      res.writeHead(404).end("Not found");
      return;
    }

    const type = MIME[path.extname(filePath)] ?? "application/octet-stream";
    const body = fs.readFileSync(filePath);
    const headers: Record<string, string> = {
      "content-type": type,
      "cache-control": filePath.includes(`${path.sep}_astro${path.sep}`)
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate",
    };

    const wantsGzip = (req.headers["accept-encoding"] ?? "").includes("gzip");
    if (wantsGzip && COMPRESSIBLE.test(type)) {
      const gzipped = zlib.gzipSync(body);
      res.writeHead(200, { ...headers, "content-encoding": "gzip" }).end(gzipped);
    } else {
      res.writeHead(200, headers).end(body);
    }
  });

  return new Promise((resolve) => {
    // Port 0 lets the OS pick a free one, so this never collides with a dev
    // server that is already running.
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({
        origin: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

/**
 * The slices of Lighthouse's JSON this script reads.
 *
 * Deliberately partial. The full report type ships with the `lighthouse`
 * package, but pulling it in would tie this script to that package's internals
 * for the sake of six fields — and those internals move: the LCP element audit
 * was renamed out from under this file between major versions. Describing only
 * what is read keeps the coupling to the shape of the data rather than to a
 * version of the tool.
 */
interface LighthouseItem {
  type?: string;
  label?: string;
  duration?: number;
  snippet?: string;
  selector?: string;
  items?: LighthouseItem[];
}

interface LighthouseAudit {
  title: string;
  numericValue?: number;
  details?: {
    type?: string;
    overallSavingsMs?: number;
    items?: LighthouseItem[];
  };
}

interface LighthouseReport {
  categories: { performance: { score: number | null } };
  audits: Record<string, LighthouseAudit>;
}

interface Metrics {
  route: string;
  performance: number;
  lcp: number;
  fcp: number;
  tbt: number;
  cls: number;
  si: number;
  lcpElement: string;
  lcpPhases: { label: string; ms: number }[];
  opportunities: { title: string; savingsMs: number }[];
}

async function audit(
  origin: string,
  route: string,
  run: number,
): Promise<Metrics | null> {
  const slug = route === "/" ? "home" : route.replace(/\//g, "-").slice(1);
  const base = path.join(OUT_DIR, `${slug}${RUNS > 1 ? `-${run}` : ""}`);

  // The CLI rather than the Node API: it owns launching and tearing down Chrome,
  // which is the fiddly part, and its defaults are PSI's defaults.
  //
  // Invoked through its installed binary rather than `npx`, which stops to ask
  // for confirmation when it thinks it needs to fetch the package and then
  // blocks forever on a stdin nobody is attached to.
  //
  // Asynchronously, and this is not a style preference: the static server above
  // runs in this same process, so a synchronous spawn holds the event loop for
  // the whole audit and the server never answers a single request. Lighthouse
  // then waits on a page that cannot load, and the run hangs rather than fails.
  const status = await new Promise<number>((resolve) => {
    const child = spawn(
      path.resolve("node_modules/.bin/lighthouse"),
      [
        `${origin}${route}`,
        "--only-categories=performance",
        ...(DESKTOP ? ["--preset=desktop"] : []),
        "--output=json",
        "--output=html",
        `--output-path=${base}.json`,
        "--chrome-flags=--headless=new --no-sandbox",
        "--quiet",
      ],
      { stdio: ["ignore", "inherit", "inherit"] },
    );
    child.on("close", (code) => resolve(code ?? 1));
  });

  if (status !== 0) return null;

  const report: LighthouseReport = JSON.parse(
    fs.readFileSync(`${base}.report.json`, "utf8"),
  );
  const audits = report.audits;
  const value = (id: string) => audits[id]?.numericValue ?? NaN;

  // The node Lighthouse actually timed as the LCP element, which is the thing
  // worth knowing before optimizing anything — guessing which element wins LCP
  // is how effort ends up spent on the wrong one.
  //
  // Lighthouse 13 reorganised these into "insights" and dropped the older
  // `largest-contentful-paint-element` audit, so the id is looked up rather than
  // assumed; the node arrives as a loose item in the insight's list.
  const lcpItems: LighthouseItem[] =
    audits["lcp-breakdown-insight"]?.details?.items ?? [];
  const lcpNode = lcpItems.find((item) => item?.type === "node");

  // The same insight breaks the measured time into the four phases that make it
  // up. Which phase dominates is what says whether to chase the server, the
  // discovery of the resource, its download, or whatever is holding up the
  // paint after it has arrived.
  const phases = (lcpItems.find((item) => item?.type === "table")?.items ?? [])
    .map((row) => ({ label: String(row.label), ms: Math.round(row.duration ?? 0) }));

  // Read the saving first and carry it, rather than testing it on the audit and
  // reaching back through the optional chain afterwards — the second lookup is
  // what the compiler cannot know is still there.
  const opportunities = Object.values(audits)
    .flatMap((a) => {
      if (a?.details?.type !== "opportunity") return [];
      const savingsMs = a.details.overallSavingsMs ?? 0;
      return savingsMs > 50
        ? [{ title: a.title, savingsMs: Math.round(savingsMs) }]
        : [];
    })
    .sort((a, b) => b.savingsMs - a.savingsMs);

  return {
    route,
    performance: Math.round((report.categories.performance.score ?? 0) * 100),
    lcp: value("largest-contentful-paint"),
    fcp: value("first-contentful-paint"),
    tbt: value("total-blocking-time"),
    cls: value("cumulative-layout-shift"),
    si: value("speed-index"),
    lcpElement: lcpNode?.snippet ?? lcpNode?.selector ?? "unknown",
    lcpPhases: phases,
    opportunities,
  };
}

/** Median, because a single Lighthouse run's LCP swings by tens of percent. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const ms = (n: number) => `${(n / 1000).toFixed(2)}s`;

async function main() {
  if (!flag("no-build")) {
    console.log("→ building…");
    const build = spawnSync("pnpm", ["build"], { stdio: "inherit" });
    if (build.status !== 0) process.exit(build.status ?? 1);
  }

  if (!fs.existsSync(DIST)) {
    console.error("dist/ not found — run without --no-build.");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const { origin, close } = await serve();
  const targets = routes.length ? routes : DEFAULT_ROUTES;
  const summaries: Metrics[] = [];

  try {
    for (const route of targets) {
      const runs: Metrics[] = [];
      for (let i = 0; i < RUNS; i++) {
        console.log(
          `→ auditing ${route}${RUNS > 1 ? ` (run ${i + 1}/${RUNS})` : ""}…`,
        );
        const m = await audit(origin, route, i + 1);
        if (m) runs.push(m);
      }
      if (!runs.length) continue;

      summaries.push({
        ...runs[0],
        performance: Math.round(median(runs.map((r) => r.performance))),
        lcp: median(runs.map((r) => r.lcp)),
        fcp: median(runs.map((r) => r.fcp)),
        tbt: median(runs.map((r) => r.tbt)),
        cls: median(runs.map((r) => r.cls)),
        si: median(runs.map((r) => r.si)),
      });
    }
  } finally {
    await close();
  }

  console.log(`\n${DESKTOP ? "Desktop" : "Mobile"} — median of ${RUNS} run(s)\n`);
  console.table(
    summaries.map((s) => ({
      route: s.route,
      perf: s.performance,
      LCP: ms(s.lcp),
      FCP: ms(s.fcp),
      TBT: `${Math.round(s.tbt)}ms`,
      CLS: s.cls.toFixed(3),
      SI: ms(s.si),
    })),
  );

  for (const s of summaries) {
    console.log(`\n${s.route}`);
    console.log(`  LCP element: ${s.lcpElement.slice(0, 140)}`);
    if (s.lcpPhases.length) {
      console.log(
        `  LCP phases:  ${s.lcpPhases.map((p) => `${p.label} ${p.ms}ms`).join("  |  ")}`,
      );
    }
    if (s.opportunities.length) {
      console.log("  opportunities:");
      for (const o of s.opportunities.slice(0, 6)) {
        console.log(`    ${String(o.savingsMs).padStart(5)}ms  ${o.title}`);
      }
    }
  }

  console.log(`\nFull reports: ${path.relative(process.cwd(), OUT_DIR)}/*.report.html`);
}

main();
