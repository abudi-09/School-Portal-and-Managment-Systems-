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
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { VoiceRecorder } from "./VoiceRecorder";
import { FilePreviewList } from "./FilePreview";
import { validateFile, generateThumbnail, isImageFile } from "@/lib/fileUtils";
import { useToast } from "@/hooks/use-toast";

interface MessageComposerProps {
  onSend: (content: string, file?: File) => void;
  onSendVoice?: (audioBlob: Blob, duration: number, waveform: number[]) => void;
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
  onSendVoice,
  onTyping,
  disabled,
  placeholder = "Type a message...",
  replyTo,
}: MessageComposerProps) => {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview?: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Voice recording
  const voiceRecorder = useVoiceRecorder({
    onData: (blob, duration, waveform) => {
      if (onSendVoice) {
        onSendVoice(blob, duration, waveform);
      }
    },
    onError: (error) => {
      toast({
        title: "Recording Error",
        description: error.message || "Failed to record voice message",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim() && selectedFiles.length === 0) return;
    
    // Send files first
    selectedFiles.forEach(({ file }) => {
      onSend("", file);
    });
    
    // Then send text if any
    if (message.trim()) {
      onSend(message);
    }
    
    setMessage("");
    setSelectedFiles([]);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      // Validate file
      const maxSize = type === 'image' ? 10 * 1024 * 1024 : 25 * 1024 * 1024; // 10MB for images, 25MB for docs
      const allowedTypes = type === 'image' 
        ? ['image/*']
        : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/*'];
      
      const validation = validateFile(file, maxSize, allowedTypes);
      
      if (!validation.valid) {
        toast({
          title: "Invalid File",
          description: validation.error,
          variant: "destructive",
        });
        continue;
      }

      // Generate preview for images
      let preview: string | undefined;
      if (isImageFile(file)) {
        try {
          preview = await generateThumbnail(file);
        } catch (err) {
          console.error('Failed to generate thumbnail:', err);
        }
      }

      setSelectedFiles(prev => [...prev, { file, preview }]);
    }

    // Reset input
    if (e.target) e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMicClick = () => {
    if (voiceRecorder.isRecording) {
      voiceRecorder.stop();
    } else {
      voiceRecorder.start();
    }
  };

  // Show voice recorder if recording
  if (voiceRecorder.isRecording) {
    return (
      <div className="p-4 border-t bg-background">
        <VoiceRecorder
          isRecording={voiceRecorder.isRecording}
          isPaused={false}
          duration={voiceRecorder.duration}
          waveformLive={voiceRecorder.waveformLive}
          onStop={voiceRecorder.stop}
          onCancel={voiceRecorder.cancel}
        />
      </div>
    );
  }

  return (
    <div className="p-4 border-t bg-background space-y-2">
      {/* Reply Preview */}
      {replyTo && (
        <div className="flex items-center justify-between p-2 rounded bg-muted/50 border-l-4 border-primary">
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

      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <FilePreviewList
          files={selectedFiles}
          onRemove={handleRemoveFile}
        />
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
              onClick={() => imageInputRef.current?.click()}
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
          ref={imageInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e, 'image')}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          multiple
          onChange={(e) => handleFileSelect(e, 'file')}
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
        {message.trim() || selectedFiles.length > 0 ? (
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
            onClick={handleMicClick}
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};
