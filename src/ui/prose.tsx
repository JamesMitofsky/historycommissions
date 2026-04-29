import type { ReactNode } from "react";

export const Prose = ({ children }: { children: ReactNode }) => (
  <div className="prose prose-neutral max-w-none dark:prose-invert">
    {children}
  </div>
);
