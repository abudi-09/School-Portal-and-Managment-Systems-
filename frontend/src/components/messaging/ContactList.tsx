import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ContactItem, UserRole } from "./types";
import { formatDistanceToNow } from "date-fns";

interface ContactListProps {
  contacts: ContactItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCompose?: () => void;
  isLoading?: boolean;
  className?: string;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatRoleLabel = (role: UserRole) => {
  switch (role) {
    case "admin":
      return "Admin";
    case "head":
      return "Head";
    case "teacher":
      return "Teacher";
    default:
      return role;
  }
};

export const ContactList = ({
  contacts,
  selectedId,
  onSelect,
  onCompose,
  isLoading,
  className,
}: ContactListProps) => {
  const [search, setSearch] = useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Messages</h2>
          {onCompose && (
            <Button size="icon" variant="ghost" onClick={onCompose}>
              <Plus className="h-5 w-5" />
              <span className="sr-only">New Message</span>
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-9 bg-muted/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Contact List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No contacts found</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredContacts.map((contact) => {
              const isSelected = selectedId === contact.id;
              const isOnline =
                contact.presence?.visibleStatus === "online" && !contact.presence.hidden;

              return (
                <button
                  key={contact.id}
                  onClick={() => onSelect(contact.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 focus:outline-none focus:bg-muted/50",
                    isSelected && "bg-muted"
                  )}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={contact.avatarUrl} />
                      <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-background bg-green-500 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">{contact.name}</span>
                      {contact.lastMessageAt && (
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(contact.lastMessageAt), {
                            addSuffix: false,
                          }).replace("about ", "")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate pr-2">
                        {contact.lastMessage?.content || (
                          <span className="italic opacity-70">
                            {formatRoleLabel(contact.role)}
                          </span>
                        )}
                      </p>
                      {contact.unreadCount ? (
                        <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center rounded-full flex-shrink-0">
                          {contact.unreadCount}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
