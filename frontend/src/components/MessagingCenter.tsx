import { useCallback, useMemo, useRef, useState } from "react";
import {
  Send,
  Paperclip,
  Search,
  Plus,
  Check,
  CheckSquare,
  Pin,
  Reply,
  Forward,
  Clipboard,
  Edit,
  Trash,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import ForwardMessageDialog from "./messaging/ForwardMessageDialog";
import { fetchRecipients, forwardMessage } from "@/lib/api/messagesApi";
import { useToast } from "@/hooks/use-toast";

export type UserRole = "admin" | "head" | "teacher";

export interface MessageItem {
  id: string;
  senderId: string;
  senderRole: UserRole;
  receiverId: string;
  receiverRole: UserRole;
  content: string;
  timestamp: string;
  timestampIso: string;
  status: "read" | "unread";
  type: "text" | "image" | "file" | "doc";
  fileUrl?: string;
  fileName?: string;
  deleted: boolean;
  editedAt?: string;
  deliveredTo: string[];
  seenBy: string[];
  threadKey?: string;
  preview?: string;
  replyToMessageId?: string;
  replyTo?: {
    messageId: string;
    senderName: string;
    type: "text" | "image" | "file" | "doc";
    snippet: string;
  };
  replyToDeleted?: boolean;
  isPending?: boolean;
}

export interface ContactItem {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  email?: string;
  online?: boolean;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    timestamp: string;
    timestampIso: string;
    senderRole: UserRole;
  };
  lastMessageAt?: string;
}
interface MessagingCenterProps {
  title: string;
  description?: string;
  listTitle: string;
  listDescription?: string;
  contacts: ContactItem[];
  selectedConversationId: string | null;
  messages: MessageItem[];
  currentUserRole: UserRole;
  currentUserId?: string;
  onSelectConversation: (conversationId: string) => void;
  onSendMessage?: (
    conversationId: string,
    payload: {
      content?: string;
      type?: MessageItem["type"];
      file?: File;
      fileUrl?: string;
      fileName?: string;
      replyToMessageId?: string;
    }
  ) => Promise<void> | void;
  onEditMessage?: (
    conversationId: string,
    messageId: string,
    content: string
  ) => Promise<void> | void;
  onDeleteMessage?: (
    conversationId: string,
    messageId: string,
    options?: { forEveryone?: boolean }
  ) => Promise<void> | void;
  isUploadingAttachment?: boolean;
  messageDraft: string;
  onChangeDraft: (value: string) => void;
  isLoadingContacts?: boolean;
  isLoadingThread?: boolean;
  isSendingMessage?: boolean;
  onCompose?: () => void;
  composeDisabled?: boolean;
  composeLabel?: string;
  emptyStateMessage?: string;
  disallowedRecipientMessage?: string;
  validateRecipient?: (contact: ContactItem) => boolean;
}

const getInitials = (value: string) =>
  value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatRoleLabel = (role: UserRole) => {
  switch (role) {
    case "admin":
      return "Administrator";
    case "head":
      return "Head of School";
    case "teacher":
      return "Teacher";
    default:
      return role;
  }
};

const DELETED_MESSAGE_TEXT = "This message was deleted.";

const getMessageTypeLabel = (type: MessageItem["type"]) => {
  switch (type) {
    case "image":
      return "Photo";
    case "doc":
      return "Document";
    case "file":
      return "File";
    default:
      return "Message";
  }
};

const getReplyPreviewText = (message: MessageItem) => {
  if (message.deleted) {
    return DELETED_MESSAGE_TEXT;
  }

  const content = (message.content ?? "").trim();

  if (message.type === "text" && content.length > 0) {
    return content;
  }

  if (message.fileName) {
    return message.fileName;
  }

  if (content.length > 0) {
    return content;
  }

  return getMessageTypeLabel(message.type);
};

const getReplyHeaderLabel = (
  message: MessageItem,
  currentUserId?: string,
  participantName?: string
) => {
  if (message.deleted) {
    return "Replying to a deleted message";
  }

  if (currentUserId && message.senderId === currentUserId) {
    return "Replying to yourself";
  }

  if (participantName) {
    return `Replying to ${participantName}`;
  }

  return `Replying to ${formatRoleLabel(message.senderRole)}`;
};

