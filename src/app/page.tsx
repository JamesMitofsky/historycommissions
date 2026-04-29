import Link from "next/link";
import { getPosts } from "@/blog";

export default function Home() {
  const posts = getPosts();

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold mb-12">Posts</h1>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/posts/${post.slug}`}
              className="text-neutral-800 dark:text-neutral-200 hover:underline underline-offset-4"
            >
              {post.slug}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
