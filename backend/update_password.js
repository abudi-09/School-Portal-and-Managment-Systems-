db.users.updateOne(
  { email: "superadmin@pathways.local" },
  {
    $set: {
      password: "$2b$10$i9Vt4k9YBW9WKNuU1B1rmu6DX7TyURWLThtCeYcQ0E73.lRRwPzzy",
    },
  }
);
