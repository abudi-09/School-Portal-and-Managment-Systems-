import { GenericTable, type ColumnDef } from "@/components/GenericTable";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

const sampleUsers: User[] = Array.from({ length: 17 }).map((_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 2 === 0 ? "ADMIN" : "TEACHER",
}));

const columns: ColumnDef<User>[] = [
  { header: "ID", cell: (u) => <span className="font-mono">{u.id}</span> },
  { header: "Name", cell: (u) => u.name },
  { header: "Email", cell: (u) => u.email },
  { header: "Role", cell: (u) => u.role },
];

// Example usage component; not mounted by default, for reference
export default function ExampleTable() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Example Paginated Table</h2>
      <GenericTable<User> data={sampleUsers} columns={columns} rowsPerPage={6} />
    </div>
  );
}
