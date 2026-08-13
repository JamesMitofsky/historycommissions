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

# (source, output stem, formats). The OG renderer needs only the two faces it
# draws with, so only those get a woff alongside the woff2.
TARGETS = [
    ("DMSans-Variable.ttf", "DMSans-Variable", ["woff2"]),
    ("DMSans-Regular.ttf", "DMSans-Regular", ["woff"]),
    ("LibertinusSerif-SemiBold.ttf", "LibertinusSerif-SemiBold", ["woff2"]),
    ("LibertinusSerif-Bold.ttf", "LibertinusSerif-Bold", ["woff2", "woff"]),
]


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
            # Keep the variable axes: DMSans-Variable is the whole 400-700 range
            # the site asks for, and dropping them would flatten it to one weight.
            "--layout-features=*",
            "--no-hinting",
            "--desubroutinize",
        ],
        check=True,
    )
    return out


def main() -> None:
    for filename, stem, flavors in TARGETS:
        source = FONTS / filename
        if not source.exists():
            raise SystemExit(f"missing font source: {source}")
        for flavor in flavors:
            out = subset(source, stem, flavor)
            before = source.stat().st_size / 1024
            after = out.stat().st_size / 1024
            print(f"{out.name}: {before:.0f}kB -> {after:.0f}kB")


if __name__ == "__main__":
    main()
