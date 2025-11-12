import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  ContactSummaryDto,
  MessageDto,
  RecipientDto,
  fetchInbox,
  fetchRecipients,
  fetchThread,
  markMessageRead,
  sendMessage,
} from "@/lib/api/messagesApi";
import type {
  ContactItem,
  MessageItem,
  UserRole,
} from "@/components/MessagingCenter";
import {
  MessageReadEvent,
  MessageSocketEvent,
  useMessageSocket,
} from "@/hooks/useMessageSocket";

const adaptRole = (role: "admin" | "head" | "teacher"): UserRole => role;

const formatTimestamp = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const buildLastMessage = (
  message?: MessageDto
): ContactItem["lastMessage"] =>
  message
    ? {
        content: message.content,
        timestamp: formatTimestamp(message.timestamp),
        timestampIso: message.timestamp,
        senderRole: adaptRole(message.senderRole),
      }
    : undefined;

const mapMessageDto = (message: MessageDto): MessageItem => ({
  id: message.id,
  senderId: message.senderId,
  senderRole: adaptRole(message.senderRole),
  receiverId: message.receiverId,
  receiverRole: adaptRole(message.receiverRole),
  content: message.content,
  timestamp: formatTimestamp(message.timestamp),
  timestampIso: message.timestamp,
  status: message.status,
});

const contactFromSummary = (summary: ContactSummaryDto): ContactItem => ({
  id: summary.user.id,
  name: summary.user.name,
  role: adaptRole(summary.user.role),
  email: summary.user.email,
  unreadCount: summary.unreadCount,
  lastMessage: buildLastMessage(summary.lastMessage),
  lastMessageAt: summary.lastMessage?.timestamp,
});

const contactFromRecipient = (recipient: RecipientDto): ContactItem => ({
  id: recipient.id,
  name: recipient.name,
  role: adaptRole(recipient.role),
  email: recipient.email,
  unreadCount: 0,
});

const sortContacts = (items: ContactItem[]): ContactItem[] => {
  return [...items].sort((a, b) => {
    const aTime = a.lastMessage?.timestampIso ?? "";
    const bTime = b.lastMessage?.timestampIso ?? "";

    if (aTime && bTime) {
      if (aTime === bTime) {
        return a.name.localeCompare(b.name);
      }
      return bTime.localeCompare(aTime);
    }

    if (aTime) {
      return -1;
    }
    if (bTime) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });
};

interface UseMessagingControllerOptions {
  currentUserId?: string;
  currentUserRole: UserRole;
}

