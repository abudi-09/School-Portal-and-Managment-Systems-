import { useMemo } from "react";
import MessagingCenter, { ContactItem } from "@/components/MessagingCenter";

const TeacherMessages = () => {
  const contacts = useMemo<ContactItem[]>(
    () => [
      {
        id: 1,
        name: "Mr. Johnson",
        role: "Mathematics",
        unreadCount: 0,
        messages: [
          {
            id: 101,
            sender: "self",
            text: "Hello Mr. Johnson, I have a question about the homework.",
            timestamp: "2:30 PM",
          },
          {
            id: 102,
            sender: "contact",
            text: "Hi John! Of course, what would you like to know?",
            timestamp: "2:32 PM",
          },
          {
            id: 103,
            sender: "self",
            text: "I'm having trouble with question 5 in Chapter 5.",
            timestamp: "2:35 PM",
          },
          {
            id: 104,
            sender: "contact",
            text: "Let me help you with that. Question 5 involves applying the quadratic formula...",
            timestamp: "2:38 PM",
          },
        ],
      },
      {
        id: 2,
        name: "Ms. Davis",
        role: "Science",
        unreadCount: 2,
        messages: [
          {
            id: 201,
            sender: "contact",
            text: "Could you share the lab instructions with my class?",
            timestamp: "11:15 AM",
          },
        ],
      },
      {
        id: 3,
        name: "Mrs. Smith",
        role: "English",
        unreadCount: 1,
        messages: [
          {
            id: 301,
            sender: "contact",
            text: "Reminder: Staff meeting tomorrow at 9 AM.",
            timestamp: "Yesterday",
          },
        ],
      },
      {
        id: 4,
        name: "Mr. Brown",
        role: "History",
        messages: [],
      },
    ],
    []
  );

  return (
    <MessagingCenter
      title="Messages"
      description="Coordinate with your colleagues and keep conversations organized in one place."
      listTitle="Teachers"
      listDescription="Select a teacher to view the conversation thread."
      initialContacts={contacts}
      emptyStateMessage="Start collaborating by sending your first message."
    />
  );
};

export default TeacherMessages;
