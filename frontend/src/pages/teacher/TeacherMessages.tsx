import { useEffect, useState } from "react";
import MessagingCenter from "@/components/MessagingCenter";
import NewConversationDialog from "@/components/messaging/NewConversationDialog";
import { useMessagingController } from "@/hooks/useMessagingController";
import { useAuth } from "@/contexts/useAuth";

const TeacherMessages = () => {
  const { user } = useAuth();
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(
    null
  );
  const [forwardOpen, setForwardOpen] = useState(false);
  const [selectedForwardRecipientId, setSelectedForwardRecipientId] = useState<
    string | null
  >(null);
  const [isForwarding, setIsForwarding] = useState(false);

  const controller = useMessagingController({
    currentUserId: user?.id,
    currentUserRole: "teacher",
  });

  const handleOpenCompose = async () => {
    setComposeOpen(true);
    await controller.loadRecipients();
  };

  const handleConfirmCompose = async () => {
    if (!selectedRecipientId) {
      return;
    }
    const recipient = controller.recipients.find(
      (item) => item.id === selectedRecipientId
    );
    if (!recipient) {
      return;
    }
    await controller.startConversationWith(recipient);
    setComposeOpen(false);
    setSelectedRecipientId(null);
  };

  useEffect(() => {
    if (!composeOpen) {
      setSelectedRecipientId(null);
    }
  }, [composeOpen]);

  // Open forward dialog when a message is selected for forwarding
  useEffect(() => {
    if (!controller.forwardingMessage) {
      setForwardOpen(false);
      setSelectedForwardRecipientId(null);
      return;
    }
    setForwardOpen(true);
    if (controller.recipients.length === 0) {
      void controller.loadRecipients();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller.forwardingMessage]);

  const handleConfirmForward = async () => {
    if (!selectedForwardRecipientId) return;
    try {
      setIsForwarding(true);
      await controller.onConfirmForward(selectedForwardRecipientId);
      setForwardOpen(false);
      setSelectedForwardRecipientId(null);
    } finally {
      setIsForwarding(false);
    }
  };

  return (
    <>
      <MessagingCenter
        title="Messages"
        description="Coordinate with your leadership team and keep conversations organized in one place."
        listTitle="Heads of School"
        listDescription="Select a head of school to review the conversation."
        contacts={controller.contacts}
        selectedConversationId={controller.selectedConversationId}
        messages={controller.messages}
        currentUserRole="teacher"
        currentUserId={controller.currentUserId}
        onSelectConversation={controller.onSelectConversation}
        onSendMessage={controller.onSendMessage}
        onSendVoice={controller.onSendVoiceMessage}
        onEditMessage={controller.onEditMessage}
        onDeleteMessage={controller.onDeleteMessage}
        onToggleReaction={controller.onToggleReaction}
        onSaveMessage={controller.onSaveMessage}
        onSearchSavedMessages={controller.searchSavedMessages}
        isUploadingAttachment={controller.isUploadingAttachment}
        messageDraft={controller.messageDraft}
        onChangeDraft={controller.onChangeDraft}
        isLoadingContacts={controller.isLoadingContacts}
        isLoadingThread={controller.isLoadingThread}
        isSendingMessage={controller.isSendingMessage}
        onCompose={handleOpenCompose}
        composeDisabled={controller.isRecipientsLoading}
        emptyStateMessage="Start collaborating by sending your first message."
        validateRecipient={controller.validateContact}
        onReplyMessage={controller.onReplyMessage}
        onForwardMessage={controller.onForwardMessage}
        onPinMessage={controller.onPinMessage}
        onSelectMessage={controller.onSelectMessage}
        onCopyMessage={controller.onCopyMessage}
        replyingTo={controller.replyingTo}
        onCancelReply={controller.onCancelReply}
        pinnedMessages={controller.pinnedMessages}
      />
      <NewConversationDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        recipients={controller.recipients}
        isLoading={controller.isRecipientsLoading}
        selectedRecipientId={selectedRecipientId}
        onSelectRecipient={setSelectedRecipientId}
        onConfirm={handleConfirmCompose}
        description="Only heads of school can receive messages from teachers."
        confirmLabel="Start conversation"
      />
      <NewConversationDialog
        open={forwardOpen}
        onOpenChange={(open) => {
          setForwardOpen(open);
          if (!open) {
            controller.onCancelForward();
            setSelectedForwardRecipientId(null);
          }
        }}
        recipients={controller.recipients.filter((r) => r.role === "head")}
        isLoading={controller.isRecipientsLoading || isForwarding}
        selectedRecipientId={selectedForwardRecipientId}
        onSelectRecipient={setSelectedForwardRecipientId}
        onConfirm={handleConfirmForward}
        description="Select a recipient to forward this message."
        confirmLabel={isForwarding ? "Forwarding..." : "Forward"}
        title="Forward Message"
      />
    </>
  );
};

export default TeacherMessages;