const MessagingCenter = ({
  title,
  description,
  listTitle,
  listDescription,
  contacts,
  selectedConversationId,
  messages,
  currentUserRole,
  currentUserId,
  onSelectConversation,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  messageDraft,
  onChangeDraft,
  isUploadingAttachment,
  isLoadingContacts = false,
  isLoadingThread = false,
  isSendingMessage,
  onCompose,
  composeDisabled = false,
  composeLabel = "New Message",
  emptyStateMessage = "No conversations yet. Start by selecting a contact.",
  disallowedRecipientMessage = "You cannot message this recipient due to role restrictions.",
  validateRecipient,
}: MessagingCenterProps) => {
  const [search, setSearch] = useState("");
  const [internalIsSending, setInternalIsSending] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDeleteMessage, setPendingDeleteMessage] =
    useState<MessageItem | null>(null);
  const [pendingPinMessage, setPendingPinMessage] =
    useState<MessageItem | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingOriginal, setEditingOriginal] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] =
    useState<MessageItem | null>(null);
  const [forwardRecipients, setForwardRecipients] = useState<
    import("@/lib/api/messagesApi").RecipientDto[]
  >([]);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [forwardSelectedId, setForwardSelectedId] = useState<string | null>(
    null
  );
  const [forwardPage, setForwardPage] = useState(1);
  const [forwardHasMore, setForwardHasMore] = useState(false);

  const { toast } = useToast();

  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sending = isSendingMessage ?? internalIsSending;

  const hierarchyAllows = useCallback(
    (contactRole: UserRole) => {
      switch (currentUserRole) {
        case "teacher":
          return contactRole === "head";
        case "head":
          return contactRole === "admin" || contactRole === "teacher";
        case "admin":
          return contactRole === "head";
        default:
          return false;
      }
    },
    [currentUserRole]
  );

  const isSelectable = useCallback(
    (contact: ContactItem) => {
      const hierarchyValid = hierarchyAllows(contact.role);
      if (!hierarchyValid) {
        return false;
      }
      if (validateRecipient) {
        return validateRecipient(contact);
      }
      return true;
    },
    [hierarchyAllows, validateRecipient]
  );

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return contacts;
    }
    return contacts.filter((contact) => {
      const haystack = [contact.name, contact.role, contact.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [contacts, search]);

  const selectedContact = useMemo(() => {
    if (!selectedConversationId) return null;
    return (
      contacts.find((contact) => contact.id === selectedConversationId) ?? null
    );
  }, [contacts, selectedConversationId]);

  const replyTo = useMemo(() => {
    if (!replyToMessageId) {
      return null;
    }
    return messages.find((item) => item.id === replyToMessageId) ?? null;
  }, [messages, replyToMessageId]);

  const pinnedMessages = useMemo(() => {
    if (!messages || pinnedIds.size === 0) return [] as MessageItem[];
    return messages.filter((m) => pinnedIds.has(m.id));
  }, [messages, pinnedIds]);

  const handleSelectContact = (contact: ContactItem) => {
    if (!isSelectable(contact)) {
      return;
    }
    setReplyToMessageId(null);
    setEditingMessageId(null);
    setEditingOriginal(null);
    onSelectConversation(contact.id);
  };

  const handleSendMessage = async () => {
    if (
      !selectedConversationId ||
      !messageDraft.trim() ||
      !onSendMessage ||
      sending
    ) {
      return;
    }
    try {
      if (isSendingMessage === undefined) {
        setInternalIsSending(true);
      }
      // If we are editing, call edit handler instead of send
      if (editingMessageId && onEditMessage) {
        const trimmed = messageDraft.trim();
        await onEditMessage(selectedConversationId, editingMessageId, trimmed);
        // clear editing state
        setEditingMessageId(null);
        setEditingOriginal(null);
        onChangeDraft("");
      } else {
        await onSendMessage(selectedConversationId, {
          content: messageDraft.trim(),
          replyToMessageId: replyTo?.id,
        });
        onChangeDraft("");
        setReplyToMessageId(null);
      }
    } finally {
      if (isSendingMessage === undefined) {
        setInternalIsSending(false);
      }
    }
  };

  const handleEditMessage = (message: MessageItem) => {
    // Open inline editor: populate input with current message content
    if (!onEditMessage || !selectedConversationId) return;
    setEditingMessageId(message.id);
    setEditingOriginal(message.content ?? "");
    onChangeDraft(message.content ?? "");
  };

  const handleDeleteMessage = (message: MessageItem) => {
    if (!onDeleteMessage || !selectedConversationId) return;
    setPendingDeleteMessage(message);
  };

  const handleCopyMessage = async (message: MessageItem) => {
    try {
      if (message.content) {
        await navigator.clipboard.writeText(message.content);
      }
    } catch {}
  };

  const handlePinMessage = (message: MessageItem) => {
    setPendingPinMessage(message);
  };

  const handleSelectMessage = (message: MessageItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(message.id)) {
        next.delete(message.id);
      } else {
        next.add(message.id);
      }
      return next;
    });
  };

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteMessage(null);
  }, []);

  const handleConfirmDelete = useCallback(
    async (forEveryone: boolean) => {
      if (
        !pendingDeleteMessage ||
        !onDeleteMessage ||
        !selectedConversationId
      ) {
        setPendingDeleteMessage(null);
        return;
      }
      const message = pendingDeleteMessage;
      setPendingDeleteMessage(null);
      try {
        await onDeleteMessage(selectedConversationId, message.id, {
          forEveryone,
        });
      } catch {
        // controller handles surface errors (toast, etc.)
      }
    },
    [pendingDeleteMessage, onDeleteMessage, selectedConversationId]
  );

  const handleCancelPin = useCallback(() => {
    setPendingPinMessage(null);
  }, []);

  const handleConfirmPin = useCallback(() => {
    if (!pendingPinMessage) {
      setPendingPinMessage(null);
      return;
    }
    const message = pendingPinMessage;
    setPendingPinMessage(null);
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(message.id)) {
        next.delete(message.id);
      } else {
        next.add(message.id);
      }
      return next;
    });
  }, [pendingPinMessage]);

  const handleReplyMessage = (message: MessageItem) => {
    setReplyToMessageId(message.id);
  };

  const handleForwardMessage = async (message: MessageItem) => {
    // Open forward dialog and fetch recipients from remote API
    setForwardingMessage(message);
    setForwardSelectedId(null);
    setForwardRecipients([]);
    setForwardLoading(true);
    setForwardPage(1);
    setForwardHasMore(false);
    try {
      const { recipients, hasMore } = await fetchRecipients(1, 20);
      setForwardRecipients(recipients);
      setForwardHasMore(hasMore);
    } catch (e) {
      setForwardRecipients([]);
      setForwardHasMore(false);
    } finally {
      setForwardLoading(false);
    }
  };

  const closeForwardDialog = () => {
    setForwardingMessage(null);
    setForwardSelectedId(null);
    setForwardRecipients([]);
    setForwardLoading(false);
    setForwardPage(1);
    setForwardHasMore(false);
  };

  const loadMoreForwardRecipients = async () => {
    if (forwardLoading || !forwardHasMore) return;
    setForwardLoading(true);
    try {
      const nextPage = forwardPage + 1;
      const { recipients, hasMore } = await fetchRecipients(nextPage, 20);
      setForwardRecipients((prev) => [...prev, ...recipients]);
      setForwardHasMore(hasMore);
      setForwardPage(nextPage);
    } catch (e) {
      // ignore
    } finally {
      setForwardLoading(false);
    }
  };

  const confirmForward = async () => {
    if (!forwardingMessage || !forwardSelectedId) return;
    setForwardLoading(true);
    try {
      await forwardMessage(forwardingMessage.id, forwardSelectedId);
      toast({
        title: "Message forwarded",
        description: "Your message was forwarded successfully.",
      });
      closeForwardDialog();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Forward failed",
        description:
          err?.message ?? "Unable to forward message. Please try again.",
      });
    } finally {
      setForwardLoading(false);
    }
  };

  const clearReply = () => setReplyToMessageId(null);

  const handleReplyPreviewClick = (message: MessageItem) => {
    if (
      !message.replyTo ||
      !message.replyTo.messageId ||
      message.replyToDeleted
    ) {
      return;
    }

    const originalId = message.replyTo.messageId;
    const originalElement = messageRefs.current[originalId];

    if (!originalElement) {
      return;
    }

    originalElement.scrollIntoView({ behavior: "smooth", block: "center" });

    originalElement.classList.add("ring-2", "ring-blue-400");

    window.setTimeout(() => {
      originalElement.classList.remove("ring-2", "ring-blue-400");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            {description ? (
              <p className="text-muted-foreground">{description}</p>
            ) : null}

            {forwardingMessage ? (
              <ForwardMessageDialog
                open={Boolean(forwardingMessage)}
                onOpenChange={(open: boolean) => {
                  if (!open) closeForwardDialog();
                }}
                recipients={forwardRecipients}
                isLoading={forwardLoading}
                selectedId={forwardSelectedId}
                onSelectRecipient={setForwardSelectedId}
                onConfirm={confirmForward}
                hasMore={forwardHasMore}
                onLoadMore={loadMoreForwardRecipients}
              />
            ) : null}
          </div>
          {onCompose ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={onCompose}
              disabled={composeDisabled}
            >
              <Plus className="h-4 w-4" /> {composeLabel}
            </Button>
          ) : null}
        </header>
        <div className="grid gap-6 md:grid-cols-[320px,1fr]">
          <Card className="h-fit md:sticky md:top-24">
            <CardHeader>
              <CardTitle>{listTitle}</CardTitle>
              {listDescription ? (
                <CardDescription>{listDescription}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search"
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-[480px] pr-2">
                <div className="space-y-2">
                  {isLoadingContacts && contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Loading conversations…
                    </p>
                  ) : null}
                  {!isLoadingContacts && filteredContacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No matching contacts.
                    </p>
                  ) : null}
                  {filteredContacts.map((contact) => {
                    const lastMessage = contact.lastMessage;
                    const allowed = isSelectable(contact);
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleSelectContact(contact)}
                        disabled={!allowed}
                        className={cn(
                          "w-full rounded-2xl border border-transparent bg-card p-4 text-left transition-colors hover:border-border hover:bg-primary/5",
                          selectedConversationId === contact.id
                            ? "border-primary bg-primary/5"
                            : undefined,
                          !allowed ? "cursor-not-allowed opacity-60" : undefined
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 border border-border">
                            {contact.avatarUrl ? (
                              <AvatarImage
                                src={contact.avatarUrl}
                                alt={contact.name}
                              />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(contact.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{contact.name}</p>
                              {contact.online ? (
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-gray-400" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatRoleLabel(contact.role)}
                            </p>
                            {lastMessage ? (
                              <div className="mt-1 text-xs">
                                <p className="truncate">
                                  {lastMessage.content}
                                </p>
                                <p className="text-muted-foreground">
                                  {lastMessage.timestamp}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                No messages yet
                              </p>
                            )}
                            {!allowed ? (
                              <p className="text-xs italic text-muted-foreground">
                                {disallowedRecipientMessage}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="flex h-full flex-col">
            {selectedContact ? (
              <>
                <CardHeader className="border-b border-border pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border">
                      {selectedContact.avatarUrl ? (
                        <AvatarImage
                          src={selectedContact.avatarUrl}
                          alt={selectedContact.name}
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(selectedContact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">
                        {selectedContact.name}
                      </CardTitle>
                      <CardDescription>
                        {formatRoleLabel(selectedContact.role)}
                      </CardDescription>
                      {selectedContact.email ? (
                        <p className="text-xs text-muted-foreground">
                          {selectedContact.email}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-6">
                  {pinnedMessages.length > 0 ? (
                    <div className="rounded-2xl border border-yellow-300/60 bg-yellow-50/60 p-3 dark:border-yellow-800/60 dark:bg-yellow-950/20">
                      <div className="mb-2 flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                        <Pin className="h-4 w-4" />
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Pinned
                        </p>
                      </div>
                      <div className="space-y-2">
                        {pinnedMessages.map((msg) => {
                          const isSelf =
                            msg.senderId === currentUserId ||
                            (!currentUserId &&
                              msg.senderRole === currentUserRole);
                          return (
                            <div
                              key={msg.id}
                              className="group relative rounded-xl border border-yellow-200 bg-background/70 px-3 py-2 text-sm dark:border-yellow-900"
                            >
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-[11px] font-medium text-muted-foreground">
                                  {isSelf
                                    ? "You"
                                    : selectedContact?.name ?? "User"}
                                </span>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                  <span>{msg.timestamp}</span>
                                  <button
                                    type="button"
                                    className="rounded-md px-2 py-0.5 text-xs hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                                    onClick={() => handlePinMessage(msg)}
                                  >
                                    Unpin
                                  </button>
                                </div>
                              </div>
                              {msg.type === "file" && msg.fileUrl ? (
                                <a
                                  href={msg.fileUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="inline-block rounded-md bg-background/50 px-2 py-0.5 text-xs"
                                >
                                  {msg.fileName ?? "Download file"}
                                </a>
                              ) : null}
                              {msg.content ? (
                                <p className="leading-relaxed">{msg.content}</p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                  <ScrollArea className="h-[420px] pr-4">
                    <div className="space-y-3">
                      {isLoadingThread ? (
                        <p className="text-sm text-muted-foreground">
                          Loading messages…
                        </p>
                      ) : messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {emptyStateMessage}
                        </p>
                      ) : (
                        messages.map((message) => {
                          const isSelf =
                            message.senderId === currentUserId ||
                            (!currentUserId &&
                              message.senderRole === currentUserRole);
                          const isPinned = pinnedIds.has(message.id);
                          const isSelected = selectedIds.has(message.id);
                          return (
                            <ContextMenu key={message.id}>
                              <ContextMenuTrigger asChild>
                                <div
                                  className={cn(
                                    "flex",
                                    isSelf ? "justify-end" : "justify-start"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "group relative max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-colors",
                                      isSelf
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground",
                                      isSelected && "ring-2 ring-ring",
                                      isPinned &&
                                        "border-2 border-yellow-500 hover:border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                                    )}
                                    ref={(el) => {
                                      messageRefs.current[message.id] = el;
                                    }}
                                  >
                                    {isPinned ? (
                                      <Pin className="absolute -top-2 -right-2 h-4 w-4 rotate-12 text-yellow-500" />
                                    ) : null}
                                    <div className="space-y-2">
                                      {message.replyTo ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleReplyPreviewClick(message)
                                          }
                                          disabled={message.replyToDeleted}
                                          aria-disabled={message.replyToDeleted}
                                          className={cn(
                                            "mb-1 flex w-full items-start gap-2 rounded-md bg-background/40 px-2 py-1 text-xs text-left",
                                            isSelf
                                              ? "text-primary-foreground/80"
                                              : "text-muted-foreground",
                                            message.replyToDeleted
                                              ? "cursor-not-allowed opacity-80"
                                              : "hover:bg-background/60"
                                          )}
                                        >
                                          <div className="border-l-2 border-primary/60 pr-1" />
                                          <div className="min-w-0 flex-1">
                                            <p className="font-semibold truncate">
                                              {message.replyTo.senderName ||
                                                "Unknown"}
                                            </p>
                                            <p
                                              className={cn(
                                                "truncate",
                                                message.replyToDeleted
                                                  ? "italic"
                                                  : undefined
                                              )}
                                            >
                                              {message.replyToDeleted
                                                ? DELETED_MESSAGE_TEXT
                                                : message.replyTo.snippet ||
                                                  getMessageTypeLabel(
                                                    message.replyTo.type
                                                  )}
                                            </p>
                                          </div>
                                        </button>
                                      ) : null}
                                      {(message.type === "file" ||
                                        message.type === "doc") &&
                                      message.fileUrl ? (
                                        <a
                                          href={message.fileUrl}
                                          target="_blank"
                                          rel="noreferrer noopener"
                                          className="inline-block rounded-md bg-background/50 px-3 py-1 text-sm"
                                        >
                                          {message.fileName ?? "Download file"}
                                        </a>
                                      ) : null}
                                      <p>{message.content}</p>
                                    </div>
                                    <div
                                      className={cn(
                                        "mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs",
                                        isSelf
                                          ? "text-primary-foreground/80"
                                          : "text-muted-foreground"
                                      )}
                                    >
                                      <span>{message.timestamp}</span>
                                      {message.status ? (
                                        <span className="font-medium capitalize">
                                          {message.status}
                                        </span>
                                      ) : null}
                                      {isSelf && selectedContact ? (
                                        <span className="ml-2 flex items-center gap-1">
                                          {message.seenBy?.includes(
                                            selectedContact.id
                                          ) ? (
                                            <>
                                              <CheckSquare className="h-3 w-3" />
                                              <span className="text-xs">
                                                Seen
                                              </span>
                                            </>
                                          ) : message.deliveredTo?.includes(
                                              selectedContact.id
                                            ) ? (
                                            <>
                                              <Check className="h-3 w-3" />
                                              <span className="text-xs">
                                                Delivered
                                              </span>
                                            </>
                                          ) : null}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem
                                  onClick={() => handleReplyMessage(message)}
                                >
                                  <Reply className="mr-2 h-4 w-4" /> Reply
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onClick={() => handlePinMessage(message)}
                                >
                                  <Pin className="mr-2 h-4 w-4" />{" "}
                                  {isPinned ? "Unpin" : "Pin"}
                                </ContextMenuItem>
                                {message.content ? (
                                  <ContextMenuItem
                                    onClick={() => handleCopyMessage(message)}
                                  >
                                    <Clipboard className="mr-2 h-4 w-4" /> Copy
                                    Text
                                  </ContextMenuItem>
                                ) : null}
                                <ContextMenuItem
                                  onClick={() => handleForwardMessage(message)}
                                >
                                  <Forward className="mr-2 h-4 w-4" /> Forward
                                </ContextMenuItem>
                                {isSelf && onEditMessage ? (
                                  <ContextMenuItem
                                    onClick={() => handleEditMessage(message)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </ContextMenuItem>
                                ) : null}
                                <ContextMenuItem
                                  onClick={() => handleDeleteMessage(message)}
                                >
                                  <Trash className="mr-2 h-4 w-4" /> Delete
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem
                                  onClick={() => handleSelectMessage(message)}
                                >
                                  {isSelected ? "Unselect" : "Select"}
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>

                  <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                    {replyTo ? (
                      <div className="flex items-start justify-between rounded-lg border border-border bg-background/60 p-3 text-xs">
                        <div className="max-w-[80%] space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {replyTo.deleted
                              ? "Deleted"
                              : getMessageTypeLabel(replyTo.type)}
                          </p>
                          <p className="font-semibold">
                            {getReplyHeaderLabel(
                              replyTo,
                              currentUserId,
                              selectedContact?.name
                            )}
                          </p>
                          <p
                            className={cn(
                              "truncate",
                              replyTo.deleted
                                ? "italic opacity-70"
                                : "opacity-80"
                            )}
                          >
                            {getReplyPreviewText(replyTo)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearReply}
                          className="text-muted-foreground transition hover:text-foreground"
                          aria-label="Cancel reply"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex flex-1 items-center gap-3 rounded-full border border-border bg-background px-4 py-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={messageDraft}
                          onChange={(event) =>
                            onChangeDraft(event.target.value)
                          }
                          placeholder={
                            selectedContact
                              ? `Message ${selectedContact.name}`
                              : "Write a message"
                          }
                          className="border-none px-0 shadow-none focus-visible:ring-0"
                          disabled={!onSendMessage || !selectedConversationId}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {editingMessageId ? (
                          <Button
                            type="button"
                            onClick={() => {
                              // Cancel editing
                              setEditingMessageId(null);
                              if (editingOriginal !== null) {
                                onChangeDraft("");
                              }
                            }}
                            variant="outline"
                            className="gap-2"
                          >
                            Cancel
                          </Button>
                        ) : null}

                        <Button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={
                            !(editingMessageId
                              ? onEditMessage
                              : onSendMessage) ||
                            !selectedConversationId ||
                            !messageDraft.trim() ||
                            sending
                          }
                          className="gap-2"
                        >
                          <Send className="h-4 w-4" />
                          {sending
                            ? editingMessageId
                              ? "Saving"
                              : "Sending"
                            : editingMessageId
                            ? "Save"
                            : "Send"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-muted-foreground">
                Select a conversation to get started.
              </div>
            )}
          </Card>
        </div>
      </div>
      <AlertDialog
        open={Boolean(pendingDeleteMessage)}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDelete();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how you would like to remove this message. Deleting for
              everyone replaces the content with a removal notice for all
              participants. Deleting for yourself only hides it from your own
              view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleConfirmDelete(false)}
              >
                Delete for me
              </Button>
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleConfirmDelete(true)}
              >
                Delete for everyone
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(pendingPinMessage)}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelPin();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pinnedIds.has(pendingPinMessage?.id || "")
                ? "Unpin message?"
                : "Pin message?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pin this message. Do not move it in the chat. Instead, show it in
              the pinned area at the top of the screen while keeping the
              original message in its place in the chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={handleCancelPin}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="default"
                onClick={handleConfirmPin}
              >
                {pinnedIds.has(pendingPinMessage?.id || "") ? "Unpin" : "Pin"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessagingCenter;
