import { AdminTable } from "@/components/admin-table";

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <AdminTable />
    </div>
  );
}