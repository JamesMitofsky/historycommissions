import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getPost, getPostSlugs } from "@/blog";
import { Prose } from "@/ui";
import { FlagTag } from "@/ui/FlagTag";

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
    post = getPost(slug);
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
    post = getPost(slug);
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
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors mb-10"
      >
        ← All posts
      </Link>

      <header className="mb-10">
        {post.image && (
          <figure className="mb-6">
            <div className="rounded-lg overflow-hidden bg-[var(--border)] aspect-[16/7]">
              <Image
                src={post.image}
                alt={post.title ?? ""}
                width={672}
                height={294}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            {post.imageAttribution && (
              <figcaption className="mt-1.5 text-xs text-[var(--secondary)] text-right">
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
              </figcaption>
            )}
          </figure>
        )}

        {post.title && (
          <h1 className="text-2xl font-semibold leading-tight text-[var(--foreground)] mb-4">
            {post.title}
          </h1>
        )}
        <div className="flex items-center justify-between text-sm text-[var(--secondary)]">
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

        <div className="mt-8 border-b border-[var(--border)]" />
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
