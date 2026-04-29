import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getPost, getPostSlugs } from "@/blog";
import { Prose } from "@/ui";

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

      <header className="mb-10 pb-8 border-b border-[var(--border)]">
        {post.title && (
          <h1 className="text-2xl font-semibold leading-tight text-[var(--foreground)] mb-4">
            {post.title}
          </h1>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--secondary)]">
          {formattedDate && <time>{formattedDate}</time>}
          {post.author && <span>By {post.author}</span>}
        </div>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
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
