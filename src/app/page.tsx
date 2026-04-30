import { getPosts } from "@/blog";
import { PostsList } from "@/components/PostsList";

export default async function Home() {
  const posts = await getPosts();
  return (
    <main className="max-w-2xl mx-auto px-6 pt-6 pb-14">
      <PostsList posts={posts} />
    </main>
  );
}
