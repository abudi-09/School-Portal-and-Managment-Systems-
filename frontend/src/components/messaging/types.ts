import type { PresenceRecord } from "@/contexts/PresenceContext";

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
  type: "text" | "image" | "file" | "doc" | "voice" | "video";
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
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
    type: "text" | "image" | "file" | "doc" | "voice" | "video";
    snippet: string;
  };
  replyToDeleted?: boolean;
  isPending?: boolean;
  reactions?: Array<{ emoji: string; users: string[] }>;
  voiceDuration?: number;
  voiceWaveform?: number[]; // 0..1 normalized values
  voicePlayedBy?: string[];
  isUploadError?: boolean; // local only for retry display
  isUploading?: boolean; // local pending state
}

export interface ContactItem {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  email?: string;
  online?: boolean;
  presence?: PresenceRecord;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    timestamp: string;
    timestampIso: string;
    senderRole: UserRole;
  };
  lastMessageAt?: string;
}

export interface MessagingCenterProps {
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
      mimeType?: string;
      fileSize?: number;
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
  onToggleReaction?: (
    conversationId: string,
    messageId: string,
    emoji: string
  ) => Promise<void> | void;
  onSaveMessage?: (
    conversationId: string,
    messageId: string
  ) => Promise<void> | void;
  onSendVoice?: (
    conversationId: string,
    audioBlob: Blob,
    duration: number,
    waveform: number[]
  ) => Promise<void> | void;
  onSearchSavedMessages?: (
    query: string
  ) => Promise<MessageItem[]> | MessageItem[];
  isUploadingAttachment?: boolean;
  messageDraft?: string;
  onChangeDraft?: (conversationId: string, content: string) => void;
  isLoadingContacts?: boolean;
  isLoadingThread?: boolean;
  isSendingMessage?: boolean;
  onCompose?: () => void;
  composeDisabled?: boolean;
  composeLabel?: string;
  emptyStateMessage?: string;
  disallowedRecipientMessage?: string;
  validateRecipient?: (contact: ContactItem) => boolean;

  // New actions
  onReplyMessage?: (message: MessageItem) => void;
  onForwardMessage?: (message: MessageItem) => void;
  onPinMessage?: (message: MessageItem) => void;
  onSelectMessage?: (message: MessageItem) => void;
  onCopyMessage?: (content: string) => void;
  replyingTo?: MessageItem | null;
  onCancelReply?: () => void;
  pinnedMessages?: Set<string>;
}
