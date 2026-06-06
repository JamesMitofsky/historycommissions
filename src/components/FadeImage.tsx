"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type FadeImageProps = Omit<ImageProps, "placeholder"> & {
  blurDataURL?: string;
};

/**
 * next/image swaps its blur placeholder to the sharp image with a hard cut, which
 * reads as a "flash" once network latency makes the blur visible (e.g. prod).
 * This renders the blur as a separate layer underneath and crossfades the sharp
 * image in on load, so there is no abrupt swap.
 */
export function FadeImage({
  className,
  blurDataURL,
  onLoad,
  style,
  ...props
}: FadeImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Cached images may already be complete before onLoad attaches.
  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  return (
    <>
      {blurDataURL && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-out",
            loaded ? "opacity-0" : "opacity-100",
          )}
          style={{ backgroundImage: `url("${blurDataURL}")` }}
        />
      )}
      <Image
        ref={ref}
        {...props}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        className={className}
        style={{
          transitionProperty: "opacity, transform",
          transitionDuration: "700ms, 300ms",
          transitionTimingFunction: "ease-out",
          opacity: loaded ? 1 : 0,
          ...style,
        }}
      />
    </>
  );
}
