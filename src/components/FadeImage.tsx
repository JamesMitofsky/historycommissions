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
 * This renders the blur as a separate, always-opaque layer underneath and fades
 * the sharp image in on top of it. Only the sharp layer animates, so there is no
 * transparent dip (the blur is never faded out from under it).
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
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
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
          transitionDuration: "500ms, 300ms",
          transitionTimingFunction: "ease-out",
          opacity: loaded ? 1 : 0,
          ...style,
        }}
      />
    </>
  );
}
