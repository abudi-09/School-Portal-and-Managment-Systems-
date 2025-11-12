import { useEffect, useState } from "react";
import MessagingCenter from "@/components/MessagingCenter";
import NewConversationDialog from "@/components/messaging/NewConversationDialog";
import { useMessagingController } from "@/hooks/useMessagingController";
import { useAuth } from "@/contexts/useAuth";

const AdminMessages = () => {
  const { user } = useAuth();
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(
    null
  );

  const controller = useMessagingController({
    currentUserId: user?.id,
    currentUserRole: "admin",
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
        title="Admin Messages"
        description="Communicate with heads across the school from the admin console."
        listTitle="Heads of School"
        listDescription="Select a head of school to view or reply to conversations."
        contacts={controller.contacts}
        selectedConversationId={controller.selectedConversationId}
        messages={controller.messages}
        currentUserRole="admin"
        currentUserId={controller.currentUserId}
        onSelectConversation={controller.onSelectConversation}
        onSendMessage={controller.onSendMessage}
        messageDraft={controller.messageDraft}
        onChangeDraft={controller.onChangeDraft}
        isLoadingContacts={controller.isLoadingContacts}
        isLoadingThread={controller.isLoadingThread}
        isSendingMessage={controller.isSendingMessage}
        onCompose={handleOpenCompose}
        composeDisabled={controller.isRecipientsLoading}
        emptyStateMessage="No conversations yet. Start by selecting a head of school."
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
        description="Administrators can message heads of school."
        confirmLabel="Start conversation"
      />
    </>
  );
};

export default AdminMessages;
