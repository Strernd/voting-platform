import { AdminTable } from "@/components/admin-table";
import { RoundManagement } from "@/components/round-management";
import { CompetitionSettings } from "@/components/competition-settings";
import { BeerRegistration } from "@/components/beer-registration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="scores" className="space-y-6">
        <TabsList>
          <TabsTrigger value="scores">Ergebnisse</TabsTrigger>
          <TabsTrigger value="rounds">Runden</TabsTrigger>
          <TabsTrigger value="registration">Bier-Registrierung</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="scores">
          <AdminTable />
        </TabsContent>

        <TabsContent value="rounds">
          <RoundManagement />
        </TabsContent>

        <TabsContent value="registration">
          <BeerRegistration />
        </TabsContent>

        <TabsContent value="settings">
          <CompetitionSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}