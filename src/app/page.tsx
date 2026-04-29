import Link from "next/link";
import { getPosts } from "@/blog";

export default function Home() {
  const posts = getPosts();

  return (
    <main className="max-w-2xl mx-auto px-6 py-14">
      <ul className="divide-y divide-[var(--border)]">
        {posts.map((post) => {
          const formattedDate = post.date
            ? new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : null;

          return (
            <li key={post.slug}>
              <Link href={`/posts/${post.slug}`} className="group block py-6">
                {formattedDate && (
                  <time className="text-xs font-medium tracking-wide uppercase text-[var(--secondary)]">
                    {formattedDate}
                  </time>
                )}
                <h2 className="mt-1 text-[1.05rem] font-semibold leading-snug text-[var(--foreground)] group-hover:opacity-70 transition-opacity">
                  {post.title ?? post.slug}
                </h2>
                {post.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
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
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
