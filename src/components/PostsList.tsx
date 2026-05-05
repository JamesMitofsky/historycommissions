"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Fuse from "fuse.js";
import type { Post } from "@/blog/types";
import { FlagTag } from "@/components/FlagTag";

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
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search posts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--secondary)] focus:outline-none focus:border-[var(--secondary)] transition-colors"
        />
      </div>

      {results.length === 0 ? (
        <p className="text-sm text-[var(--secondary)] py-8">No posts match &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {results.map((post) => {
            const formattedDate = post.date
              ? new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : null;

            return (
              <li key={post.slug}>
                <Link href={`/posts/${post.slug}`} className="group flex items-start gap-4 py-6">
                  {post.image && (
                    <div className="shrink-0 w-48 h-32 rounded overflow-hidden bg-[var(--border)]">
                      <Image
                        src={post.image}
                        alt=""
                        width={192}
                        height={128}
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                        placeholder={post.blurDataURL ? "blur" : "empty"}
                        blurDataURL={post.blurDataURL ?? undefined}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {formattedDate && (
                      <time className="text-xs font-medium tracking-wide uppercase text-[var(--secondary)]">
                        {formattedDate}
                      </time>
                    )}
                    <h2 className="text-[1.05rem] font-semibold leading-snug text-[var(--foreground)] group-hover:opacity-70 transition-opacity">
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
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
