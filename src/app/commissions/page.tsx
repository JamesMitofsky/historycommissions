import { getCommissions } from "@/commissions/get-commissions";
import { CommissionsClient } from "./CommissionsClient";

export default function CommissionsPage() {
  const commissions = getCommissions();

  return (
    <main className="max-w-2xl mx-auto px-6 pb-14 pt-8">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Bilateral Commissions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {commissions.length}{" "}bilateral historians&apos; commissions
        </p>
      </div>
      <CommissionsClient commissions={commissions} />
    </main>
  );
}
