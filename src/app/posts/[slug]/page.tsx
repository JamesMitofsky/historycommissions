import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
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
          <div className="mb-6 rounded-lg overflow-hidden bg-[var(--border)] aspect-[16/7]">
            <Image
              src={post.image}
              alt={post.title ?? ""}
              width={672}
              height={294}
              className="w-full h-full object-cover"
              priority
            />
          </div>
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
