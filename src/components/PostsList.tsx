"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Fuse from "fuse.js";
import type { Post } from "@/blog/types";
import { FlagTag } from "@/components/FlagTag";
import { GooeyInput } from "@/components/ui/gooey-input";

export function PostsList({ posts }: { posts: Post[] }) {
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(posts, {
        keys: [
          { name: "title", weight: 0.7 },
          { name: "content", weight: 0.3 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [posts]
  );

  const results = query.trim()
    ? fuse.search(query)
      .sort((a, b) => {
        const scoreDiff = (a.score ?? 0) - (b.score ?? 0);
        if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
        const aDate = typeof a.item.date === "string" ? a.item.date : a.item.date?.toISOString() ?? "";
        const bDate = typeof b.item.date === "string" ? b.item.date : b.item.date?.toISOString() ?? "";
        return bDate.localeCompare(aDate);
      })
      .map((r) => r.item)
    : posts;

  return (
    <div>
      <div className="flex justify-end">
        <GooeyInput
          placeholder="Search..."
          value={query}
          onValueChange={setQuery}
        />
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">No posts match &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="divide-y divide-border/40">
          {results.map((post, i) => {
            const formattedDate = post.date
              ? new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
              : null;

            return (
              <li
                key={post.slug}
                style={{ animationDelay: `${100 + i * 60}ms` }}
                className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
              >
                <Link
                  href={`/posts/${post.slug}`}
                  className="group flex items-start gap-6 py-5 transition-opacity duration-150 hover:opacity-75"
                >
                  <div className="flex-1 min-w-0">
                    {formattedDate && (
                      <time className="text-xs text-muted-foreground tabular-nums">
                        {formattedDate}
                      </time>
                    )}
                    <h2 className="mt-0.5 text-base font-semibold leading-snug text-foreground" style={{ fontFamily: "var(--font-playfair)" }}>
                      {post.title ?? post.slug}
                    </h2>
                    {post.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <FlagTag key={tag} tag={tag} />
                        ))}
                      </div>
                    )}
                  </div>
                  {post.image && (
                    <div className="relative shrink-0 w-64 h-[160px] overflow-hidden bg-muted">
                      <Image
                        src={post.image}
                        alt=""
                        fill
                        sizes="256px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        placeholder={post.blurDataURL ? "blur" : "empty"}
                        blurDataURL={post.blurDataURL ?? undefined}
                        unoptimized={post.image.toLowerCase().endsWith(".svg")}
                      />
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
