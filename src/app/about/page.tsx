import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getAboutSettings } from "@/settings";
import { Prose } from "@/ui";

export function generateMetadata(): Metadata {
  return { title: getAboutSettings().title };
}

export default function AboutPage() {
  const about = getAboutSettings();

  return (
    <main className="max-w-2xl mx-auto px-6 pb-14 pt-8">
      <h1
        style={{ animationDelay: "60ms" }}
        className="text-2xl font-semibold mb-8 text-foreground animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both font-playfair"
      >
        {about.title}
      </h1>

      <div
        style={{ animationDelay: "140ms" }}
        className="animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both"
      >
        <Prose>
          <MDXRemote
            source={about.body}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </Prose>
      </div>

      <div
        style={{ animationDelay: "320ms" }}
        className="mt-12 pt-8 border-t border-border text-sm text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both"
      >
        <Prose>
          <MDXRemote
            source={about.contact}
            options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
          />
        </Prose>
      </div>
    </main>
  );
}
