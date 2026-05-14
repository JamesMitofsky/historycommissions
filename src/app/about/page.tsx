export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 pb-14 pt-8">
      <h1 className="text-2xl font-semibold mb-8 text-[var(--foreground)]">About</h1>
      <div className="space-y-5 text-[var(--foreground)] leading-relaxed">
        <p>
          Since the 1990s, there has been a proliferation of efforts to confront
          the &ldquo;difficult past,&rdquo; including cross-national dialogue among historians
          from countries involved in past conflicts. In particular, over twenty bilateral
          Joint Historians&rsquo; Commissions (Ger.{" "}
          <em>Gemeisamen Historiker Kommission</em>) have been set up in Europe and
          elsewhere. They raise important questions about the role of historians and
          historical knowledge in post-conflict resolution and reconciliation between
          nation-states. They also pose challenging questions about the production of
          historical knowledge at a time when universal truth in history is no longer
          self-evident.
        </p>
        <p>
          This forum aims at bringing together information about joint historians&rsquo;
          commissions or other similar endeavors from across the world. Through a
          comparative study of these cross-national dialogues, it is hoped that one
          gains a better understanding of the production of historical knowledge and
          their role in international society today.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-[var(--border)] text-sm text-muted-foreground leading-relaxed">
        <p>
          This project is maintained by{" "}
          <a
            href="https://elliott.gwu.edu/daqing-yang"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-700 transition-colors underline underline-offset-4 decoration-sky-300"
          >
            Professor Daqing Yang
          </a>
          . For questions or other inquiries, please feel free to reach him at{" "}
          <a
            href="mailto:yanghist@gwu.edu"
            className="text-sky-600 hover:text-sky-700 transition-colors underline underline-offset-4 decoration-sky-300"
          >
            yanghist@gwu.edu
          </a>
          .
        </p>
      </div>
    </main>
  );
}
