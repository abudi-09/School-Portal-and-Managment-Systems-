import { useMemo } from "react";
import MessagingCenter, { ContactItem } from "@/components/MessagingCenter";

const HeadMessages = () => {
  const contacts = useMemo<ContactItem[]>(
    () => [
      {
        id: 1,
        name: "John Smith",
        role: "Mathematics Teacher",
        unreadCount: 2,
        messages: [
          {
            id: 401,
            sender: "contact",
            text: "Good afternoon, could we review the exam schedule together?",
            timestamp: "1:05 PM",
          },
          {
            id: 402,
            sender: "self",
            text: "Absolutely, let's meet right after lunch in my office.",
            timestamp: "1:07 PM",
          },
          {
            id: 403,
            sender: "contact",
            text: "Perfect, I'll bring the draft copy with me.",
            timestamp: "1:09 PM",
          },
        ],
      },
      {
        id: 2,
        name: "Emily Chen",
        role: "Science Teacher",
        messages: [
          {
            id: 404,
            sender: "contact",
            text: "Field trip permission slips are starting to come in.",
            timestamp: "Today",
          },
        ],
      },
      {
        id: 3,
        name: "Michael Brown",
        role: "History Teacher",
        messages: [],
      },
      {
        id: 4,
        name: "Sofia Martinez",
        role: "English Teacher",
        messages: [],
      },
    ],
    []
  );

  return (
    <MessagingCenter
      title="Staff Messages"
      description="Stay connected with your teaching staff. View ongoing conversations and respond instantly."
      listTitle="Faculty"
      listDescription="Browse staff members to review recent conversations."
      initialContacts={contacts}
      emptyStateMessage="Choose a faculty member to start the discussion."
    />
  );
};

export default HeadMessages;
