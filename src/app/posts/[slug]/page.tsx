import { ViewTransition } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getPost, getPostSlugs } from "@/blog";
import { Prose } from "@/ui";
import { FlagTag } from "@/ui/FlagTag";
import { CommissionMap } from "@/components/CommissionMap";
import { BackLink } from "@/components/BackLink";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let post;
  try {
    post = await getPost(slug);
  } catch {
    return {};
  }

  const description = post.content
    .replace(/^#+\s.+$/gm, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  return {
    title: post.title ?? undefined,
    description: description || undefined,
    openGraph: {
      title: post.title ?? undefined,
      description: description || undefined,
      type: "article",
      ...(post.date && { publishedTime: post.date }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title ?? undefined,
      description: description || undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    post = await getPost(slug);
  } catch {
    notFound();
  }

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <BackLink />

      <header className="mb-10">
        {post.title && (
          <ViewTransition name={`post-title-${post.slug}`}>
            <h1 className="text-2xl font-semibold leading-tight font-playfair text-foreground mb-4">
              {post.title}
            </h1>
          </ViewTransition>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {formattedDate && <time>{formattedDate}</time>}
          {post.author && <span>{post.author}</span>}
        </div>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <FlagTag key={tag} tag={tag} />
            ))}
          </div>
        )}

        {(post.image || post.tags.length > 0) && (
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-stretch sm:min-h-[180px]">
              {post.tags.length > 0 && (
                <div className={post.image ? "sm:flex-[1] min-w-0" : "w-full"}>
                  <CommissionMap memberCountries={post.tags} />
                </div>
              )}
              {post.image && (
                <ViewTransition name={`post-image-${post.slug}`}>
                  <div className={post.tags.length > 0 ? "sm:flex-[2] min-w-0" : "w-full"}>
                    <div className="relative rounded-lg overflow-hidden bg-border h-[200px] sm:h-full">
                      <Image
                        src={post.image}
                        alt={post.title ?? ""}
                        fill
                        sizes="(max-width: 768px) 100vw, 672px"
                        className="object-cover"
                        priority
                        placeholder={post.blurDataURL ? "blur" : "empty"}
                        blurDataURL={post.blurDataURL ?? undefined}
                        unoptimized={post.image.toLowerCase().endsWith(".svg")}
                      />
                    </div>
                  </div>
                </ViewTransition>
              )}
            </div>
            {post.imageAttribution && (
              <p className="mt-1.5 text-xs text-muted-foreground text-right">
                {post.imageAttributionUrl ? (
                  <a
                    href={post.imageAttributionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {post.imageAttribution}
                  </a>
                ) : (
                  post.imageAttribution
                )}{" "}
                (CC BY-SA 3.0)
              </p>
            )}
          </div>
        )}

        <div className="mt-8 border-b border-border" />
      </header>

      <Prose>
        <MDXRemote
          source={post.content}
          options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
        />
      </Prose>
    </main>
  );
}
