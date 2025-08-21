import { AdminTable } from "@/components/admin-table";
import { RoundManagement } from "@/components/round-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="scores" className="space-y-6">
        <TabsList>
          <TabsTrigger value="scores">Scores Overview</TabsTrigger>
          <TabsTrigger value="rounds">Round Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scores">
          <AdminTable />
        </TabsContent>
        
        <TabsContent value="rounds">
          <RoundManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}