// Reuse the HeadMessages page component so Admin sees the exact same
// messaging UI, features and behavior as the Head role.
import { useMemo } from "react";
import MessagingCenter, { ContactItem } from "@/components/MessagingCenter";

const AdminMessages = () => {
  const contacts = useMemo<ContactItem[]>(
    () => [
      {
        id: 1,
        name: "Admissions Team",
        role: "Admissions",
        unreadCount: 3,
        messages: [
          {
            id: 9001,
            sender: "contact",
            text: "Review needed for applicant #452",
            timestamp: "8:12 AM",
          },
        ],
      },
      {
        id: 2,
        name: "IT Support",
        role: "Infrastructure",
        messages: [],
      },
      {
        id: 3,
        name: "Finance",
        role: "Accounts",
        messages: [
          {
            id: 9002,
            sender: "contact",
            text: "Monthly budget report posted.",
            timestamp: "Yesterday",
          },
        ],
      },
    ],
    []
  );

  return (
    <MessagingCenter
      title="Admin Messages"
      description="Communicate with staff, IT and departments across the school from the admin console."
      listTitle="Departments & Staff"
      listDescription="Select a contact to view or reply to conversations."
      initialContacts={contacts}
      emptyStateMessage="No conversations yet. Start by selecting a contact."
    />
  );
};

export default AdminMessages;
