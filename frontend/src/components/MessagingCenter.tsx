import { useState, useEffect } from "react";
import { ContactList } from "./messaging/ContactList";
import { ChatArea } from "./messaging/ChatArea";
import { MessagingCenterProps } from "./messaging/types";
import { cn } from "@/lib/utils";

// Fallback hook if use-mobile doesn't exist
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

const MessagingCenter = ({
  contacts,
  selectedConversationId,
  messages,
  currentUserRole,
  currentUserId = "current-user", // Fallback
  onSelectConversation,
  onSendMessage,
  onSendVoice,
  onDeleteMessage,
  isLoadingContacts,
  isLoadingThread,
  onCompose,
  onReplyMessage,
  onForwardMessage,
  onPinMessage,
  onSelectMessage,
  onCopyMessage,
  replyingTo,
  onCancelReply,
}: MessagingCenterProps) => {
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(false);

  // Sync external selection with local mobile view state
  useEffect(() => {
    if (selectedConversationId) {
      setShowChat(true);
    }
  }, [selectedConversationId]);

  const handleContactSelect = (id: string) => {
    onSelectConversation(id);
    setShowChat(true);
  };

  const handleBack = () => {
    setShowChat(false);
    // Optional: clear selection in parent if needed, but usually fine to keep
  };

  const selectedContact = contacts.find((c) => c.id === selectedConversationId) || null;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background border rounded-lg shadow-sm">
      {/* Contact List - Hidden on mobile if chat is open */}
      <div
        className={cn(
          "w-full md:w-80 lg:w-96 border-r bg-muted/5",
          isMobile && showChat ? "hidden" : "flex flex-col"
        )}
      >
        <ContactList
          contacts={contacts}
          selectedId={selectedConversationId}
          onSelect={handleContactSelect}
          isLoading={isLoadingContacts}
          onCompose={onCompose}
        />
      </div>

      {/* Chat Area - Hidden on mobile if no chat selected */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-background",
          isMobile && !showChat ? "hidden" : "flex"
        )}
      >
        <ChatArea
          contact={selectedContact}
          messages={messages}
          currentUserId={currentUserId}
          onSendMessage={onSendMessage}
          onSendVoice={onSendVoice}
          onBack={handleBack}
          isLoading={isLoadingThread}
          onReply={onReplyMessage}
          onForward={onForwardMessage}
          onPin={onPinMessage}
          onSelect={onSelectMessage}
          onCopy={onCopyMessage}
          replyingTo={replyingTo}
          onCancelReply={onCancelReply}
          onDelete={(msg) => onDeleteMessage?.(selectedConversationId || "", msg.id)}
        />
      </div>
    </div>
  );
};

export default MessagingCenter;
