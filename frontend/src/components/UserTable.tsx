import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type UserRow = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function UserTable({
  users,
  onUpgrade,
  showUpgrade,
}: {
  users: UserRow[];
  onUpgrade: (id: string) => void;
  showUpgrade: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Full Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u._id}>
            <TableCell>{`${u.firstName} ${u.lastName}`}</TableCell>
            <TableCell className="font-mono text-sm">{u.email}</TableCell>
            <TableCell>
              <Badge variant="outline">{u.role}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={u.status === "approved" ? "default" : "outline"}>
                {u.status}
              </Badge>
            </TableCell>
            <TableCell>{new Date(u.createdAt).toLocaleString()}</TableCell>
            <TableCell className="text-right">
              {showUpgrade && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onUpgrade(u._id)}
                >
                  Upgrade to Admin
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