interface MessagingControllerResult {
  contacts: ContactItem[];
  selectedConversationId: string | null;
  messages: MessageItem[];
  messageDraft: string;
  onChangeDraft: (value: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onSendMessage: (conversationId: string, content: string) => Promise<void>;
  isLoadingContacts: boolean;
  isLoadingThread: boolean;
  isSendingMessage: boolean;
  currentUserId?: string;
  currentUserRole: UserRole;
  recipients: RecipientDto[];
  loadRecipients: () => Promise<RecipientDto[] | void>;
  isRecipientsLoading: boolean;
  startConversationWith: (recipient: RecipientDto) => Promise<void>;
  validateContact: (contact: ContactItem) => boolean;
}

export const useMessagingController = ({
  currentUserId,
  currentUserRole,
}: UseMessagingControllerOptions): MessagingControllerResult => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, MessageItem[]>
  >({});
  const [messageDraft, setMessageDraft] = useState("");
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recipients, setRecipients] = useState<RecipientDto[]>([]);
  const [isRecipientsLoading, setIsRecipientsLoading] = useState(false);

  const threadCacheRef = useRef<Set<string>>(new Set());
  const contactsRef = useRef<ContactItem[]>(contacts);
  const selectedConversationRef = useRef<string | null>(selectedConversationId);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const setContactsSorted = useCallback(
    (updater: (prev: ContactItem[]) => ContactItem[]) =>
      setContacts((previous) => sortContacts(updater(previous))),
    []
  );

  const hierarchyAllows = useCallback(
    (recipientRole: UserRole) => {
      switch (currentUserRole) {
        case "teacher":
          return recipientRole === "head";
        case "head":
          return recipientRole === "admin" || recipientRole === "teacher";
        case "admin":
          return recipientRole === "head";
        default:
          return false;
      }
    },
    [currentUserRole]
  );

  const validateContact = useCallback(
    (contact: ContactItem) => hierarchyAllows(contact.role),
    [hierarchyAllows]
  );

  const loadThread = useCallback(
    async (participantId: string, options: { force?: boolean } = {}) => {
      const shouldFetch = options.force || !threadCacheRef.current.has(participantId);

      if (!shouldFetch) {
        setContactsSorted((list) =>
          list.map((contact) =>
            contact.id === participantId
              ? { ...contact, unreadCount: 0 }
              : contact
          )
        );
        return;
      }

      setIsLoadingThread(true);
      try {
        const data = await fetchThread(participantId);
        const mappedMessages = data.messages.map(mapMessageDto);
        threadCacheRef.current.add(participantId);

        setMessagesByConversation((previous) => ({
          ...previous,
          [participantId]: mappedMessages,
        }));

        const participantContact = contactFromRecipient(data.participant);
        participantContact.lastMessage = mappedMessages.length
          ? {
              content: mappedMessages[mappedMessages.length - 1].content,
              timestamp: mappedMessages[mappedMessages.length - 1].timestamp,
              timestampIso:
                mappedMessages[mappedMessages.length - 1].timestampIso,
              senderRole: mappedMessages[mappedMessages.length - 1].senderRole,
            }
          : participantContact.lastMessage;
        participantContact.lastMessageAt =
          mappedMessages[mappedMessages.length - 1]?.timestampIso;

        setContactsSorted((list) => {
          const exists = list.find((contact) => contact.id === participantContact.id);
          const updated: ContactItem = exists
            ? {
                ...exists,
                ...participantContact,
                unreadCount: 0,
              }
            : { ...participantContact, unreadCount: 0 };

          return [
            ...list.filter((contact) => contact.id !== participantId),
            updated,
          ];
        });
      } catch (error) {
        const description =
          error instanceof Error ? error.message : "Failed to load thread.";
        toast({
          title: "Unable to load messages",
          description,
          variant: "destructive",
        });
      } finally {
        setIsLoadingThread(false);
      }
    },
    [setContactsSorted, toast]
  );

  const initializeInbox = useCallback(async () => {
    setIsLoadingContacts(true);
    try {
      const inbox = await fetchInbox();
      const mapped = sortContacts(inbox.map(contactFromSummary));
      setContacts(mapped);

      if (mapped.length > 0) {
        const initialConversationId = mapped[0].id;
        setSelectedConversationId(initialConversationId);
        setMessageDraft("");
        threadCacheRef.current.delete(initialConversationId);
        void loadThread(initialConversationId, { force: true });
      }
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Failed to load inbox.";
      toast({
        title: "Unable to load conversations",
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoadingContacts(false);
    }
  }, [loadThread, toast]);

  useEffect(() => {
    void initializeInbox();
  }, [initializeInbox]);

  const onSelectConversation = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
      setMessageDraft("");
      const existing = contactsRef.current.find(
        (contact) => contact.id === conversationId
      );
      const shouldForce =
        (existing?.unreadCount ?? 0) > 0 ||
        !threadCacheRef.current.has(conversationId);
      if (shouldForce) {
        threadCacheRef.current.delete(conversationId);
      }
      void loadThread(conversationId, { force: shouldForce });
    },
    [loadThread]
  );

  const onSendMessage = useCallback(
    async (conversationId: string, content: string) => {
      setIsSending(true);
      try {
        const response = await sendMessage(conversationId, content);
        const mapped = mapMessageDto(response.message);
        threadCacheRef.current.add(conversationId);

        setMessagesByConversation((previous) => {
          const existing = previous[conversationId] ?? [];
          const nextMessages = [...existing, mapped].sort((a, b) =>
            a.timestampIso.localeCompare(b.timestampIso)
          );
          return {
            ...previous,
            [conversationId]: nextMessages,
          };
        });

        setContactsSorted((list) => {
          const counterpart = response.receiver;
          const existing = list.find((contact) => contact.id === counterpart.id);
          const updated: ContactItem = existing
            ? {
                ...existing,
                name: counterpart.name,
                role: adaptRole(counterpart.role),
                unreadCount: 0,
                lastMessage: {
                  content: mapped.content,
                  timestamp: mapped.timestamp,
                  timestampIso: mapped.timestampIso,
                  senderRole: mapped.senderRole,
                },
                lastMessageAt: mapped.timestampIso,
              }
            : {
                ...contactFromRecipient({
                  id: counterpart.id,
                  name: counterpart.name,
                  role: counterpart.role,
                  email: counterpart.email,
                }),
                unreadCount: 0,
                lastMessage: {
                  content: mapped.content,
                  timestamp: mapped.timestamp,
                  timestampIso: mapped.timestampIso,
                  senderRole: mapped.senderRole,
                },
                lastMessageAt: mapped.timestampIso,
              };

          return [
            ...list.filter((contact) => contact.id !== counterpart.id),
            updated,
          ];
        });
      } catch (error) {
        const description =
          error instanceof Error ? error.message : "Failed to send message.";
        toast({
          title: "Unable to send message",
          description,
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [setContactsSorted, toast]
  );

  const loadRecipientsList = useCallback(async () => {
    setIsRecipientsLoading(true);
    try {
      const data = await fetchRecipients();
      setRecipients(data);
      return data;
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Failed to load recipients.";
      toast({
        title: "Unable to load recipients",
        description,
        variant: "destructive",
      });
    } finally {
      setIsRecipientsLoading(false);
    }
  }, [toast]);

  const startConversationWith = useCallback(
    async (recipient: RecipientDto) => {
      setContactsSorted((list) => {
        const base = contactFromRecipient(recipient);
        const existing = list.find((contact) => contact.id === base.id);
        const updated: ContactItem = existing
          ? {
              ...existing,
              ...base,
              unreadCount: 0,
            }
          : { ...base, unreadCount: 0 };
        return [
          ...list.filter((contact) => contact.id !== base.id),
          updated,
        ];
      });
      setSelectedConversationId(recipient.id);
      setMessageDraft("");
      threadCacheRef.current.delete(recipient.id);
      setMessagesByConversation((previous) => ({
        ...previous,
        [recipient.id]: previous[recipient.id] ?? [],
      }));
      await loadThread(recipient.id, { force: true });
    },
    [loadThread, setContactsSorted]
  );

  const handleSocketMessage = useCallback(
    async (payload: MessageSocketEvent, direction: "incoming" | "outgoing") => {
      const { message, sender, receiver } = payload;
      const counterpart = direction === "incoming" ? sender : receiver;
      const conversationId = counterpart.id;
      const mapped = mapMessageDto(message as MessageDto);

      threadCacheRef.current.add(conversationId);

      setMessagesByConversation((previous) => {
        const existing = previous[conversationId] ?? [];
        if (existing.some((item) => item.id === mapped.id)) {
          return previous;
        }

        const isActive = selectedConversationRef.current === conversationId;
        const appended: MessageItem =
          direction === "incoming" && isActive
            ? { ...mapped, status: "read" as const }
            : mapped;

        const next = [...existing, appended].sort((a, b) =>
          a.timestampIso.localeCompare(b.timestampIso)
        );

        return {
          ...previous,
          [conversationId]: next,
        };
      });

      setContactsSorted((list) => {
        const existing = list.find((contact) => contact.id === conversationId);
        const updated: ContactItem = existing
          ? {
              ...existing,
              name: counterpart.name ?? existing.name,
              role: adaptRole(counterpart.role),
              unreadCount:
                direction === "incoming" &&
                selectedConversationRef.current !== conversationId
                  ? (existing.unreadCount ?? 0) + 1
                  : 0,
              lastMessage: {
                content: mapped.content,
                timestamp: mapped.timestamp,
                timestampIso: mapped.timestampIso,
                senderRole: mapped.senderRole,
              },
              lastMessageAt: mapped.timestampIso,
            }
          : {
              id: counterpart.id,
              name: counterpart.name,
              role: adaptRole(counterpart.role),
              unreadCount:
                direction === "incoming" &&
                selectedConversationRef.current !== conversationId
                  ? 1
                  : 0,
              lastMessage: {
                content: mapped.content,
                timestamp: mapped.timestamp,
                timestampIso: mapped.timestampIso,
                senderRole: mapped.senderRole,
              },
            };

        return [
          ...list.filter((contact) => contact.id !== conversationId),
          updated,
        ];
      });

      if (
        direction === "incoming" &&
        selectedConversationRef.current === conversationId
      ) {
        try {
          await markMessageRead(message.id);
        } catch (error) {
          console.warn("Failed to mark message as read", error);
        }
      }
    },
    [setContactsSorted]
  );

  const handleMessagesRead = useCallback((payload: MessageReadEvent) => {
    const counterpartId = payload.readerId;
    setMessagesByConversation((previous) => {
      const existing = previous[counterpartId];
      if (!existing) {
        return previous;
      }
      const updated = existing.map((item) =>
        payload.messageIds.includes(item.id)
          ? { ...item, status: "read" as const }
          : item
      );
      return {
        ...previous,
        [counterpartId]: updated,
      };
    });
  }, []);

  useMessageSocket({
    onIncomingMessage: (payload) => handleSocketMessage(payload, "incoming"),
    onMessageSent: (payload) => handleSocketMessage(payload, "outgoing"),
    onMessagesRead: handleMessagesRead,
  });

  const messages = useMemo(() => {
    if (!selectedConversationId) {
      return [];
    }
    return messagesByConversation[selectedConversationId] ?? [];
  }, [messagesByConversation, selectedConversationId]);

  return {
    contacts,
    selectedConversationId,
    messages,
    messageDraft,
    onChangeDraft: setMessageDraft,
    onSelectConversation,
    onSendMessage,
    isLoadingContacts,
    isLoadingThread,
    isSendingMessage: isSending,
    currentUserId,
    currentUserRole,
    recipients,
    loadRecipients: loadRecipientsList,
    isRecipientsLoading,
    startConversationWith,
    validateContact,
  };
};
