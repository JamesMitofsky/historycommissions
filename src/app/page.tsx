import { getPosts } from "@/blog";
import { PostsList } from "@/components/PostsList";

export default function Home() {
  const posts = getPosts();
  return (
    <main className="max-w-2xl mx-auto px-6 pt-6 pb-14">
      <PostsList posts={posts} />
    </main>
  );
}
