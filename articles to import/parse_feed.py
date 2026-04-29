#!/usr/bin/env python3
"""Parse Blogger feed.atom into per-post Markdown files."""
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from markdownify import markdownify as md

FEED = Path("/Users/jamesmitofsky/Downloads/Takeout/Blogger/Blogs/H I S T O R I A N S   &amp_  R E C O N C I L I A T/feed.atom")
OUT = Path("/Users/jamesmitofsky/Downloads/Takeout/Blogger/posts_markdown")
OUT.mkdir(exist_ok=True)

NS = {"a": "http://www.w3.org/2005/Atom", "b": "http://schemas.google.com/blogger/2018"}

def slugify(s: str) -> str:
    s = re.sub(r"[^\w\s-]", "", s).strip().lower()
    return re.sub(r"[-\s]+", "-", s)[:80] or "untitled"

tree = ET.parse(FEED)
root = tree.getroot()

posts = comments = 0
for entry in root.findall("a:entry", NS):
    etype = entry.findtext("b:type", "", NS)
    if etype != "POST":
        if etype == "COMMENT":
            comments += 1
        continue
    status = entry.findtext("b:status", "", NS)
    if status != "LIVE":
        continue

    title = entry.findtext("a:title", "", NS) or "Untitled"
    published = entry.findtext("a:published", "", NS)
    updated = entry.findtext("a:updated", "", NS)
    author = entry.findtext("a:author/a:name", "", NS)
    content_html = entry.findtext("a:content", "", NS) or ""
    categories = [c.get("term") for c in entry.findall("a:category", NS) if c.get("term")]

    body_md = md(content_html, heading_style="ATX").strip()

    date_prefix = (published or "")[:10]
    fname = f"{date_prefix}-{slugify(title)}.md"

    tags_yaml = "\n".join(f"  - {t}" for t in categories)
    front = [
        "---",
        f'title: "{title.replace(chr(34), chr(39))}"',
        f"date: {published}",
        f"updated: {updated}",
        f"author: {author}",
    ]
    if categories:
        front.append("tags:")
        front.append(tags_yaml)
    front.append("---\n")

    (OUT / fname).write_text("\n".join(front) + "\n" + body_md + "\n", encoding="utf-8")
    posts += 1

print(f"Wrote {posts} posts to {OUT}  (skipped {comments} comments)")
