import { useEffect, useMemo, useState } from "react";
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

export type MessageSender = "self" | "contact";

export interface MessageItem {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  status?: "read" | "unread";
  isPending?: boolean;
}

export interface ContactItem {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  unreadCount?: number;
  messages: MessageItem[];
  lastMessageAt?: string;
}

interface MessagingCenterProps {
  title: string;
  description?: string;
  listTitle: string;
  listDescription?: string;
  contacts: ContactItem[];
  selectedContactId?: string | null;
  onSelectContact?: (contactId: string) => void;
  onSendMessage?: (contactId: string, message: string) => Promise<void> | void;
  loadingContacts?: boolean;
  loadingThread?: boolean;
  onCompose?: () => void;
  composeDisabled?: boolean;
  composeLabel?: string;
  emptyStateMessage?: string;
}

const getInitials = (value: string) =>
  value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const MessagingCenter = ({
  title,
  description,
  listTitle,
  listDescription,
  contacts,
  selectedContactId,
  onSelectContact,
  onSendMessage,
  loadingContacts = false,
  loadingThread = false,
  onCompose,
  composeDisabled = false,
  composeLabel = "New Message",
  emptyStateMessage = "No conversations yet. Start by selecting a contact.",
}: MessagingCenterProps) => {
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(
    selectedContactId ?? contacts[0]?.id ?? null
  );
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (typeof selectedContactId === "string") {
      setLocalSelectedId(selectedContactId);
    } else if (selectedContactId === null) {
      setLocalSelectedId(null);
    }
  }, [selectedContactId]);

  useEffect(() => {
    if (!localSelectedId && contacts.length > 0) {
      setLocalSelectedId(contacts[0].id);
      return;
    }
    if (
      localSelectedId &&
      contacts.length > 0 &&
      !contacts.some((contact) => contact.id === localSelectedId)
    ) {
      setLocalSelectedId(contacts[0]?.id ?? null);
    }
  }, [contacts, localSelectedId]);

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return contacts;
    }
    return contacts.filter((contact) =>
      `${contact.name} ${contact.role}`.toLowerCase().includes(term)
    );
  }, [contacts, search]);

  const selectedContact = useMemo(() => {
    if (!localSelectedId) return null;
    return contacts.find((contact) => contact.id === localSelectedId) ?? null;
  }, [contacts, localSelectedId]);

  const handleSelectContact = (contactId: string) => {
    setLocalSelectedId(contactId);
    onSelectContact?.(contactId);
  };

  const handleSendMessage = async () => {
    if (!selectedContact || !draft.trim() || !onSendMessage) {
      return;
    }
    try {
      setIsSending(true);
      await onSendMessage(selectedContact.id, draft.trim());
      setDraft("");
    } finally {
      setIsSending(false);
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
                  {loadingContacts && contacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Loading conversations…
                    </p>
                  ) : null}
                  {!loadingContacts && filteredContacts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No matching contacts.
                    </p>
                  ) : null}
                  {filteredContacts.map((contact) => {
                    const lastMessage =
                      contact.messages[contact.messages.length - 1];
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => handleSelectContact(contact.id)}
                        className={cn(
                          "w-full rounded-2xl border border-transparent bg-card p-4 text-left transition-colors hover:border-border hover:bg-primary/5",
                          localSelectedId === contact.id
                            ? "border-primary bg-primary/5"
                            : undefined
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
                              {contact.role}
                            </p>
                            {lastMessage ? (
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {lastMessage.text}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No messages yet
                              </p>
                            )}
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
                      <CardDescription>{selectedContact.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-6">
                  <ScrollArea className="h-[420px] pr-4">
                    <div className="space-y-3">
                      {loadingThread ? (
                        <p className="text-sm text-muted-foreground">
                          Loading messages…
                        </p>
                      ) : selectedContact.messages.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {emptyStateMessage}
                        </p>
                      ) : (
                        selectedContact.messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              message.sender === "self"
                                ? "justify-end"
                                : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                                message.sender === "self"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground"
                              )}
                            >
                              <p>{message.text}</p>
                              <span
                                className={cn(
                                  "mt-2 block text-xs",
                                  message.sender === "self"
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground"
                                )}
                              >
                                {message.timestamp}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex flex-1 items-center gap-3 rounded-full border border-border bg-background px-4 py-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          placeholder={`Message ${selectedContact.name}`}
                          className="border-none px-0 shadow-none focus-visible:ring-0"
                          disabled={!onSendMessage}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!onSendMessage || !draft.trim() || isSending}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {isSending ? "Sending" : "Send"}
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
