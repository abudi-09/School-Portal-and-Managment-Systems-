import { cn } from "@/lib/utils";
import { MessageItem, UserRole } from "./types";
import { format } from "date-fns";
import { Check, CheckCheck, FileIcon, Download, Play, Pause, Reply, Copy, Forward, Pin, CheckSquare, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VoicePlayer } from "./VoicePlayer";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface MessageBubbleProps {
  message: MessageItem;
  isOwn: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string;
  onReply?: (message: MessageItem) => void;
  onReact?: (message: MessageItem, emoji: string) => void;
  onForward?: (message: MessageItem) => void;
  onPin?: (message: MessageItem) => void;
  onSelect?: (message: MessageItem) => void;
  onDelete?: (message: MessageItem) => void;
  onCopy?: (content: string) => void;
}

export const MessageBubble = ({
  message,
  isOwn,
  showAvatar,
  senderName,
  senderAvatar,
  onReply,
  onForward,
  onPin,
  onSelect,
  onDelete,
  onCopy,
}: MessageBubbleProps) => {
  const isDeleted = message.deleted;

  if (isDeleted) {
    return (
      <div className={cn("flex w-full mb-2", isOwn ? "justify-end" : "justify-start")}>
        <div className="px-4 py-2 rounded-lg bg-muted/50 text-muted-foreground text-sm italic">
          This message was deleted
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    if (message.type === "text") {
      if (onCopy) {
        onCopy(message.content);
      } else {
        navigator.clipboard.writeText(message.content);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex w-full mb-4 group",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {!isOwn && showAvatar && (
        <Avatar className="w-8 h-8 mr-2 mt-1">
          <AvatarImage src={senderAvatar} />
          <AvatarFallback>{senderName?.[0]}</AvatarFallback>
        </Avatar>
      )}
      {!isOwn && !showAvatar && <div className="w-8 mr-2" />}

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "relative max-w-[75%] sm:max-w-[60%] px-4 py-2 rounded-2xl shadow-sm cursor-pointer transition-colors",
              isOwn
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm"
            )}
          >
            {/* Reply Context */}
            {message.replyTo && (
              <div
                className={cn(
                  "mb-2 p-2 rounded text-xs border-l-2 opacity-90",
                  isOwn ? "bg-primary-foreground/10 border-primary-foreground" : "bg-background/50 border-primary"
                )}
              >
                <p className="font-semibold mb-0.5">{message.replyTo.senderName}</p>
                <p className="truncate">{message.replyTo.snippet}</p>
              </div>
            )}

            {/* Content based on type */}
            {message.type === "text" && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {message.content}
              </p>
            )}

            {message.type === "image" && message.fileUrl && (
              <div className="mb-1 overflow-hidden rounded-lg">
                <img
                  src={message.fileUrl}
                  alt="Attachment"
                  className="max-w-full h-auto object-cover max-h-[300px]"
                  loading="lazy"
                />
                {message.content && <p className="mt-2 text-sm">{message.content}</p>}
              </div>
            )}

            {message.type === "file" && (
              <div className="flex items-center gap-3 p-2 rounded bg-background/10">
                <div className="p-2 rounded bg-background/20">
                  <FileIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{message.fileName}</p>
                  <p className="text-xs opacity-70">
                    {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : "File"}
                  </p>
                </div>
                {message.fileUrl && (
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-background/20 rounded transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}

            {/* Voice Message */}
            {message.type === "voice" && message.fileUrl && (
              <div className="py-1">
                <VoicePlayer
                  audioUrl={message.fileUrl}
                  duration={message.voiceDuration || 0}
                  waveform={message.voiceWaveform}
                  isOwn={isOwn}
                />
              </div>
            )}

            {/* Metadata */}
            <div
              className={cn(
                "flex items-center justify-end gap-1 mt-1 text-[10px]",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              <span>{format(new Date(message.timestampIso), "h:mm a")}</span>
              {isOwn && (
                <span>
                  {message.status === "read" ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </span>
              )}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => onReply?.(message)}>
            <Reply className="mr-2 h-4 w-4" />
            Reply
          </ContextMenuItem>
          {message.type === "text" && (
            <ContextMenuItem onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => onForward?.(message)}>
            <Forward className="mr-2 h-4 w-4" />
            Forward
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onPin?.(message)}>
            <Pin className="mr-2 h-4 w-4" />
            Pin
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onSelect?.(message)}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Select
          </ContextMenuItem>
          {isOwn && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(message)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};
