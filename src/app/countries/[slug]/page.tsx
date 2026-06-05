import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CircleFlag } from "react-circle-flags";
import { getPosts } from "@/blog";
import { getCommissions } from "@/commissions/get-commissions";
import { FlagTag } from "@/components/FlagTag";
import { BackLink } from "@/components/BackLink";
import { CommissionMap } from "@/components/CommissionMap";
import { StatusBadge } from "@/components/StatusBadge";
import { countryCodeForTag } from "@/lib/country-codes";
import { countrySlug } from "@/lib/country-slug";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getPosts();
  const commissions = getCommissions();
  const slugs = new Set<string>();
  for (const p of posts) for (const t of p.tags) {
    const s = countrySlug(t);
    if (s) slugs.add(s);
  }
  for (const c of commissions) for (const co of c.memberCountries) {
    const s = countrySlug(co);
    if (s) slugs.add(s);
  }
  return Array.from(slugs).map((slug) => ({ slug }));
}

async function resolveCountry(slug: string) {
  const posts = await getPosts();
  const commissions = getCommissions();

  let canonicalName: string | null = null;
  const matchingPosts = posts.filter((p) =>
    p.tags.some((t) => {
      if (countrySlug(t) === slug) {
        if (!canonicalName) canonicalName = t;
        return true;
      }
      return false;
    })
  );
  const matchingCommissions = commissions.filter((c) =>
    c.memberCountries.some((co) => {
      if (countrySlug(co) === slug) {
        if (!canonicalName) canonicalName = co;
        return true;
      }
      return false;
    })
  );

  return { canonicalName, matchingPosts, matchingCommissions };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { canonicalName } = await resolveCountry(slug);
  if (!canonicalName) return {};
  return {
    title: canonicalName,
    description: `Posts and bilateral commissions related to ${canonicalName}.`,
  };
}

function englishName(c: { name: { englishName: string; translations: { language: string; name: string }[] } }) {
  const en = c.name.translations.find((t) => t.language === "en");
  return en?.name ?? c.name.englishName;
}

export default async function CountryPage({ params }: Props) {
  const { slug } = await params;
  const { canonicalName, matchingPosts, matchingCommissions } = await resolveCountry(slug);

  if (!canonicalName || (matchingPosts.length === 0 && matchingCommissions.length === 0)) {
    notFound();
  }

  const code = countryCodeForTag(canonicalName);

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <BackLink href="/">← Home</BackLink>

      <header className="mb-10 flex items-center gap-4">
        {code && (
          <CircleFlag countryCode={code} height={48} width={48} className="shrink-0" />
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Country
          </p>
          <h1 className="text-2xl font-semibold leading-tight font-playfair text-foreground">
            {canonicalName}
          </h1>
        </div>
      </header>

      {matchingPosts.length > 0 && (
        <section className="mb-14">
          <h2 className="text-base font-semibold text-foreground mb-1 font-playfair">
            Posts
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {matchingPosts.length} {matchingPosts.length === 1 ? "post" : "posts"} tagged {canonicalName}.
          </p>
          <ul className="divide-y divide-border/40">
            {matchingPosts.map((post) => {
              const formattedDate = post.date
                ? new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
                : null;
              return (
                <li key={post.slug} className="py-5">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="group flex flex-col sm:flex-row items-start gap-4 sm:gap-6 transition-opacity duration-150 hover:opacity-75"
                  >
                    <div className="flex-1 min-w-0">
                      {formattedDate && (
                        <time className="text-xs text-muted-foreground tabular-nums">
                          {formattedDate}
                        </time>
                      )}
                      <h3 className="mt-0.5 text-base font-semibold leading-snug text-foreground font-playfair">
                        {post.title ?? post.slug}
                      </h3>
                    </div>
                    {post.image && (
                      <div className="relative w-full sm:w-48 h-32 sm:h-[120px] shrink-0 overflow-hidden bg-muted">
                        <Image
                          src={post.image}
                          alt=""
                          fill
                          sizes="192px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          placeholder={post.blurDataURL ? "blur" : "empty"}
                          blurDataURL={post.blurDataURL ?? undefined}
                          unoptimized={post.image.toLowerCase().endsWith(".svg")}
                        />
                      </div>
                    )}
                  </Link>
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <FlagTag key={tag} tag={tag} />
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {matchingCommissions.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-1 font-playfair">
            Bilateral Commissions
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {matchingCommissions.length} {matchingCommissions.length === 1 ? "commission" : "commissions"} involving {canonicalName}.
          </p>
          <div>
            {matchingCommissions.map((c) => (
              <article key={c.slug} className="border-t border-border py-6">
                <Link
                  href={`/commissions/${c.slug}`}
                  className="group flex flex-col sm:flex-row items-start gap-4 sm:gap-6 transition-opacity duration-150 hover:opacity-75"
                >
                  <div className="flex-1 min-w-0">
                    <StatusBadge status={c.status} />
                    <h3 className="mt-1.5 text-[1.05rem] font-semibold leading-snug text-foreground font-playfair">
                      {englishName(c)}
                    </h3>
                    {c.startDate && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Founded {c.startDate.slice(0, 4)}
                      </p>
                    )}
                  </div>
                  {c.memberCountries.length > 0 && (
                    <div className="w-full sm:w-40 shrink-0">
                      <CommissionMap memberCountries={c.memberCountries} aspectRatio={0.6} />
                    </div>
                  )}
                </Link>
                {c.memberCountries.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.memberCountries.map((country) => (
                      <FlagTag key={country} tag={country} />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
