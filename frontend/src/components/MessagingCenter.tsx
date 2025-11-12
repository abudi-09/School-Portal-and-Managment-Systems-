import { useCallback, useMemo, useState } from "react";
import { Send, Paperclip, Search, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  status?: "read" | "unread";
  isPending?: boolean;
}

export interface ContactItem {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  email?: string;
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
    message: string
  ) => Promise<void> | void;
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
  messageDraft,
  onChangeDraft,
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
    return contacts.find((contact) => contact.id === selectedConversationId) ?? null;
  }, [contacts, selectedConversationId]);

  const handleSelectContact = (contact: ContactItem) => {
    if (!isSelectable(contact)) {
      return;
    }
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
      await onSendMessage(selectedConversationId, messageDraft.trim());
      onChangeDraft("");
    } finally {
      if (isSendingMessage === undefined) {
        setInternalIsSending(false);
      }
    }
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
          </div>
          {onCompose ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={onCompose}
              disabled={composeDisabled}
            >
              <Plus className="h-4 w-4" />
              {composeLabel}
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
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-foreground">
                                {contact.name}
                              </p>
                              {contact.unreadCount ? (
                                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                                  {contact.unreadCount}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">
                              {formatRoleLabel(contact.role)}
                            </p>
                            {contact.email ? (
                              <p className="text-xs text-muted-foreground">
                                {contact.email}
                              </p>
                            ) : null}
                            {lastMessage ? (
                              <div className="space-y-1">
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                  {lastMessage.content}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {lastMessage.timestamp}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
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
                          return (
                            <div
                              key={message.id}
                              className={cn(
                                "flex",
                                isSelf ? "justify-end" : "justify-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                  isSelf
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                )}
                              >
                                <p>{message.content}</p>
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
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>

                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex flex-1 items-center gap-3 rounded-full border border-border bg-background px-4 py-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={messageDraft}
                          onChange={(event) => onChangeDraft(event.target.value)}
                          placeholder={
                            selectedContact
                              ? `Message ${selectedContact.name}`
                              : "Write a message"
                          }
                          className="border-none px-0 shadow-none focus-visible:ring-0"
                          disabled={!onSendMessage || !selectedConversationId}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={
                          !onSendMessage ||
                          !selectedConversationId ||
                          !messageDraft.trim() ||
                          sending
                        }
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {sending ? "Sending" : "Send"}
                      </Button>
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
    </div>
  );
};

export default MessagingCenter;
