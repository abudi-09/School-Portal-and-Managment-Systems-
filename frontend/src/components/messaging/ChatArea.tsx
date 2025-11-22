import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { ContactItem, MessageItem } from "./types";
import { format, isSameDay } from "date-fns";
import { EmptyState } from "@/components/patterns";
import { MessageSquare } from "lucide-react";

interface ChatAreaProps {
  contact: ContactItem | null;
  messages: MessageItem[];
  currentUserId: string;
  onSendMessage: (content: string, file?: File) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const ChatArea = ({
  contact,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  isLoading,
}: ChatAreaProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!contact) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-full bg-muted/10 p-8 text-center">
        <EmptyState
          icon={MessageSquare}
          title="No conversation selected"
          description="Choose a contact from the list to start messaging."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background w-full">
      <ChatHeader contact={contact} onBack={onBack} />

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col space-y-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
              <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Say hello to {contact.name}!
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.senderId === currentUserId;
              const showAvatar =
                !isOwn &&
                (index === 0 ||
                  messages[index - 1].senderId !== msg.senderId);
              
              // Date separator
              const showDate =
                index === 0 ||
                !isSameDay(
                  new Date(msg.timestampIso),
                  new Date(messages[index - 1].timestampIso)
                );

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-6">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {format(new Date(msg.timestampIso), "MMMM d, yyyy")}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    senderName={contact.name}
                    senderAvatar={contact.avatarUrl}
                  />
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <MessageComposer onSend={onSendMessage} />
    </div>
  );
};
