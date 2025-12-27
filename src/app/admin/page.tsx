import { AdminTable } from "@/components/admin-table";
import { RoundManagement } from "@/components/round-management";
import { CompetitionSettings } from "@/components/competition-settings";
import { BeerRegistration } from "@/components/beer-registration";
import { AdminSidebar } from "@/components/admin-sidebar";
import { isVotingEnabled, getActiveRound } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const votingEnabled = await isVotingEnabled();
  const activeRound = await getActiveRound();

  return (
    <div className="dark min-h-screen bg-background">
      <AdminSidebar votingEnabled={votingEnabled} activeRound={activeRound}>
        <div className="space-y-6">
          {/* Content is rendered based on active tab via client-side state */}
        </div>
      </AdminSidebar>
    </div>
  );
}