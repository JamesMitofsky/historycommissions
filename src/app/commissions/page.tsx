import { getCommissions } from "@/commissions/get-commissions";
import { CommissionsClient } from "./CommissionsClient";

export default function CommissionsPage() {
  const commissions = getCommissions();

  return (
    <main className="max-w-2xl mx-auto px-6 pb-14 pt-8">
      <CommissionsClient commissions={commissions} />
    </main>
  );
}
