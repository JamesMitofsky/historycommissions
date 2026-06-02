"use client";

import { useState, useMemo, useEffect } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import Fuse from "fuse.js";
import { Info } from "lucide-react";
import type { Post } from "@/blog/types";
import { FlagTag } from "@/components/FlagTag";
import { GooeyInput } from "@/components/ui/gooey-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { navigatingViaViewTransition, setNavigatingViaViewTransition } from "@/lib/navigation-state";

export function PostsList({ posts }: { posts: Post[] }) {
  const [query, setQuery] = useState("");
  const [animate] = useState(!navigatingViaViewTransition);

  useEffect(() => {
    setNavigatingViaViewTransition(false);
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(posts, {
        keys: [
          { name: "title", weight: 1.0 },
          { name: "tags", weight: 0.7 },
          { name: "content", weight: 0.15 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 3,
        includeScore: true,
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
      <div
        className={`flex justify-end items-center gap-2 ${animate ? "animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both" : ""}`}
        style={animate ? { animationDelay: "60ms" } : undefined}
      >
        <GooeyInput
          placeholder="Search..."
          value={query}
          onValueChange={setQuery}
        />
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="About this search"
              className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 size-8 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/50"
            >
              <Info className="size-4" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={6} className="w-72 text-sm leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Fuzzy search</p>
            <p className="text-muted-foreground">
              Matches on post titles, country tags, and content — typos and partial words are forgiven.
              Title matches rank above tag matches, which rank above body matches.
            </p>
          </PopoverContent>
        </Popover>
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
                className={`group py-5 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 ${animate ? "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" : ""}`}
                style={animate ? { animationDelay: `${100 + i * 60}ms` } : undefined}
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/posts/${post.slug}`}
                    transitionTypes={["nav-forward"]}
                    onClick={() => { setNavigatingViaViewTransition(true); }}
                    className="block transition-opacity duration-150 group-hover:opacity-75"
                  >
                    {formattedDate && (
                      <time className="text-xs text-muted-foreground tabular-nums">
                        {formattedDate}
                      </time>
                    )}
                    <ViewTransition name={`post-title-${post.slug}`}>
                      <h2 className="mt-0.5 text-base font-semibold leading-snug text-foreground font-playfair">
                        {post.title ?? post.slug}
                      </h2>
                    </ViewTransition>
                  </Link>
                  {post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <FlagTag key={tag} tag={tag} />
                      ))}
                    </div>
                  )}
                </div>
                {post.image && (
                  <Link
                    href={`/posts/${post.slug}`}
                    transitionTypes={["nav-forward"]}
                    onClick={() => { setNavigatingViaViewTransition(true); }}
                    aria-hidden
                    tabIndex={-1}
                    className="block w-full sm:w-64 shrink-0 transition-opacity duration-150 group-hover:opacity-75"
                  >
                    <ViewTransition name={`post-image-${post.slug}`}>
                      <div className="relative w-full h-48 sm:h-[160px] overflow-hidden bg-muted">
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
                    </ViewTransition>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
