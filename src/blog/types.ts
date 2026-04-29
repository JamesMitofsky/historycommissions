export type Post = {
  slug: string;
  content: string;
  title: string | null;
  date: string | null;
  updated: string | null;
  author: string | null;
  tags: string[];
};
