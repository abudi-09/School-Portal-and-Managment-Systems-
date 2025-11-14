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
  uploadMessageFile,
} from "@/lib/api/messagesApi";
import type {
  ContactItem,
  MessageItem,
  UserRole,
} from "@/components/MessagingCenter";
import {
  MessageDeletedEvent,
  MessageReadEvent,
  MessageSeenUpdateEvent,
  MessageSocketEvent,
  MessageUpdateEvent,
  SocketMessagePayload,
  UserStatusEvent,
  UserStatusInitEvent,
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

type Summarizable = Pick<
  MessageDto | SocketMessagePayload,
  "type" | "deleted" | "content" | "fileName" | "replyTo" | "replyToDeleted"
>;

const summarizeMessage = (message: Summarizable) => {
  if (message.deleted) {
    return "This message was deleted.";
  }

  if (message.replyToDeleted) {
    return "Replied to a deleted message";
  }

  if (message.replyTo) {
    const target = message.replyTo;
    return `Reply to ${target.senderName}: ${target.snippet}`;
  }

  switch (message.type) {
    case "image":
      return message.content || "Image";
    case "doc":
      return message.fileName || "Document";
    case "file":
      return message.fileName || "File";
    default:
      return message.content;
  }
};

const determineMessageType = (file: File): MessageDto["type"] => {
  const mime = file.type.toLowerCase();
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (
    mime.startsWith("image/") ||
    ["jpg", "jpeg", "png"].includes(extension ?? "")
  ) {
    return "image";
  }

  const docExtensions = ["pdf", "doc", "docx", "ppt", "pptx"]; // map to doc type
  if (docExtensions.includes(extension ?? "")) {
    return "doc";
  }

  return "file";
};

const buildLastMessage = (message?: MessageDto): ContactItem["lastMessage"] =>
  message
    ? {
        content: summarizeMessage(message),
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
  type: message.type,
  fileUrl: message.fileUrl,
  fileName: message.fileName,
  deleted: message.deleted,
  editedAt: message.editedAt,
  deliveredTo: message.deliveredTo ?? [],
  seenBy: message.seenBy ?? [],
  threadKey: message.threadKey,
  preview: summarizeMessage(message),
  replyToMessageId: message.replyToMessageId,
  replyTo: message.replyTo,
  replyToDeleted: message.replyToDeleted,
});

const mapSocketMessage = (message: SocketMessagePayload): MessageItem => ({
  id: message.id,
  senderId: message.senderId,
  senderRole: adaptRole(message.senderRole),
  receiverId: message.receiverId,
  receiverRole: adaptRole(message.receiverRole),
  content: message.content,
  timestamp: formatTimestamp(message.timestamp),
  timestampIso: message.timestamp,
  status: message.status,
  type: message.type,
  fileUrl: message.fileUrl,
  fileName: message.fileName,
  deleted: message.deleted,
  editedAt: message.editedAt,
  deliveredTo: message.deliveredTo ?? [],
  seenBy: message.seenBy ?? [],
  threadKey: message.threadKey,
  preview: summarizeMessage(message),
  replyToMessageId: message.replyToMessageId,
  replyTo: message.replyTo,
  replyToDeleted: message.replyToDeleted,
});

const contactFromSummary = (summary: ContactSummaryDto): ContactItem => ({
  id: summary.user.id,
  name: summary.user.name,
  role: adaptRole(summary.user.role),
  email: summary.user.email,
  online: summary.user.online,
  unreadCount: summary.unreadCount,
  lastMessage: buildLastMessage(summary.lastMessage),
  lastMessageAt: summary.lastMessage?.timestamp,
});

const contactFromRecipient = (recipient: RecipientDto): ContactItem => ({
  id: recipient.id,
  name: recipient.name,
  role: adaptRole(recipient.role),
  email: recipient.email,
  online: recipient.online,
  unreadCount: 0,
});

