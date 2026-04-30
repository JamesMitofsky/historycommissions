"use client";

import { CircleFlag } from "react-circle-flags";
import { countryCodeForTag } from "@/lib/country-codes";
import { Chip } from "./Chip";

export function FlagTag({ tag }: { tag: string }) {
  const code = countryCodeForTag(tag);

  return (
    <Chip>
      {code && (
        <CircleFlag
          countryCode={code}
          height={12}
          width={12}
          className="shrink-0 opacity-90"
        />
      )}
      {tag}
    </Chip>
  );
}
