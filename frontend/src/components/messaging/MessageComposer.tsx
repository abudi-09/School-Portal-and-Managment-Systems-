import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  X,
  Image as ImageIcon,
  File as FileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  onSend: (content: string, file?: File) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  replyTo?: {
    senderName: string;
    snippet: string;
    onCancel: () => void;
  };
}

export const MessageComposer = ({
  onSend,
  onTyping,
  disabled,
  placeholder = "Type a message...",
  replyTo,
}: MessageComposerProps) => {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSend("", file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 border-t bg-background">
      {/* Reply Preview */}
      {replyTo && (
        <div className="flex items-center justify-between mb-2 p-2 rounded bg-muted/50 border-l-4 border-primary">
          <div className="text-sm">
            <p className="font-semibold text-primary">{replyTo.senderName}</p>
            <p className="text-muted-foreground truncate max-w-[300px]">
              {replyTo.snippet}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={replyTo.onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attachments */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 text-muted-foreground hover:text-primary"
              disabled={disabled}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="start">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
              Photo
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileIcon className="h-4 w-4" />
              Document
            </Button>
          </PopoverContent>
        </Popover>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              onTyping?.();
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[40px] max-h-[150px] py-2 pr-10 resize-none bg-muted/30 focus:bg-background transition-colors"
            rows={1}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 bottom-1 h-8 w-8 text-muted-foreground hover:text-primary"
            disabled={disabled}
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        {/* Send / Mic */}
        {message.trim() ? (
          <Button
            onClick={handleSend}
            disabled={disabled}
            size="icon"
            className="flex-shrink-0 rounded-full h-10 w-10"
          >
            <Send className="h-5 w-5 ml-0.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-muted-foreground hover:text-primary"
            disabled={disabled}
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