type OutgoingMessagePayload = {
  content?: string;
  type?: MessageDto["type"];
  file?: File;
  fileUrl?: string;
  fileName?: string;
  replyToMessageId?: string;
};

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
  onSendMessage: (
    conversationId: string,
    payload: OutgoingMessagePayload
  ) => Promise<void>;
  onEditMessage: (
    conversationId: string,
    messageId: string,
    content: string
  ) => Promise<void>;
  onDeleteMessage: (
    conversationId: string,
    messageId: string,
    options?: { forEveryone?: boolean }
  ) => Promise<void>;
  isLoadingContacts: boolean;
  isLoadingThread: boolean;
  isSendingMessage: boolean;
  isUploadingAttachment: boolean;
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
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const threadCacheRef = useRef<Set<string>>(new Set());
  const contactsRef = useRef<ContactItem[]>(contacts);
  const selectedConversationRef = useRef<string | null>(selectedConversationId);
  const messagesRef = useRef<Record<string, MessageItem[]>>({});
  const onlineUsersRef = useRef<Set<string>>(new Set());
  const emitSeenRef = useRef<
    ((messageIds: string[], threadKey?: string) => Promise<unknown>) | undefined
  >(undefined);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {
    selectedConversationRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    messagesRef.current = messagesByConversation;
  }, [messagesByConversation]);

  const setContactsSorted = useCallback(
    (updater: (prev: ContactItem[]) => ContactItem[]) =>
      setContacts((previous) => sortContacts(updater(previous))),
    []
  );

  const applyPresence = useCallback(
    (userId: string, online: boolean) => {
      if (online) {
        onlineUsersRef.current.add(userId);
      } else {
        onlineUsersRef.current.delete(userId);
      }

      setContactsSorted((list) =>
        list.map((contact) =>
          contact.id === userId ? { ...contact, online } : contact
        )
      );

      setRecipients((previous) =>
        previous.map((recipient) =>
          recipient.id === userId ? { ...recipient, online } : recipient
        )
      );
    },
    [setContactsSorted]
  );

  const handleUserStatusInit = useCallback(
    (payload: UserStatusInitEvent) => {
      onlineUsersRef.current = new Set(payload.online);

      setContactsSorted((list) =>
        list.map((contact) => ({
          ...contact,
          online: onlineUsersRef.current.has(contact.id),
        }))
      );

      setRecipients((previous) =>
        previous.map((recipient) => ({
          ...recipient,
          online: onlineUsersRef.current.has(recipient.id),
        }))
      );
    },
    [setContactsSorted]
  );

  const handleUserStatus = useCallback(
    (payload: UserStatusEvent) => {
      applyPresence(payload.userId, payload.online);
    },
    [applyPresence]
  );

  const upsertConversationMessage = useCallback(
    (conversationId: string, message: MessageItem) => {
      setMessagesByConversation((previous) => {
        const existing = previous[conversationId] ?? [];
        const byId = new Map(existing.map((item) => [item.id, item]));
        const current = byId.get(message.id);
        byId.set(message.id, { ...current, ...message });
        const sorted = Array.from(byId.values()).sort((a, b) =>
          a.timestampIso.localeCompare(b.timestampIso)
        );
        return {
          ...previous,
          [conversationId]: sorted,
        };
      });
    },
    []
  );

  const mutateConversationMessages = useCallback(
    (
      conversationId: string,
      mutator: (messages: MessageItem[]) => MessageItem[]
    ) => {
      setMessagesByConversation((previous) => {
        const existing = previous[conversationId] ?? [];
        return {
          ...previous,
          [conversationId]: mutator(existing),
        };
      });
    },
    []
  );

  const updateContactAfterMessage = useCallback(
    (
      conversationId: string,
      message: MessageItem,
      counterpart: RecipientDto,
      options: { incrementUnread: boolean }
    ) => {
      setContactsSorted((list) => {
        const existing = list.find((contact) => contact.id === conversationId);
        const online =
          existing?.online ?? onlineUsersRef.current.has(conversationId);
        const unreadCount = options.incrementUnread
          ? (existing?.unreadCount ?? 0) + 1
          : 0;

        const next: ContactItem = existing
          ? {
              ...existing,
              name: counterpart.name,
              role: adaptRole(counterpart.role),
              email: counterpart.email,
              online,
              unreadCount,
              lastMessage: {
                content: message.preview ?? message.content,
                timestamp: message.timestamp,
                timestampIso: message.timestampIso,
                senderRole: message.senderRole,
              },
              lastMessageAt: message.timestampIso,
            }
          : {
              id: conversationId,
              name: counterpart.name,
              role: adaptRole(counterpart.role),
              email: counterpart.email,
              online,
              unreadCount,
              lastMessage: {
                content: message.preview ?? message.content,
                timestamp: message.timestamp,
                timestampIso: message.timestampIso,
                senderRole: message.senderRole,
              },
              lastMessageAt: message.timestampIso,
            };

        return [
          ...list.filter((contact) => contact.id !== conversationId),
          next,
        ];
      });
    },
    [setContactsSorted]
  );

  const markConversationSeen = useCallback(
    (conversationId: string) => {
      if (!currentUserId) {
        return;
      }

      const messages = messagesRef.current[conversationId] ?? [];
      const unseen = messages.filter(
        (message) =>
          message.receiverId === currentUserId &&
          !message.seenBy.includes(currentUserId)
      );

      if (unseen.length === 0) {
        return;
      }

      const messageIds = unseen.map((message) => message.id);
      const threadKey = unseen[0]?.threadKey;

      mutateConversationMessages(conversationId, (previous) =>
        previous.map((message) =>
          messageIds.includes(message.id)
            ? {
                ...message,
                status: "read",
                seenBy: Array.from(new Set([...message.seenBy, currentUserId])),
              }
            : message
        )
      );

      setContactsSorted((list) =>
        list.map((contact) =>
          contact.id === conversationId
            ? { ...contact, unreadCount: 0 }
            : contact
        )
      );

      emitSeenRef.current?.(messageIds, threadKey).catch(() => undefined);
    },
    [currentUserId, mutateConversationMessages, setContactsSorted]
  );

  const resolveConversationId = useCallback(
    (message: {
      senderId: string;
      receiverId: string;
      senderRole: UserRole;
      receiverRole: UserRole;
    }) => {
      const isSelf = currentUserId
        ? message.senderId === currentUserId
        : message.senderRole === currentUserRole;
      return isSelf ? message.receiverId : message.senderId;
    },
    [currentUserId, currentUserRole]
  );

  const handleMessageEvent = useCallback(
    (payload: MessageSocketEvent) => {
      const mapped = mapSocketMessage(payload.message);
      const conversationId = resolveConversationId(mapped);
      const isSelf = currentUserId
        ? mapped.senderId === currentUserId
        : mapped.senderRole === currentUserRole;
      const counterpartRaw = isSelf ? payload.receiver : payload.sender;
      const counterpart: RecipientDto = {
        id: counterpartRaw.id,
        name: counterpartRaw.name,
        role: counterpartRaw.role,
        email: undefined,
        online: onlineUsersRef.current.has(counterpartRaw.id),
      };

      threadCacheRef.current.add(conversationId);
      upsertConversationMessage(conversationId, mapped);

      const shouldIncrementUnread =
        !isSelf && selectedConversationRef.current !== conversationId;

      updateContactAfterMessage(conversationId, mapped, counterpart, {
        incrementUnread: shouldIncrementUnread,
      });

      if (!isSelf && selectedConversationRef.current === conversationId) {
        markConversationSeen(conversationId);
      }
    },
    [
      currentUserId,
      currentUserRole,
      markConversationSeen,
      resolveConversationId,
      updateContactAfterMessage,
      upsertConversationMessage,
    ]
  );

  const handleMessageUpdate = useCallback(
    (message: MessageUpdateEvent) => {
      const mapped = mapSocketMessage(message);
      const conversationId = resolveConversationId(mapped);

      mutateConversationMessages(conversationId, (previous) =>
        previous.map((item) =>
          item.id === mapped.id
            ? {
                ...item,
                content: mapped.content,
                editedAt: mapped.editedAt,
                deleted: mapped.deleted,
                fileUrl: mapped.fileUrl,
                fileName: mapped.fileName,
                preview: mapped.preview,
                replyTo: mapped.replyTo,
                replyToDeleted: mapped.replyToDeleted,
              }
            : item
        )
      );

      setContactsSorted((list) =>
        list.map((contact) =>
          contact.id === conversationId &&
          contact.lastMessageAt === mapped.timestampIso
            ? {
                ...contact,
                lastMessage: {
                  content: mapped.preview ?? mapped.content,
                  timestamp: mapped.timestamp,
                  timestampIso: mapped.timestampIso,
                  senderRole: mapped.senderRole,
                },
              }
            : contact
        )
      );
    },
    [mutateConversationMessages, resolveConversationId, setContactsSorted]
  );

  const handleMessageDeleted = useCallback(
    (event: MessageDeletedEvent) => {
      const removeCompletely =
        event.mode === "everyone" || event.forEveryone === true;
      const updatedConversations = new Map<string, MessageItem[]>();

      setMessagesByConversation((previous) => {
        const next: typeof previous = {};

        Object.entries(previous).forEach(([conversationId, messages]) => {
          let updated = messages;

          if (removeCompletely) {
            const filtered = messages.filter(
              (message) => message.id !== event.messageId
            );
            if (filtered.length !== messages.length) {
              updated = filtered;
            }
          } else {
            let changed = false;
            const mapped = messages.map((message) => {
              if (message.id !== event.messageId) {
                return message;
              }
              changed = true;
              return {
                ...message,
                deleted: true,
                content: "",
                fileUrl: undefined,
                fileName: undefined,
                preview: "This message was deleted.",
              };
            });
            if (changed) {
              updated = mapped;
            }
          }

          next[conversationId] = updated;
          if (updated !== messages) {
            updatedConversations.set(conversationId, updated);
          }
        });

        return next;
      });

      if (updatedConversations.size > 0) {
        setContactsSorted((list) =>
          list.map((contact) => {
            const updatedMessages = updatedConversations.get(contact.id);
            if (!updatedMessages) {
              return contact;
            }

            const last = updatedMessages[updatedMessages.length - 1];
            return {
              ...contact,
              lastMessage: last
                ? {
                    content: last.preview ?? last.content,
                    timestamp: last.timestamp,
                    timestampIso: last.timestampIso,
                    senderRole: last.senderRole,
                  }
                : undefined,
              lastMessageAt: last?.timestampIso,
            };
          })
        );
      }
    },
    [setContactsSorted]
  );

  const handleSeenUpdate = useCallback((event: MessageSeenUpdateEvent) => {
    setMessagesByConversation((previous) => {
      const next: typeof previous = {};
      Object.entries(previous).forEach(([conversationId, messages]) => {
        let changed = false;
        const updated = messages.map((message) => {
          if (!event.messageIds.includes(message.id)) {
            return message;
          }
          changed = true;
          const seenBy = Array.from(new Set([...message.seenBy, event.seenBy]));
          return {
            ...message,
            seenBy,
            status:
              event.seenBy === message.receiverId ? "read" : message.status,
          };
        });
        next[conversationId] = changed ? updated : messages;
      });
      return next;
    });
  }, []);

  const handleLegacyReadEvent = useCallback(
    (event: MessageReadEvent) => {
      if (!event.readerId) {
        return;
      }
      handleSeenUpdate({
        messageIds: event.messageIds,
        seenBy: event.readerId,
        threadKey: event.threadKey,
      });
    },
    [handleSeenUpdate]
  );

  const {
    socketRef,
    sendMessage: emitSendMessage,
    editMessage: emitEditMessage,
    deleteMessage: emitDeleteMessage,
    emitSeen,
  } = useMessageSocket({
    onIncomingMessage: handleMessageEvent,
    onMessageSent: handleMessageEvent,
    onMessagesRead: handleLegacyReadEvent,
    onMessageUpdated: handleMessageUpdate,
    onMessageDeleted: handleMessageDeleted,
    onMessageSeenUpdate: handleSeenUpdate,
    onUserStatus: handleUserStatus,
    onUserStatusInit: handleUserStatusInit,
  });

  useEffect(() => {
    emitSeenRef.current = emitSeen;
  }, [emitSeen]);

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
      const shouldFetch =
        options.force || !threadCacheRef.current.has(participantId);

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

        messagesRef.current = {
          ...messagesRef.current,
          [participantId]: mappedMessages,
        };

        setMessagesByConversation((previous) => ({
          ...previous,
          [participantId]: mappedMessages,
        }));

        const participantContact = {
          ...contactFromRecipient(data.participant),
          online:
            data.participant.online ??
            onlineUsersRef.current.has(data.participant.id),
        };
        participantContact.lastMessage = mappedMessages.length
          ? {
              content:
                mappedMessages[mappedMessages.length - 1].preview ??
                mappedMessages[mappedMessages.length - 1].content,
              timestamp: mappedMessages[mappedMessages.length - 1].timestamp,
              timestampIso:
                mappedMessages[mappedMessages.length - 1].timestampIso,
              senderRole: mappedMessages[mappedMessages.length - 1].senderRole,
            }
          : participantContact.lastMessage;
        participantContact.lastMessageAt =
          mappedMessages[mappedMessages.length - 1]?.timestampIso;

        setContactsSorted((list) => {
          const exists = list.find(
            (contact) => contact.id === participantContact.id
          );
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

        if (selectedConversationRef.current === participantId) {
          markConversationSeen(participantId);
        }
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
    [markConversationSeen, setContactsSorted, toast]
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
    async (conversationId: string, payload: OutgoingMessagePayload) => {
      setIsSending(true);
      let uploading = false;
      try {
        let fileUrl = payload.fileUrl;
        let fileName = payload.fileName;
        let messageType = payload.type ?? "text";
        const content = payload.content?.trim() ?? "";

        if (payload.file) {
          uploading = true;
          setIsUploadingAttachment(true);
          const uploadResult = await uploadMessageFile(payload.file);
          fileUrl = uploadResult.fileUrl;
          fileName = uploadResult.fileName;
          messageType = determineMessageType(payload.file);
        }

        if (messageType === "text" && content.length === 0) {
          throw new Error("Message content is required");
        }

        await emitSendMessage({
          recipientId: conversationId,
          content,
          type: messageType,
          fileUrl,
          fileName,
          replyToMessageId: payload.replyToMessageId,
        });

        threadCacheRef.current.add(conversationId);
        setMessageDraft("");
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
        if (uploading) {
          setIsUploadingAttachment(false);
        }
      }
    },
    [emitSendMessage, toast]
  );

  const onEditMessage = useCallback(
    async (conversationId: string, messageId: string, content: string) => {
      try {
        await emitEditMessage(messageId, content);
        threadCacheRef.current.add(conversationId);
      } catch (error) {
        const description =
          error instanceof Error ? error.message : "Failed to edit message.";
        toast({
          title: "Unable to edit message",
          description,
          variant: "destructive",
        });
        // Avoid rethrow to prevent unhandled promise rejection in UI
      }
    },
    [emitEditMessage, toast]
  );

  const onDeleteMessage = useCallback(
    async (
      conversationId: string,
      messageId: string,
      options: { forEveryone?: boolean } = {}
    ) => {
      try {
        await emitDeleteMessage(messageId, options.forEveryone ?? false);
        threadCacheRef.current.add(conversationId);

        if (!options.forEveryone) {
          mutateConversationMessages(conversationId, (previous) => {
            const filtered = previous.filter((item) => item.id !== messageId);
            const last = filtered[filtered.length - 1];
            setContactsSorted((list) =>
              list.map((contact) =>
                contact.id === conversationId
                  ? {
                      ...contact,
                      lastMessage: last
                        ? {
                            content: last.preview ?? last.content,
                            timestamp: last.timestamp,
                            timestampIso: last.timestampIso,
                            senderRole: last.senderRole,
                          }
                        : undefined,
                      lastMessageAt: last?.timestampIso,
                    }
                  : contact
              )
            );
            return filtered;
          });
        }
      } catch (error) {
        const description =
          error instanceof Error ? error.message : "Failed to delete message.";
        toast({
          title: "Unable to delete message",
          description,
          variant: "destructive",
        });
        // Avoid rethrow to prevent unhandled promise rejection in UI
      }
    },
    [emitDeleteMessage, mutateConversationMessages, setContactsSorted, toast]
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
        return [...list.filter((contact) => contact.id !== base.id), updated];
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
                content: mapped.preview ?? mapped.content,
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
                content: mapped.preview ?? mapped.content,
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
    onEditMessage,
    onDeleteMessage,
    isLoadingContacts,
    isLoadingThread,
    isSendingMessage: isSending,
    isUploadingAttachment,
    currentUserId,
    currentUserRole,
    recipients,
    loadRecipients: loadRecipientsList,
    isRecipientsLoading,
    startConversationWith,
    validateContact,
  };
};
