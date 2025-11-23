import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatFileSize, getFileIcon, isImageFile, truncateFilename } from '@/lib/fileUtils';

interface FilePreviewProps {
  file: File;
  preview?: string; // Data URL for image preview
  onRemove: () => void;
  className?: string;
}

export const FilePreview = ({
  file,
  preview,
  onRemove,
  className,
}: FilePreviewProps) => {
  const FileIconComponent = getFileIcon(file.type);
  const isImage = isImageFile(file);

  return (
    <div
      className={cn(
        "relative group rounded-lg border border-border bg-muted/50 overflow-hidden",
        className
      )}
    >
      {/* Remove button */}
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>

      {isImage && preview ? (
        /* Image preview */
        <div className="relative aspect-video w-full">
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-xs text-white font-medium truncate">
              {truncateFilename(file.name, 25)}
            </p>
            <p className="text-[10px] text-white/80">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
      ) : (
        /* Document preview */
        <div className="flex items-center gap-3 p-3">
          <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
            <FileIconComponent className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {truncateFilename(file.name, 30)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface FilePreviewListProps {
  files: Array<{ file: File; preview?: string }>;
  onRemove: (index: number) => void;
  className?: string;
}

export const FilePreviewList = ({
  files,
  onRemove,
  className,
}: FilePreviewListProps) => {
  if (files.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {files.map((item, index) => (
        <FilePreview
          key={index}
          file={item.file}
          preview={item.preview}
          onRemove={() => onRemove(index)}
        />
      ))}
    </div>
  );
};
