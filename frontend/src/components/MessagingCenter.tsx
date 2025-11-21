import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
// CSS for Emoji Mart omitted due to package unavailability
import {
  Send,
  Paperclip,
  Search,
  Plus,
  Check,
  CheckSquare,
  Pin,
  Reply,
  Forward,
  Clipboard,
  Edit,
  Trash,
  Bookmark,
  File as FileIcon,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  Video,
  Smile,
  Mic,
  Pause,
  Play,
} from "lucide-react";
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
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";
import ForwardMessageDialog from "./messaging/ForwardMessageDialog";
import {
  fetchRecipients,
  forwardMessage,
  uploadMessageFileWithProgress,
} from "@/lib/api/messagesApi";
import { useToast } from "@/hooks/use-toast";
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
  type: "text" | "image" | "file" | "doc" | "voice";
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
    type: "text" | "image" | "file" | "doc";
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
  onSearchSavedMessages?: (query: string) => Promise<void> | void;
  isUploadingAttachment?: boolean;
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

// Resolve avatar source from several possible fields to be tolerant
const getAvatarSrc = (
  contact: ContactItem | Record<string, unknown> | undefined
) => {
  if (!contact) return undefined;
  const c = contact as Record<string, unknown>;
  return (
    (c["avatarUrl"] as string | undefined) ||
    (c["avatar"] as string | undefined) ||
    ((c["profile"] as Record<string, unknown> | undefined)?.["avatar"] as
      | string
      | undefined) ||
    (c["photo"] as string | undefined) ||
    (c["picture"] as string | undefined) ||
    undefined
  );
};

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

const DELETED_MESSAGE_TEXT = "This message was deleted.";

const getMessageTypeLabel = (type: MessageItem["type"]) => {
  switch (type) {
    case "image":
      return "Photo";
    case "doc":
      return "Document";
    case "file":
      return "File";
    default:
      return "Message";
  }
};

