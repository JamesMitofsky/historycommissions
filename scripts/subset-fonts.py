"""Subset the vendored font sources into what actually ships.

Astro's font pipeline does not transcode or subset: it hashes whatever the
provider hands it and writes the @font-face rules. With a remote provider that
was fine, because Google and Fontsource serve pre-subset woff2 — but pointing
the local provider at the .ttf originals published 1.13MB of unsubset TrueType.

So the subsetting that Fontsource used to do upstream happens here instead, once,
and the results are committed. Run it again only when a font source is replaced:

    python3 scripts/subset-fonts.py

Two formats come out of it, because two consumers disagree:

  * woff2 for the site, which is what the browser downloads.
  * woff for the OG card renderer — satori reads ttf/otf/woff and not woff2.

The character set is Latin plus Latin Extended, which covers the diacritics in
the European commission and place names throughout the content. Anything outside
it falls back to the system face named in `fallbacks`, which is the normal
behaviour for a subset font and what the remote providers did too.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

FONTS = Path(__file__).resolve().parent.parent / "src/assets/fonts"

# Google Fonts' own latin and latin-ext ranges, concatenated. Keeping their
# exact definition means the subset matches what the site shipped when it was
# served from Google, so nothing that rendered before stops rendering.
UNICODES = ",".join(
    [
        # latin
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC",
        "U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191",
        "U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
        # latin-ext
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF",
        "U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0",
        "U+2113,U+2C60-2C7F,U+A720-A7FF",
    ]
)

# Variable axis limits, applied before subsetting.
#
# DM Sans's source carries `wght` over 100-1000, and every weight in that range
# costs deltas in `gvar` whether or not a stylesheet can reach it. The @font-face
# in astro.config.mjs declares `400 700`, which is all the UI uses — 400 body,
# 500 `font-medium`, 600 `font-semibold`, 700 `font-bold` — so the rest is weight
# nothing can render. Clamping to the declared range took the file from 82kB to
# 42kB.
#
# The `opsz` axis is deliberately left alone, and that is a judgement rather than
# an oversight: pinning it would save a further ~15kB, but browsers default to
# `font-optical-sizing: auto`, so today the 30px headings, 20px body and 16px nav
# each get outlines drawn for their own size, and pinning freezes all three at
# one value. The saving is real and so is the change in how the type looks —
# revisit it as a design decision, not a build tweak.
AXIS_LIMITS = {
    "DMSans-Variable.ttf": ["wght=400:700"],
}

# (source, output stem, formats). The OG renderer needs only the two faces it
# draws with, so only those get a woff alongside the woff2.
TARGETS = [
    ("DMSans-Variable.ttf", "DMSans-Variable", ["woff2"]),
    ("DMSans-Regular.ttf", "DMSans-Regular", ["woff"]),
    ("LibertinusSerif-SemiBold.ttf", "LibertinusSerif-SemiBold", ["woff2"]),
    ("LibertinusSerif-Bold.ttf", "LibertinusSerif-Bold", ["woff2", "woff"]),
]


def restrict_axes(source: Path, limits: list[str], workdir: Path) -> Path:
    """Narrow a variable font's axes to the range the site can actually reach.

    Separate from subsetting because fontTools splits the two jobs: `subset`
    works on glyphs and tables, `varLib.instancer` on the design space. Running
    the instancer first means the subsetter is handed a smaller `gvar` to carry
    through.
    """
    out = workdir / f"instanced-{source.name}"
    subprocess.run(
        [sys.executable, "-m", "fontTools.varLib.instancer", str(source), *limits,
         "-o", str(out)],
        check=True,
        stdout=subprocess.DEVNULL,
    )
    return out


def subset(source: Path, stem: str, flavor: str) -> Path:
    out = FONTS / f"{stem}.{flavor}"
    subprocess.run(
        [
            sys.executable,
            "-m",
            "fontTools.subset",
            str(source),
            f"--unicodes={UNICODES}",
            f"--flavor={flavor}",
            f"--output-file={out}",
            # No `--layout-features` at all, which leaves the subsetter's own
            # default set: the features a browser applies to ordinary running
            # text — kern, liga, calt, clig, ccmp, locl, mark, mkmk.
            #
            # It used to be `*`, meaning keep everything the source defines. For
            # DM Sans that is aalt, case, frac, numr, dnom, ordn, sups and eight
            # stylistic sets, none of which any stylesheet here selects, and none
            # of which a browser will turn on by itself. Roughly 8kB of lookup
            # tables downloaded to be ignored.
            #
            # Worth knowing before reaching for a feature: the two `tabular-nums`
            # dates on the site are a no-op either way, because DM Sans does not
            # define `tnum` at all. Its digits are already uniform in width, so
            # the class costs nothing and changes nothing.
            #
            # If a feature is ever wanted back, the append syntax is
            # `--layout-features+=tnum`. Written as `--layout-features=+tnum` it
            # *replaces* the default set with a name that matches nothing, and
            # the font ships with no kerning at all — which is exactly what one
            # revision of this file did.
            "--no-hinting",
            "--desubroutinize",
        ],
        check=True,
    )
    return out


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        workdir = Path(tmp)
        for filename, stem, flavors in TARGETS:
            source = FONTS / filename
            if not source.exists():
                raise SystemExit(f"missing font source: {source}")

            original_size = source.stat().st_size / 1024
            limits = AXIS_LIMITS.get(filename)
            # The instanced copy is a build intermediate, not something to
            # commit — the .ttf beside the output stays the untouched original,
            # so re-running this is always reproducible from the real source.
            prepared = restrict_axes(source, limits, workdir) if limits else source

            for flavor in flavors:
                out = subset(prepared, stem, flavor)
                after = out.stat().st_size / 1024
                print(f"{out.name}: {original_size:.0f}kB -> {after:.0f}kB")


if __name__ == "__main__":
    main()
