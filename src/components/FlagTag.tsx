"use client";

import Link from "next/link";
import { CircleFlag } from "react-circle-flags";
import { countryCodeForTag } from "@/lib/country-codes";
import { countrySlug } from "@/lib/country-slug";
import { Chip } from "./Chip";

interface FlagTagProps {
  tag: string;
  asLink?: boolean;
}

export function FlagTag({ tag, asLink = true }: FlagTagProps) {
  const code = countryCodeForTag(tag);

  const chipChildren = (
    <>
      {code && (
        <CircleFlag
          countryCode={code}
          height={12}
          width={12}
          className="shrink-0 opacity-90"
        />
      )}
      {tag}
    </>
  );

  if (!asLink) {
    return <Chip>{chipChildren}</Chip>;
  }

  return (
    <Link
      href={`/countries/${countrySlug(tag)}`}
      className="group inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/50"
      aria-label={`View posts and commissions related to ${tag}`}
    >
      <Chip interactive>{chipChildren}</Chip>
    </Link>
  );
}