const formatFileSize = (size?: number) => {
  if (!size || typeof size !== "number") return undefined;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

// Sidebar collapse state: used on small screens to toggle visibility
const SIDEBAR_COLLAPSED_WIDTH = 64; // px when collapsed

const isImageMime = (mime?: string) => {
  if (!mime) return false;
  return mime.startsWith("image/");
};

const getReplyPreviewText = (message: MessageItem) => {
  if (message.deleted) {
    return DELETED_MESSAGE_TEXT;
  }

  const content = (message.content ?? "").trim();

  if (message.type === "text" && content.length > 0) {
    return content;
  }

  if (message.fileName) {
    return message.fileName;
  }

  if (content.length > 0) {
    return content;
  }

  return getMessageTypeLabel(message.type);
};

const getReplyHeaderLabel = (
  message: MessageItem,
  currentUserId?: string,
  participantName?: string
) => {
  if (message.deleted) {
    return "Replying to a deleted message";
  }

  if (currentUserId && message.senderId === currentUserId) {
    return "Replying to yourself";
  }

  if (participantName) {
    return `Replying to ${participantName}`;
  }

  return `Replying to ${formatRoleLabel(message.senderRole)}`;
};

const isPresenceOnline = (
  presence?: PresenceRecord,
  fallbackOnline?: boolean
) => {
  if (presence) {
    return presence.visibleStatus === "online" && !presence.hidden;
  }
  return Boolean(fallbackOnline);
};

const formatPresenceLabel = (
  presence?: PresenceRecord,
  fallbackOnline?: boolean
) => {
  if (isPresenceOnline(presence, fallbackOnline)) {
    return "Online";
  }

  const hidden = presence?.hidden ?? false;
  const lastSeenAt = presence?.lastSeenAt;
  if (!lastSeenAt) {
    return hidden ? "Last seen recently" : "Offline";
  }

  const date = new Date(lastSeenAt);
  if (Number.isNaN(date.getTime())) {
    return hidden ? "Last seen recently" : `Last seen ${lastSeenAt}`;
  }

  const minutesAgo = (Date.now() - date.getTime()) / 60000;
  if (hidden && minutesAgo <= 5) {
    return "Last seen recently";
  }

  const now = new Date();
  const sameDay = now.toDateString() === date.toDateString();
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) {
    return `Last seen at ${timeFormatter.format(date)}`;
  }
  const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `Last seen ${dateTimeFormatter.format(date)}`;
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
  onEditMessage,
  onDeleteMessage,
  onToggleReaction,
  onSaveMessage,
  onSearchSavedMessages,
  messageDraft,
  onChangeDraft,
  isUploadingAttachment,
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
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDeleteMessage, setPendingDeleteMessage] =
    useState<MessageItem | null>(null);
  const [pendingPinMessage, setPendingPinMessage] =
    useState<MessageItem | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingOriginal, setEditingOriginal] = useState<string | null>(null);
  const [forwardingMessage, setForwardingMessage] =
    useState<MessageItem | null>(null);
  const [forwardRecipients, setForwardRecipients] = useState<
    import("@/lib/api/messagesApi").RecipientDto[]
  >([]);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [forwardSelectedId, setForwardSelectedId] = useState<string | null>(
    null
  );
  const [forwardPage, setForwardPage] = useState(1);
  const [forwardHasMore, setForwardHasMore] = useState(false);
  const [uploadItems, setUploadItems] = useState<
    Array<{
      id: string;
      file: File;
      previewUrl?: string;
      progress: number; // 0..100
      status: "uploading" | "done" | "error" | "canceled";
      cancel?: () => void;
      result?: {
        fileUrl: string;
        fileName: string;
        mimeType: string;
        size: number;
      };
    }>
  >([]);
  const hasActiveUploads = uploadItems.some((u) => u.status === "uploading");
  const [isDragging, setIsDragging] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);
  const emojiToggleRef = useRef<HTMLButtonElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const lastSelection = useRef<{ start: number; end: number } | null>(null);
  const [activeReactionFor, setActiveReactionFor] = useState<string | null>(
    null
  );
  const reactionEmojis = ["❤️", "👍", "😂", "😢", "😡", "🔥", "🎉"];
  // Voice recording & playback state
  const [isRecording, setIsRecording] = useState(false);
  const [recordCanceled, setRecordCanceled] = useState(false);
  const [recordStartX, setRecordStartX] = useState<number | null>(null);
  const [pendingVoiceBlob, setPendingVoiceBlob] = useState<Blob | null>(null);
  const [pendingVoiceDuration, setPendingVoiceDuration] = useState<number>(0);
  const [pendingVoiceWaveform, setPendingVoiceWaveform] = useState<number[]>(
    []
  );
  const [currentPlayingVoiceId, setCurrentPlayingVoiceId] = useState<
    string | null
  >(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const cancelThreshold = 80; // px slide left to cancel

  const formatVoiceDuration = (seconds?: number) => {
    if (!seconds || Number.isNaN(seconds)) return "0:00";
    const s = Math.max(0, Math.round(seconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  const [pendingVoiceMessage, setPendingVoiceMessage] =
    useState<MessageItem | null>(null);
  const autoSendVoice = true;

  const {
    start: startRecording,
    stop: stopRecording,
    cancel: cancelRecording,
    duration: recordingDuration,
  } = useVoiceRecorder({
    onData: (blob: Blob, duration: number, waveform: number[]) => {
      setPendingVoiceBlob(blob);
      setPendingVoiceDuration(duration);
      setPendingVoiceWaveform(waveform);
      setIsRecording(false);
      setRecordCanceled(false);
    },
    onError: (err: Error) => {
      console.error("Voice recorder error", err);
    },
  });

  const startVoiceRecording = async () => {
    setPendingVoiceBlob(null);
    setPendingVoiceDuration(0);
    setPendingVoiceWaveform([]);
    setRecordCanceled(false);
    try {
      await startRecording();
      setIsRecording(true);
    } catch (e) {
      console.error("Failed to start recording", e);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      await stopRecording();
    } catch (e) {
      // ignore stop error
    }
  };

  const cancelVoiceRecording = () => {
    cancelRecording();
    setRecordCanceled(true);
    setIsRecording(false);
    setPendingVoiceBlob(null);
    setPendingVoiceDuration(0);
    setPendingVoiceWaveform([]);
  };

  const handleSendVoice = async () => {
    if (!pendingVoiceBlob || !selectedConversationId || !onSendMessage) return;
    // Upload voice blob using existing file upload logic
    const voiceFile = new File([pendingVoiceBlob], `voice-${Date.now()}.webm`, {
      type: pendingVoiceBlob.type || "audio/webm",
    });
    // Create local placeholder
    const placeholderId = `pending-voice-${Date.now()}`;
    const objectUrl = URL.createObjectURL(voiceFile);
    const placeholder: MessageItem = {
      id: placeholderId,
      senderId: currentUserId || "me",
      senderRole: currentUserRole,
      receiverId: selectedConversationId,
      receiverRole: selectedContact?.role || currentUserRole,
      content: "",
      timestamp: new Date().toLocaleTimeString(),
      timestampIso: new Date().toISOString(),
      status: "unread",
      type: "voice",
      fileUrl: objectUrl,
      fileName: voiceFile.name,
      mimeType: voiceFile.type,
      fileSize: voiceFile.size,
      deleted: false,
      deliveredTo: [],
      seenBy: [],
      isPending: true,
      isUploading: true,
      voiceDuration: pendingVoiceDuration,
      voiceWaveform: pendingVoiceWaveform,
      voicePlayedBy: [],
    };
    setPendingVoiceMessage(placeholder);
    const { uploadMessageFileWithProgress } = await import(
      "@/lib/api/messagesApi"
    );
    const { sendVoiceMessage } = await import("@/lib/api/messagesApi");
    let uploaded;
    try {
      const { promise } = uploadMessageFileWithProgress(voiceFile);
      uploaded = await promise;
    } catch (e) {
      console.error("Voice upload failed", e);
      toast({ title: "Voice message failed to send." });
      setPendingVoiceMessage((prev) =>
        prev ? { ...prev, isUploading: false, isUploadError: true } : prev
      );
      return;
    }
    try {
      await sendVoiceMessage(
        selectedConversationId,
        uploaded.fileUrl,
        uploaded.fileName,
        uploaded.mimeType,
        pendingVoiceDuration,
        pendingVoiceWaveform
      );
      setPendingVoiceBlob(null);
      setPendingVoiceDuration(0);
      setPendingVoiceWaveform([]);
      // Remove placeholder after short delay (server will emit real message)
      setTimeout(() => setPendingVoiceMessage(null), 1200);
    } catch (e) {
      console.error("Send voice message failed", e);
      toast({ title: "Voice message failed to send." });
      setPendingVoiceMessage((prev) =>
        prev ? { ...prev, isUploading: false, isUploadError: true } : prev
      );
    }
  };

  const handlePlayVoice = async (message: MessageItem) => {
    if (!message.fileUrl) return;
    // Pause previous
    if (currentPlayingVoiceId && currentPlayingVoiceId !== message.id) {
      const prev = audioRefs.current.get(currentPlayingVoiceId);
      if (prev) {
        prev.pause();
      }
    }
    let audio = audioRefs.current.get(message.id);
    if (!audio) {
      audio = new Audio(message.fileUrl);
      audioRefs.current.set(message.id, audio);
      audio.onended = () => {
        if (currentPlayingVoiceId === message.id) {
          setCurrentPlayingVoiceId(null);
        }
      };
      // Mark played if first time
      if (
        currentUserId &&
        !message.voicePlayedBy?.includes(currentUserId) &&
        message.senderId !== currentUserId
      ) {
        try {
          const { markVoicePlayed } = await import("@/lib/api/messagesApi");
          await markVoicePlayed(message.id);
        } catch (e) {
          console.error("Failed to mark voice played", e);
        }
      }
    }
    if (currentPlayingVoiceId === message.id) {
      // Currently playing -> pause
      audio.pause();
      setCurrentPlayingVoiceId(null);
    } else {
      try {
        await audio.play();
        setCurrentPlayingVoiceId(message.id);
      } catch (e) {
        console.error("Play failed", e);
      }
    }
  };

  // Remove pending voice placeholder once a real voice message from self appears
  useEffect(() => {
    if (!pendingVoiceMessage || !pendingVoiceMessage.isPending) return;
    const realVoice = messages.find(
      (m) =>
        m.type === "voice" &&
        !m.isPending &&
        m.senderId === pendingVoiceMessage.senderId &&
        Math.abs(
          new Date(m.timestampIso).getTime() -
            new Date(pendingVoiceMessage.timestampIso).getTime()
        ) < 15000 &&
        Math.abs(
          (m.voiceDuration || 0) - (pendingVoiceMessage.voiceDuration || 0)
        ) < 2
    );
    if (realVoice) {
      setPendingVoiceMessage(null);
    }
  }, [messages, pendingVoiceMessage]);

  // Auto send when recording completes if enabled
  useEffect(() => {
    if (autoSendVoice && pendingVoiceBlob && !isRecording && !recordCanceled) {
      handleSendVoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingVoiceBlob, isRecording, recordCanceled]);

  const { toast } = useToast();

  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      // Revoke any object URLs when unmounting
      uploadItems.forEach(
        (u) => u.previewUrl && URL.revokeObjectURL(u.previewUrl)
      );
    };
  }, [uploadItems]);

  // Close emoji panel on outside click
  useEffect(() => {
    if (!showEmojiPanel) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(target) &&
        emojiToggleRef.current &&
        !emojiToggleRef.current.contains(target)
      ) {
        setShowEmojiPanel(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowEmojiPanel(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keyup", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keyup", onKey);
    };
  }, [showEmojiPanel]);

  const adjustComposerHeight = useCallback(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 160; // px ~ up to ~6 lines depending on font
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    // adjust when messageDraft changes from outside
    adjustComposerHeight();
  }, [messageDraft, adjustComposerHeight]);

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
      // Allow self-chat for Saved Messages
      if (contact.id === currentUserId) return true;
      const hierarchyValid = hierarchyAllows(contact.role);
      if (!hierarchyValid) {
        return false;
      }
      if (validateRecipient) {
        return validateRecipient(contact);
      }
      return true;
    },
    [hierarchyAllows, validateRecipient, currentUserId]
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
    return (
      contacts.find((contact) => contact.id === selectedConversationId) ?? null
    );
  }, [contacts, selectedConversationId]);

  const isSavedConversation = useMemo(() => {
    return Boolean(
      selectedContact && currentUserId && selectedContact.id === currentUserId
    );
  }, [selectedContact, currentUserId]);

  const [savedSearch, setSavedSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    if (!isSavedConversation) return;
    if (!onSearchSavedMessages) return;
    void (async () => {
      try {
        await onSearchSavedMessages(savedSearch);
      } catch {
        /* noop */
      }
    })();
  }, [savedSearch, isSavedConversation, onSearchSavedMessages]);

  const selectedStatusLabel = selectedContact
    ? formatPresenceLabel(selectedContact.presence, selectedContact.online)
    : null;
  const selectedStatusOnline = selectedContact
    ? isPresenceOnline(selectedContact.presence, selectedContact.online)
    : false;

  const replyTo = useMemo(() => {
    if (!replyToMessageId) {
      return null;
    }
    return messages.find((item) => item.id === replyToMessageId) ?? null;
  }, [messages, replyToMessageId]);

  const pinnedMessages = useMemo(() => {
    if (!messages || pinnedIds.size === 0) return [] as MessageItem[];
    return messages.filter((m) => pinnedIds.has(m.id));
  }, [messages, pinnedIds]);

  const handleSelectContact = (contact: ContactItem) => {
    if (!isSelectable(contact)) {
      return;
    }
    setReplyToMessageId(null);
    setEditingMessageId(null);
    setEditingOriginal(null);
    onSelectConversation(contact.id);
  };

  const hasReadyUploads = useMemo(
    () => uploadItems.some((u) => u.status === "done" && !!u.result),
    [uploadItems]
  );

  const handleSendMessage = async () => {
    if (!selectedConversationId || !onSendMessage || sending) {
      return;
    }
    try {
      if (isSendingMessage === undefined) {
        setInternalIsSending(true);
      }
      // If we are editing, call edit handler instead of send
      if (editingMessageId && onEditMessage) {
        const trimmed = messageDraft.trim();
        await onEditMessage(selectedConversationId, editingMessageId, trimmed);
        // clear editing state
        setEditingMessageId(null);
        setEditingOriginal(null);
        onChangeDraft("");
      } else {
        // 1) Send any ready file attachments as individual messages
        for (const u of uploadItems) {
          if (u.status === "done" && u.result) {
            await onSendMessage(selectedConversationId, {
              type: determineTypeForFile(u.file),
              fileUrl: u.result.fileUrl,
              fileName: u.result.fileName,
              mimeType: u.result.mimeType,
              fileSize: u.result.size,
              replyToMessageId: replyTo?.id,
            });
          }
        }
        // 2) Send text message if provided
        const trimmed = messageDraft.trim();
        if (trimmed.length > 0) {
          await onSendMessage(selectedConversationId, {
            content: trimmed,
            replyToMessageId: replyTo?.id,
          });
        }
        onChangeDraft("");
        setReplyToMessageId(null);
        // 3) Clear uploaded items after sending
        setUploadItems([]);
      }
    } finally {
      if (isSendingMessage === undefined) {
        setInternalIsSending(false);
      }
    }
  };

  const handleEditMessage = (message: MessageItem) => {
    // Open inline editor: populate input with current message content
    if (!onEditMessage || !selectedConversationId) return;
    setEditingMessageId(message.id);
    setEditingOriginal(message.content ?? "");
    onChangeDraft(message.content ?? "");
  };

  const handleDeleteMessage = (message: MessageItem) => {
    if (!onDeleteMessage || !selectedConversationId) return;
    setPendingDeleteMessage(message);
  };

  const handleCopyMessage = async (message: MessageItem) => {
    try {
      if (message.content) {
        await navigator.clipboard.writeText(message.content);
      }
    } catch {
      /* noop */
    }
  };

  const handlePinMessage = (message: MessageItem) => {
    setPendingPinMessage(message);
  };

  const handleSelectMessage = (message: MessageItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(message.id)) {
        next.delete(message.id);
      } else {
        next.add(message.id);
      }
      return next;
    });
  };

  const handleCancelDelete = useCallback(() => {
    setPendingDeleteMessage(null);
  }, []);

  const handleConfirmDelete = useCallback(
    async (forEveryone: boolean) => {
      if (
        !pendingDeleteMessage ||
        !onDeleteMessage ||
        !selectedConversationId
      ) {
        setPendingDeleteMessage(null);
        return;
      }
      const message = pendingDeleteMessage;
      setPendingDeleteMessage(null);
      try {
        await onDeleteMessage(selectedConversationId, message.id, {
          forEveryone,
        });
      } catch {
        // controller handles surface errors (toast, etc.)
      }
    },
    [pendingDeleteMessage, onDeleteMessage, selectedConversationId]
  );

  const handleCancelPin = useCallback(() => {
    setPendingPinMessage(null);
  }, []);

  const handleConfirmPin = useCallback(() => {
    if (!pendingPinMessage) {
      setPendingPinMessage(null);
      return;
    }
    const message = pendingPinMessage;
    setPendingPinMessage(null);
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(message.id)) {
        next.delete(message.id);
      } else {
        next.add(message.id);
      }
      return next;
    });
  }, [pendingPinMessage]);

  const handleReplyMessage = (message: MessageItem) => {
    setReplyToMessageId(message.id);
  };

  const handleSaveMessage = async (message: MessageItem) => {
    if (!onSaveMessage || !selectedConversationId) return;
    try {
      await onSaveMessage(selectedConversationId, message.id);
    } catch {
      // Errors are surfaced by controller via toast
    }
  };

  const acceptTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    ".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov,.pdf,.docx,.xlsx,.pptx,.txt",
  ].join(",");

  const onClickAttach = () => {
    if (!selectedConversationId) return;
    fileInputRef.current?.click();
  };

  const insertAtCursor = (text: string) => {
    const el = composerRef.current;
    // Fallback to appending if no ref
    if (!el) {
      onChangeDraft(messageDraft + text);
      return;
    }
    const start =
      el.selectionStart ?? lastSelection.current?.start ?? messageDraft.length;
    const end =
      el.selectionEnd ?? lastSelection.current?.end ?? messageDraft.length;
    const next = messageDraft.slice(0, start) + text + messageDraft.slice(end);
    const caret = start + text.length;
    onChangeDraft(next);
    requestAnimationFrame(() => {
      try {
        el.focus();
        el.setSelectionRange(caret, caret);
        lastSelection.current = { start: caret, end: caret };
        adjustComposerHeight();
      } catch {
        /* noop */
      }
    });
  };

  const determineTypeForFile = (file: File): MessageItem["type"] =>
    file.type.startsWith("image/") ? "image" : "file";

  const getExt = (name?: string) =>
    (name?.split(".").pop() || "").toLowerCase();
  const pickFileIcon = (mime?: string, name?: string) => {
    const ext = getExt(name);
    if (
      mime?.startsWith("image/") ||
      ["jpg", "jpeg", "png", "webp"].includes(ext)
    )
      return ImageIcon;
    if (mime?.startsWith("video/") || ["mp4", "webm", "mov"].includes(ext))
      return Video;
    if (mime === "application/pdf" || ext === "pdf") return FileText;
    if (
      mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx"
    )
      return FileText;
    if (
      mime ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      ext === "xlsx"
    )
      return FileSpreadsheet;
    if (
      mime ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      ext === "pptx"
    )
      return FileText;
    if (mime === "application/zip" || ext === "zip") return FileArchive;
    if (ext === "txt") return FileText;
    return FileIcon;
  };
  const handleFilesSelected = (files: FileList | File[] | null) => {
    if (!files || !selectedConversationId || !onSendMessage) return;
    const MAX_SIZE = 10 * 1024 * 1024;

    const filesArray: File[] = Array.isArray(files) ? files : Array.from(files);

    filesArray.forEach((file) => {
      if (file.size > MAX_SIZE) {
        // Skip oversize files; a toast would be nicer but keep minimal here
        return;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;
      setUploadItems((prev) => [
        ...prev,
        { id, file, previewUrl, progress: 0, status: "uploading" },
      ]);

      const { promise, cancel } = uploadMessageFileWithProgress(
        file,
        (loaded, total) => {
          const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
          setUploadItems((prev) =>
            prev.map((u) => (u.id === id ? { ...u, progress: pct } : u))
          );
        }
      );

      setUploadItems((prev) =>
        prev.map((u) => (u.id === id ? { ...u, cancel } : u))
      );

      promise
        .then(async (result) => {
          setUploadItems((prev) =>
            prev.map((u) =>
              u.id === id ? { ...u, status: "done", result, progress: 100 } : u
            )
          );
          // confirmation toast: uploaded and ready to send
          try {
            toast({
              title: "Attachment ready",
              description: `${result.fileName} uploaded. Click Send to deliver.`,
            });
          } catch {
            /* noop */
          }
        })
        .catch(() => {
          setUploadItems((prev) =>
            prev.map((u) => (u.id === id ? { ...u, status: "error" } : u))
          );
        });
    });
  };

  const cancelUpload = (id: string) => {
    setUploadItems((prev) => {
      const item = prev.find((u) => u.id === id);
      if (item?.cancel) {
        try {
          item.cancel();
        } catch {
          /* noop */
        }
      }
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.map((u) => (u.id === id ? { ...u, status: "canceled" } : u));
    });
    // remove canceled from view after a bit
    setTimeout(() => {
      setUploadItems((prev) => prev.filter((u) => u.id !== id));
    }, 400);
  };

  const handleForwardMessage = async (message: MessageItem) => {
    // Open forward dialog and fetch recipients from remote API
    setForwardingMessage(message);
    setForwardSelectedId(null);
    setForwardRecipients([]);
    setForwardLoading(true);
    setForwardPage(1);
    setForwardHasMore(false);
    try {
      const { recipients, hasMore } = await fetchRecipients(1, 20);
      setForwardRecipients(recipients);
      setForwardHasMore(hasMore);
    } catch (e) {
      setForwardRecipients([]);
      setForwardHasMore(false);
    } finally {
      setForwardLoading(false);
    }
  };

  const closeForwardDialog = () => {
    setForwardingMessage(null);
    setForwardSelectedId(null);
    setForwardRecipients([]);
    setForwardLoading(false);
    setForwardPage(1);
    setForwardHasMore(false);
  };

  const loadMoreForwardRecipients = async () => {
    if (forwardLoading || !forwardHasMore) return;
    setForwardLoading(true);
    try {
      const nextPage = forwardPage + 1;
      const { recipients, hasMore } = await fetchRecipients(nextPage, 20);
      setForwardRecipients((prev) => [...prev, ...recipients]);
      setForwardHasMore(hasMore);
      setForwardPage(nextPage);
    } catch (e) {
      // ignore
    } finally {
      setForwardLoading(false);
    }
  };

  const confirmForward = async () => {
    if (!forwardingMessage || !forwardSelectedId) return;
    setForwardLoading(true);
    try {
      await forwardMessage(forwardingMessage.id, forwardSelectedId);
      toast({
        title: "Message forwarded",
        description: "Your message was forwarded successfully.",
      });
      closeForwardDialog();
    } catch (err: unknown) {
      const description =
        err instanceof Error
          ? err.message
          : "Unable to forward message. Please try again.";
      toast({
        variant: "destructive",
        title: "Forward failed",
        description,
      });
    } finally {
      setForwardLoading(false);
    }
  };

  const clearReply = () => setReplyToMessageId(null);

  const handleReplyPreviewClick = (message: MessageItem) => {
    if (
      !message.replyTo ||
      !message.replyTo.messageId ||
      message.replyToDeleted
    ) {
      return;
    }

    const originalId = message.replyTo.messageId;
    const originalElement = messageRefs.current[originalId];

    if (!originalElement) {
      return;
    }

    originalElement.scrollIntoView({ behavior: "smooth", block: "center" });

    originalElement.classList.add("ring-2", "ring-blue-400");

    window.setTimeout(() => {
      originalElement.classList.remove("ring-2", "ring-blue-400");
    }, 1200);
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

            {forwardingMessage ? (
              <ForwardMessageDialog
                open={Boolean(forwardingMessage)}
                onOpenChange={(open: boolean) => {
                  if (!open) closeForwardDialog();
                }}
                recipients={forwardRecipients}
                isLoading={forwardLoading}
                selectedId={forwardSelectedId}
                onSelectRecipient={setForwardSelectedId}
                onConfirm={confirmForward}
                hasMore={forwardHasMore}
                onLoadMore={loadMoreForwardRecipients}
              />
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
              <Plus className="h-4 w-4" /> {composeLabel}
            </Button>
          ) : null}
        </header>
        <div className="grid gap-6 md:grid-cols-[320px,1fr] sm:grid-cols-[240px,1fr] lg:grid-cols-[360px,1fr]">
          <Card className="h-fit md:sticky md:top-24">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{listTitle}</CardTitle>
                <div className="sm:hidden">
                  <button
                    type="button"
                    aria-label={
                      sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                    }
                    onClick={() => setSidebarCollapsed((s) => !s)}
                    className="p-1 rounded hover:bg-muted/10"
                  >
                    {sidebarCollapsed ? (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
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
                    const online = isPresenceOnline(
                      contact.presence,
                      contact.online
                    );
                    const statusLabel = formatPresenceLabel(
                      contact.presence,
                      contact.online
                    );
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
                            {getAvatarSrc(contact) ? (
                              <AvatarImage
                                src={String(getAvatarSrc(contact))}
                                alt={contact.name}
                              />
                            ) : null}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {contact.id === currentUserId ? (
                                <Bookmark className="h-6 w-6" />
                              ) : (
                                getInitials(contact.name)
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {contact.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatRoleLabel(contact.role)}
                                </p>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-xs text-muted-foreground">
                                  {lastMessage
                                    ? lastMessage.timestamp
                                    : statusLabel}
                                </span>
                                {contact.unreadCount ? (
                                  <span className="mt-1 inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white">
                                    {contact.unreadCount}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            {lastMessage ? (
                              <div className="mt-1 text-xs text-muted-foreground">
                                <p className="truncate">
                                  {lastMessage.content}
                                </p>
                              </div>
                            ) : (
                              <p className="mt-1 text-xs text-muted-foreground">
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
                    <Avatar className="min-w-[48px] min-h-[48px] h-12 w-12 border border-border">
                      {getAvatarSrc(selectedContact) ? (
                        <AvatarImage
                          src={String(getAvatarSrc(selectedContact))}
                          alt={selectedContact.name}
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedContact.id === currentUserId ? (
                          <Bookmark className="h-6 w-6" />
                        ) : (
                          getInitials(selectedContact.name)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">
                        {selectedContact.name}
                      </CardTitle>
                      <CardDescription>
                        {formatRoleLabel(selectedContact.role)}
                      </CardDescription>
                      {selectedStatusLabel ? (
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              selectedStatusOnline
                                ? "bg-green-500"
                                : "bg-gray-400"
                            )}
                          />
                          <span>{selectedStatusLabel}</span>
                        </p>
                      ) : null}
                      {selectedContact.email ? (
                        <p className="text-xs text-muted-foreground">
                          {selectedContact.email}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-6">
                  {isSavedConversation ? (
                    <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 text-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-primary">
                          This is your personal cloud storage.
                        </p>
                        <div className="relative">
                          <input
                            type="text"
                            value={savedSearch}
                            onChange={(e) => setSavedSearch(e.target.value)}
                            placeholder="Search Saved Messages"
                            className="w-full rounded-md border border-border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 sm:w-80"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {pinnedMessages.length > 0 ? (
                    <div className="rounded-2xl border border-yellow-300/60 bg-yellow-50/60 p-3 dark:border-yellow-800/60 dark:bg-yellow-950/20">
                      <div className="mb-2 flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                        <Pin className="h-4 w-4" />
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          Pinned
                        </p>
                      </div>
                      <div className="space-y-2">
                        {pinnedMessages.map((msg) => {
                          const isSelf =
                            msg.senderId === currentUserId ||
                            (!currentUserId &&
                              msg.senderRole === currentUserRole);
                          return (
                            <div
                              key={msg.id}
                              className="group relative rounded-xl border border-yellow-200 bg-background/70 px-3 py-2 text-sm dark:border-yellow-900"
                            >
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-[11px] font-medium text-muted-foreground">
                                  {isSelf
                                    ? "You"
                                    : selectedContact?.name ?? "User"}
                                </span>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                  <span>{msg.timestamp}</span>
                                  <button
                                    type="button"
                                    className="rounded-md px-2 py-0.5 text-xs hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                                    onClick={() => handlePinMessage(msg)}
                                  >
                                    Unpin
                                  </button>
                                </div>
                              </div>
                              {msg.fileUrl ? (
                                isImageMime(msg.mimeType) ||
                                msg.type === "image" ? (
                                  <a
                                    href={msg.fileUrl}
                                    download={msg.fileName || true}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="inline-block rounded-md"
                                  >
                                    <img
                                      src={msg.fileUrl}
                                      alt={msg.fileName ?? "image"}
                                      className="max-h-28 w-auto rounded-md object-cover"
                                    />
                                    <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-2">
                                      <span className="font-medium">
                                        {msg.fileName ?? "Image"}
                                      </span>
                                      {msg.fileSize ? (
                                        <span>
                                          {formatFileSize(msg.fileSize)}
                                        </span>
                                      ) : null}
                                      <a
                                        href={msg.fileUrl}
                                        download={msg.fileName || true}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="text-xs underline hover:no-underline"
                                      >
                                        Download
                                      </a>
                                    </div>
                                  </a>
                                ) : msg.mimeType?.startsWith("video/") ||
                                  msg.type === "video" ? (
                                  <div className="inline-block rounded-md">
                                    <video
                                      src={msg.fileUrl}
                                      controls
                                      className="max-h-28 w-auto rounded-md"
                                      preload="metadata"
                                    />
                                    <div className="mt-1 text-[11px] text-muted-foreground flex items-center gap-2">
                                      <span className="font-medium">
                                        {msg.fileName ?? "Video"}
                                      </span>
                                      {msg.fileSize ? (
                                        <span>
                                          {formatFileSize(msg.fileSize)}
                                        </span>
                                      ) : null}
                                      <a
                                        href={msg.fileUrl}
                                        download={msg.fileName || true}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="text-xs underline hover:no-underline"
                                      >
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-background/30 px-3 py-2 hover:bg-background/50 transition-colors">
                                    {(() => {
                                      const Icon = pickFileIcon(
                                        msg.mimeType,
                                        msg.fileName
                                      );
                                      return (
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                      );
                                    })()}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate">
                                        {msg.fileName ?? "File"}
                                      </div>
                                      {msg.fileSize ? (
                                        <div className="text-xs text-muted-foreground">
                                          {formatFileSize(msg.fileSize)}
                                        </div>
                                      ) : null}
                                    </div>
                                    <a
                                      href={msg.fileUrl}
                                      download={msg.fileName || true}
                                      target="_blank"
                                      rel="noreferrer noopener"
                                      className="p-1 rounded hover:bg-background/70 transition-colors"
                                      title="Download"
                                    >
                                      <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                    </a>
                                  </div>
                                )
                              ) : null}
                              {msg.content ? (
                                <p className="leading-relaxed">{msg.content}</p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
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
                        (pendingVoiceMessage
                          ? [...messages, pendingVoiceMessage]
                          : messages
                        ).map((message) => {
                          const isSelf =
                            message.senderId === currentUserId ||
                            (!currentUserId &&
                              message.senderRole === currentUserRole);
                          const isPinned = pinnedIds.has(message.id);
                          const isSelected = selectedIds.has(message.id);
                          return (
                            <ContextMenu key={message.id}>
                              <ContextMenuTrigger asChild>
                                <div
                                  className={cn(
                                    "flex",
                                    isSelf ? "justify-end" : "justify-start"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "group relative max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-colors",
                                      isSelf
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground",
                                      isSelected && "ring-2 ring-ring",
                                      isPinned &&
                                        "border-2 border-yellow-500 hover:border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                                    )}
                                    ref={(el) => {
                                      messageRefs.current[message.id] = el;
                                    }}
                                    onMouseEnter={() =>
                                      setActiveReactionFor(message.id)
                                    }
                                    onMouseLeave={() =>
                                      setActiveReactionFor((cur) =>
                                        cur === message.id ? null : cur
                                      )
                                    }
                                    onTouchStart={() => {
                                      setActiveReactionFor(message.id);
                                    }}
                                  >
                                    {/* Reaction bar above bubble */}
                                    <div
                                      className={cn(
                                        "absolute -top-9 z-10 rounded-full border border-border bg-card/95 px-2 py-1 shadow-md transition-all duration-150",
                                        isSelf ? "right-2" : "left-2",
                                        activeReactionFor === message.id
                                          ? "opacity-100 translate-y-0"
                                          : "pointer-events-none opacity-0 translate-y-1",
                                        "group-hover:opacity-100 group-hover:translate-y-0"
                                      )}
                                      onMouseLeave={() =>
                                        setActiveReactionFor(null)
                                      }
                                    >
                                      <div className="flex items-center gap-1">
                                        {reactionEmojis.map((e) => (
                                          <button
                                            key={e}
                                            type="button"
                                            className="h-7 w-7 rounded-full text-lg hover:bg-muted flex items-center justify-center"
                                            onClick={() => {
                                              if (!selectedConversationId)
                                                return;
                                              onToggleReaction?.(
                                                selectedConversationId,
                                                message.id,
                                                e
                                              );
                                            }}
                                          >
                                            {e}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    {isPinned ? (
                                      <Pin className="absolute -top-2 -right-2 h-4 w-4 rotate-12 text-yellow-500" />
                                    ) : null}
                                    <div className="space-y-2">
                                      {message.replyTo ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleReplyPreviewClick(message)
                                          }
                                          disabled={message.replyToDeleted}
                                          aria-disabled={message.replyToDeleted}
                                          className={cn(
                                            "mb-1 flex w-full items-start gap-2 rounded-md bg-background/40 px-2 py-1 text-xs text-left",
                                            isSelf
                                              ? "text-primary-foreground/80"
                                              : "text-muted-foreground",
                                            message.replyToDeleted
                                              ? "cursor-not-allowed opacity-80"
                                              : "hover:bg-background/60"
                                          )}
                                        >
                                          <div className="border-l-2 border-primary/60 pr-1" />
                                          <div className="min-w-0 flex-1">
                                            <p className="font-semibold truncate">
                                              {message.replyTo.senderName ||
                                                "Unknown"}
                                            </p>
                                            <p
                                              className={cn(
                                                "truncate",
                                                message.replyToDeleted
                                                  ? "italic"
                                                  : undefined
                                              )}
                                            >
                                              {message.replyToDeleted
                                                ? DELETED_MESSAGE_TEXT
                                                : message.replyTo.snippet ||
                                                  getMessageTypeLabel(
                                                    message.replyTo.type
                                                  )}
                                            </p>
                                          </div>
                                        </button>
                                      ) : null}
                                      {/* Voice message rendering */}
                                      {message.type === "voice" &&
                                      message.fileUrl ? (
                                        <div
                                          className={cn(
                                            "flex items-center gap-3",
                                            isSelf
                                              ? "justify-end"
                                              : "justify-start"
                                          )}
                                        >
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handlePlayVoice(message)
                                            }
                                            className={cn(
                                              "h-10 w-10 rounded-full flex items-center justify-center border border-border",
                                              currentPlayingVoiceId ===
                                                message.id
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-background text-muted-foreground hover:text-foreground"
                                            )}
                                            aria-label={
                                              currentPlayingVoiceId ===
                                              message.id
                                                ? "Pause voice message"
                                                : "Play voice message"
                                            }
                                          >
                                            {currentPlayingVoiceId ===
                                            message.id ? (
                                              <Pause className="h-5 w-5" />
                                            ) : (
                                              <Play className="h-5 w-5" />
                                            )}
                                          </button>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                              {(message.voiceWaveform &&
                                              message.voiceWaveform.length > 0
                                                ? message.voiceWaveform
                                                : Array.from(
                                                    { length: 32 },
                                                    () => 0.2
                                                  )
                                              ).map((v, i) => (
                                                <span
                                                  key={i}
                                                  className="inline-block rounded bg-primary/40"
                                                  style={{
                                                    width: "2px",
                                                    height: `${Math.max(
                                                      8,
                                                      Math.round(v * 32)
                                                    )}px`,
                                                    opacity: 0.9,
                                                  }}
                                                />
                                              ))}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                              <span>
                                                {formatVoiceDuration(
                                                  message.voiceDuration
                                                )}
                                              </span>
                                              {!message.voicePlayedBy?.includes(
                                                currentUserId || ""
                                              ) &&
                                              message.senderId !==
                                                currentUserId ? (
                                                <span
                                                  className="h-2 w-2 rounded-full bg-blue-500"
                                                  title="Unplayed"
                                                />
                                              ) : null}
                                              {message.fileName ? (
                                                <span className="truncate max-w-[140px]">
                                                  {message.fileName}
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      ) : null}
                                      {message.type === "voice" &&
                                      message.isPending &&
                                      message.isUploading ? (
                                        <div className="text-[11px] italic text-muted-foreground ml-12">
                                          Uploading…
                                        </div>
                                      ) : null}
                                      {message.type === "voice" &&
                                      message.isPending &&
                                      message.isUploadError ? (
                                        <div className="flex items-center gap-2 text-[11px] ml-12">
                                          <span className="text-red-600">
                                            Failed
                                          </span>
                                          <button
                                            type="button"
                                            className="rounded bg-red-600 px-2 py-0.5 text-white hover:bg-red-700"
                                            onClick={() => {
                                              if (pendingVoiceBlob) {
                                                setPendingVoiceMessage(null);
                                                setPendingVoiceDuration(
                                                  message.voiceDuration || 0
                                                );
                                                setPendingVoiceWaveform(
                                                  message.voiceWaveform || []
                                                );
                                                handleSendVoice();
                                              }
                                            }}
                                          >
                                            Retry
                                          </button>
                                          <button
                                            type="button"
                                            className="rounded bg-muted px-2 py-0.5 hover:bg-muted/70"
                                            onClick={() =>
                                              setPendingVoiceMessage(null)
                                            }
                                          >
                                            Dismiss
                                          </button>
                                        </div>
                                      ) : null}
                                      {/* File / image rendering */}
                                      {message.fileUrl ? (
                                        isImageMime(message.mimeType) ||
                                        message.type === "image" ? (
                                          <a
                                            href={message.fileUrl}
                                            download={message.fileName || true}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="inline-block rounded-md"
                                          >
                                            <img
                                              src={message.fileUrl}
                                              alt={message.fileName ?? "image"}
                                              className="max-h-40 w-auto rounded-md object-cover"
                                            />
                                            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                                              <span className="font-medium">
                                                {message.fileName ?? "Image"}
                                              </span>
                                              {message.mimeType ? (
                                                <span className="px-1 text-[11px] rounded bg-muted/20">
                                                  {message.mimeType}
                                                </span>
                                              ) : null}
                                              {message.fileSize ? (
                                                <span className="text-[11px] text-muted-foreground">
                                                  {formatFileSize(
                                                    message.fileSize
                                                  )}
                                                </span>
                                              ) : null}
                                            </div>
                                          </a>
                                        ) : (
                                          <div className="inline-flex items-center gap-3">
                                            <a
                                              href={message.fileUrl}
                                              download={
                                                message.fileName || true
                                              }
                                              target="_blank"
                                              rel="noreferrer noopener"
                                              className="inline-flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-1 text-sm hover:bg-background"
                                            >
                                              {(() => {
                                                const Icon = pickFileIcon(
                                                  message.mimeType,
                                                  message.fileName
                                                );
                                                return (
                                                  <Icon className="h-4 w-4" />
                                                );
                                              })()}
                                              <span className="truncate max-w-[220px]">
                                                {message.fileName ??
                                                  "Download file"}
                                              </span>
                                            </a>
                                            <div className="text-xs text-muted-foreground">
                                              {message.mimeType ? (
                                                <span className="px-1 mr-2 rounded bg-muted/20">
                                                  {message.mimeType}
                                                </span>
                                              ) : null}
                                              {message.fileSize ? (
                                                <span>
                                                  {formatFileSize(
                                                    message.fileSize
                                                  )}
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>
                                        )
                                      ) : null}
                                      {message.content &&
                                      message.content !== message.fileUrl &&
                                      !/^https?:\/\//i.test(message.content) ? (
                                        <p>{message.content}</p>
                                      ) : null}
                                      {message.reactions &&
                                      message.reactions.length > 0 ? (
                                        <div
                                          className={cn(
                                            "mt-2 inline-flex flex-wrap items-center gap-1",
                                            isSelf
                                              ? "justify-end"
                                              : "justify-start"
                                          )}
                                        >
                                          {message.reactions.map((r) => {
                                            const count = r.users.length;
                                            const mine = currentUserId
                                              ? r.users.includes(currentUserId)
                                              : false;
                                            return (
                                              <button
                                                key={`${message.id}-${r.emoji}`}
                                                type="button"
                                                onClick={() => {
                                                  if (!selectedConversationId)
                                                    return;
                                                  onToggleReaction?.(
                                                    selectedConversationId,
                                                    message.id,
                                                    r.emoji
                                                  );
                                                }}
                                                className={cn(
                                                  "rounded-full border border-border bg-background/70 px-2 py-0.5 text-xs hover:bg-background",
                                                  mine
                                                    ? "ring-1 ring-primary"
                                                    : undefined
                                                )}
                                                title={
                                                  mine
                                                    ? `You and ${Math.max(
                                                        0,
                                                        count - 1
                                                      )} others`
                                                    : `${count} reacted`
                                                }
                                              >
                                                <span className="mr-1">
                                                  {r.emoji}
                                                </span>
                                                <span className="tabular-nums">
                                                  {count}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      ) : null}
                                    </div>
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
                                      {isSelf && selectedContact ? (
                                        <span className="ml-2 flex items-center gap-1">
                                          {message.seenBy?.includes(
                                            selectedContact.id
                                          ) ? (
                                            <>
                                              <CheckSquare className="h-3 w-3" />
                                              <span className="text-xs">
                                                Seen
                                              </span>
                                            </>
                                          ) : message.deliveredTo?.includes(
                                              selectedContact.id
                                            ) ? (
                                            <>
                                              <Check className="h-3 w-3" />
                                              <span className="text-xs">
                                                Delivered
                                              </span>
                                            </>
                                          ) : null}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem
                                  onClick={() => handleReplyMessage(message)}
                                >
                                  <Reply className="mr-2 h-4 w-4" /> Reply
                                </ContextMenuItem>
                                <ContextMenuItem
                                  onClick={() => handlePinMessage(message)}
                                >
                                  <Pin className="mr-2 h-4 w-4" />{" "}
                                  {isPinned ? "Unpin" : "Pin"}
                                </ContextMenuItem>
                                {message.content ? (
                                  <ContextMenuItem
                                    onClick={() => handleCopyMessage(message)}
                                  >
                                    <Clipboard className="mr-2 h-4 w-4" /> Copy
                                    Text
                                  </ContextMenuItem>
                                ) : null}
                                {message.type === "voice" && message.fileUrl ? (
                                  <ContextMenuItem
                                    onClick={() => {
                                      navigator.clipboard
                                        .writeText(message.fileUrl!)
                                        .catch(() => {});
                                    }}
                                  >
                                    <Clipboard className="mr-2 h-4 w-4" /> Copy
                                    Voice Link
                                  </ContextMenuItem>
                                ) : null}
                                <ContextMenuItem
                                  onClick={() => handleForwardMessage(message)}
                                >
                                  <Forward className="mr-2 h-4 w-4" /> Forward
                                </ContextMenuItem>
                                {isSelf && onEditMessage ? (
                                  <ContextMenuItem
                                    onClick={() => handleEditMessage(message)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </ContextMenuItem>
                                ) : null}
                                <ContextMenuItem
                                  onClick={() => handleDeleteMessage(message)}
                                >
                                  <Trash className="mr-2 h-4 w-4" /> Delete
                                </ContextMenuItem>
                                {onSaveMessage ? (
                                  <ContextMenuItem
                                    onClick={() => handleSaveMessage(message)}
                                  >
                                    <Bookmark className="mr-2 h-4 w-4" /> Save
                                    to Saved Messages
                                  </ContextMenuItem>
                                ) : null}
                                <ContextMenuSeparator />
                                <ContextMenuItem
                                  onClick={() => handleSelectMessage(message)}
                                >
                                  {isSelected ? "Unselect" : "Select"}
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>

                  <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                    {replyTo ? (
                      <div className="flex items-start justify-between rounded-lg border border-border bg-background/60 p-3 text-xs">
                        <div className="max-w-[80%] space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {replyTo.deleted
                              ? "Deleted"
                              : getMessageTypeLabel(replyTo.type)}
                          </p>
                          <p className="font-semibold">
                            {getReplyHeaderLabel(
                              replyTo,
                              currentUserId,
                              selectedContact?.name
                            )}
                          </p>
                          <p
                            className={cn(
                              "truncate",
                              replyTo.deleted
                                ? "italic opacity-70"
                                : "opacity-80"
                            )}
                          >
                            {getReplyPreviewText(replyTo)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearReply}
                          className="text-muted-foreground transition hover:text-foreground"
                          aria-label="Cancel reply"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      {/* Upload queue preview */}
                      {uploadItems.length > 0 ? (
                        <div className="flex flex-wrap items-start gap-3">
                          {uploadItems.map((u) => (
                            <div
                              key={u.id}
                              className="rounded-md border border-border bg-background/60 p-2 text-xs"
                            >
                              <div className="flex items-start gap-2">
                                {u.previewUrl ? (
                                  <img
                                    src={u.previewUrl}
                                    className="h-12 w-12 rounded object-cover"
                                    alt={u.file.name}
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                    {(() => {
                                      const Icon = pickFileIcon(
                                        u.file.type,
                                        u.file.name
                                      );
                                      return (
                                        <Icon className="h-6 w-6 text-muted-foreground" />
                                      );
                                    })()}
                                  </div>
                                )}
                                <div className="min-w-[160px] max-w-[220px]">
                                  <div className="truncate font-medium">
                                    {u.file.name}
                                  </div>
                                  <div className="opacity-70">
                                    {(u.file.size / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                  <div className="mt-1 h-1.5 w-full rounded bg-muted">
                                    <div
                                      className={cn(
                                        "h-1.5 rounded",
                                        u.status === "error"
                                          ? "bg-red-500"
                                          : "bg-primary"
                                      )}
                                      style={{ width: `${u.progress}%` }}
                                    />
                                  </div>
                                  {u.status === "uploading" ? (
                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                      Uploading… {u.progress}%
                                    </div>
                                  ) : null}
                                  {u.status === "done" ? (
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-[11px] text-green-600">
                                        Uploaded
                                      </span>
                                      {u.result?.fileUrl ? (
                                        <a
                                          href={u.result.fileUrl}
                                          download={u.result.fileName || true}
                                          target="_blank"
                                          rel="noreferrer noopener"
                                          className="text-[11px] rounded border border-border px-2 py-0.5 hover:bg-background"
                                        >
                                          Download
                                        </a>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                                <button
                                  className="ml-2 text-muted-foreground hover:text-foreground"
                                  onClick={() => cancelUpload(u.id)}
                                  aria-label="Remove attachment"
                                >
                                  ✕
                                </button>
                              </div>
                              {u.status === "error" ? (
                                <div className="mt-1 text-red-500">
                                  Upload failed
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <div className="relative flex flex-1 items-center gap-3 rounded-full border border-border bg-background px-4 py-2">
                        <button
                          type="button"
                          onClick={onClickAttach}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Attach files"
                        >
                          <Paperclip className="h-4 w-4" />
                        </button>
                        {/* Voice recording hold-to-record button */}
                        <button
                          type="button"
                          aria-label={
                            isRecording
                              ? "Recording..."
                              : "Hold to record voice message"
                          }
                          className={cn(
                            "relative flex items-center justify-center rounded-full p-2 transition-colors",
                            isRecording
                              ? "bg-red-600 text-white"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          onPointerDown={(e) => {
                            if (e.button !== 0) return; // left click only
                            setRecordStartX(e.clientX);
                            startVoiceRecording();
                          }}
                          onPointerMove={(e) => {
                            if (!isRecording || recordStartX === null) return;
                            const delta = e.clientX - recordStartX;
                            if (delta < -cancelThreshold) {
                              cancelVoiceRecording();
                            }
                          }}
                          onPointerUp={async () => {
                            if (recordCanceled) return; // already canceled
                            if (isRecording) {
                              await stopVoiceRecording();
                            } else if (pendingVoiceBlob) {
                              await handleSendVoice();
                            }
                            setRecordStartX(null);
                          }}
                          onPointerLeave={async () => {
                            // If pointer leaves while recording treat as release
                            if (isRecording && !recordCanceled) {
                              await stopVoiceRecording();
                              setRecordStartX(null);
                            }
                          }}
                        >
                          {isRecording ? (
                            <Mic className="h-4 w-4 animate-pulse" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </button>
                        {isRecording ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">Recording</span>
                            <span className="tabular-nums">
                              {formatVoiceDuration(recordingDuration || 0)}
                            </span>
                            <span className="text-[10px]">
                              Slide left to cancel
                            </span>
                          </div>
                        ) : null}
                        {/* Auto-send enabled: intermediate send UI removed */}
                        <button
                          type="button"
                          ref={emojiToggleRef}
                          onClick={() => setShowEmojiPanel((v) => !v)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Emoji picker"
                        >
                          <Smile className="h-4 w-4" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={acceptTypes}
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const inputEl = e.currentTarget;
                            const list = inputEl.files
                              ? Array.from(inputEl.files)
                              : [];
                            // Clear the input so selecting the same file again triggers change
                            inputEl.value = "";
                            handleFilesSelected(list);
                          }}
                        />
                        <textarea
                          ref={composerRef}
                          value={messageDraft}
                          onChange={(event) => {
                            onChangeDraft(event.target.value);
                            adjustComposerHeight();
                          }}
                          onClick={() => {
                            const el = composerRef.current;
                            if (!el) return;
                            lastSelection.current = {
                              start: el.selectionStart ?? messageDraft.length,
                              end: el.selectionEnd ?? messageDraft.length,
                            };
                          }}
                          onKeyUp={() => {
                            const el = composerRef.current;
                            if (!el) return;
                            lastSelection.current = {
                              start: el.selectionStart ?? messageDraft.length,
                              end: el.selectionEnd ?? messageDraft.length,
                            };
                          }}
                          onSelect={() => {
                            const el = composerRef.current;
                            if (!el) return;
                            lastSelection.current = {
                              start: el.selectionStart ?? messageDraft.length,
                              end: el.selectionEnd ?? messageDraft.length,
                            };
                          }}
                          placeholder={
                            selectedContact
                              ? `Message ${selectedContact.name}`
                              : "Write a message"
                          }
                          rows={1}
                          className="flex-1 resize-none border-none p-0 shadow-none focus-visible:ring-0 leading-6 max-h-40 overflow-y-auto bg-transparent"
                          disabled={!onSendMessage || !selectedConversationId}
                        />

                        {/* Emoji Panel */}
                        <div
                          ref={emojiPanelRef}
                          className={cn(
                            "absolute bottom-full mb-2 right-2 z-20 w-[320px] sm:w-[360px] rounded-2xl border border-border bg-card p-2 shadow-xl transition-all duration-200",
                            showEmojiPanel
                              ? "opacity-100 translate-y-0"
                              : "pointer-events-none opacity-0 translate-y-2"
                          )}
                        >
                          <Picker
                            data={data}
                            onEmojiSelect={(emoji: unknown) => {
                              const native =
                                emoji &&
                                typeof emoji === "object" &&
                                (emoji as { native?: string }).native;
                              if (native) insertAtCursor(native);
                            }}
                            theme="auto"
                            previewPosition="none"
                            skinTonePosition="none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingMessageId ? (
                          <Button
                            type="button"
                            onClick={() => {
                              // Cancel editing
                              setEditingMessageId(null);
                              if (editingOriginal !== null) {
                                onChangeDraft("");
                              }
                            }}
                            variant="outline"
                            className="gap-2"
                          >
                            Cancel
                          </Button>
                        ) : null}

                        <Button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={
                            !(editingMessageId
                              ? onEditMessage
                              : onSendMessage) ||
                            !selectedConversationId ||
                            sending ||
                            hasActiveUploads ||
                            (!editingMessageId &&
                              !messageDraft.trim() &&
                              !hasReadyUploads)
                          }
                          className="gap-2"
                        >
                          <Send className="h-4 w-4" />
                          {hasActiveUploads
                            ? "Uploading"
                            : sending
                            ? editingMessageId
                              ? "Saving"
                              : "Sending"
                            : editingMessageId
                            ? "Save"
                            : "Send"}
                        </Button>
                      </div>
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
      <AlertDialog
        open={Boolean(pendingDeleteMessage)}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelDelete();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how you would like to remove this message. Deleting for
              everyone replaces the content with a removal notice for all
              participants. Deleting for yourself only hides it from your own
              view.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleConfirmDelete(false)}
              >
                Delete for me
              </Button>
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleConfirmDelete(true)}
              >
                Delete for everyone
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={Boolean(pendingPinMessage)}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelPin();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pinnedIds.has(pendingPinMessage?.id || "")
                ? "Unpin message?"
                : "Pin message?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pin this message. Do not move it in the chat. Instead, show it in
              the pinned area at the top of the screen while keeping the
              original message in its place in the chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={handleCancelPin}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="default"
                onClick={handleConfirmPin}
              >
                {pinnedIds.has(pendingPinMessage?.id || "") ? "Unpin" : "Pin"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessagingCenter;
