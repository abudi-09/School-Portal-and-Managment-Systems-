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
        onEditMessage={controller.onEditMessage}
        onDeleteMessage={controller.onDeleteMessage}
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
    </>
  );
};

export default TeacherMessages;
