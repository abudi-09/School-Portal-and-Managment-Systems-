import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatHeader } from "./ChatHeader";
import { CallOverlay } from "./CallOverlay";
import { useCall } from "@/hooks/useCall";
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
  onSendMessage: (
    conversationId: string,
    payload: { content?: string; file?: File }
  ) => void;
  onSendVoice?: (
    conversationId: string,
    audioBlob: Blob,
    duration: number,
    waveform: number[]
  ) => void;
  onBack: () => void;
  isLoading?: boolean;
  onReply?: (message: MessageItem) => void;
  onForward?: (message: MessageItem) => void;
  onPin?: (message: MessageItem) => void;
  onSelect?: (message: MessageItem) => void;
  onDelete?: (message: MessageItem) => void;
  onCopy?: (content: string) => void;
  replyingTo?: MessageItem | null;
  onCancelReply?: () => void;
  pinnedMessages?: Set<string>;
}

export const ChatArea = ({
  contact,
  messages,
  currentUserId,
  onSendMessage,
  onSendVoice,
  onBack,
  isLoading,
  onReply,
  onForward,
  onPin,
  onSelect,
  onDelete,
  onCopy,
  replyingTo,
  onCancelReply,
  pinnedMessages,
}: ChatAreaProps) => {
  // Initialize call hook per conversation scope.
  const call = useCall(currentUserId);
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

  const replySenderName = replyingTo
    ? replyingTo.senderId === currentUserId
      ? "You"
      : contact.name
    : "";

  // Build pinned list for header but keep originals in the main flow
  const pinnedMessagesList = messages.filter((msg) =>
    pinnedMessages?.has(msg.id)
  );

  return (
    <div className="flex flex-col h-full bg-background w-full">
      <ChatHeader
        contact={contact}
        onBack={onBack}
        onStartAudioCall={(c) => call.startCall(c.id)}
      />

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col space-y-4 pb-4">
          {/* Pinned Messages Section */}
          {pinnedMessagesList.length > 0 && (
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-4 mb-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-1 rounded-full bg-primary" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pinned Messages ({pinnedMessagesList.length})
                </p>
                <div className="h-1 w-1 rounded-full bg-primary" />
              </div>
              <div className="space-y-2">
                {pinnedMessagesList.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  return (
                    <div
                      key={`pinned-${msg.id}`}
                      className="bg-primary/5 rounded-lg p-2 border border-primary/20"
                    >
                      <MessageBubble
                        message={msg}
                        isOwn={isOwn}
                        showAvatar={false}
                        senderName={contact.name}
                        senderAvatar={contact.avatarUrl}
                        onReply={onReply}
                        onForward={onForward}
                        onPin={onPin}
                        onSelect={onSelect}
                        onDelete={onDelete}
                        onCopy={onCopy}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regular Messages */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">
                Loading messages...
              </p>
            </div>
          ) : messages.length === 0 && pinnedMessagesList.length === 0 ? (
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
                (index === 0 || messages[index - 1].senderId !== msg.senderId);

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
                    onReply={onReply}
                    onForward={onForward}
                    onPin={onPin}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onCopy={onCopy}
                  />
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <MessageComposer
        onSend={(content: string, file?: File) => {
          if (!contact) return;
          onSendMessage(contact.id, {
            content,
            file,
            replyToMessageId: replyingTo?.id,
          });
          // Clear reply after sending
          if (replyingTo && onCancelReply) {
            onCancelReply();
          }
        }}
        onSendVoice={
          onSendVoice
            ? (audioBlob: Blob, duration: number, waveform: number[]) => {
                if (!contact) return;
                onSendVoice(contact.id, audioBlob, duration, waveform);
                // Clear reply after sending voice
                if (replyingTo && onCancelReply) {
                  onCancelReply();
                }
              }
            : undefined
        }
        replyTo={
          replyingTo
            ? {
                senderName: replySenderName,
                snippet:
                  replyingTo.content ||
                  (replyingTo.type === "voice"
                    ? "Voice Message"
                    : replyingTo.fileName
                    ? `File: ${replyingTo.fileName}`
                    : "Attachment"),
                onCancel: onCancelReply || (() => {}),
              }
            : undefined
        }
      />
      {/* Call overlay renders on top when in call states */}
      <CallOverlay call={call} contactName={contact?.name} />
    </div>
  );
};
