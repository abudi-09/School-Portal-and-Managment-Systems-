import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecipientDto } from "@/lib/api/messagesApi";

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: RecipientDto[];
  isLoading: boolean;
  /** Currently selected recipient id (single-select / radio). */
  selectedId: string | null;
  /** Set the selected recipient id. */
  onSelectRecipient: (id: string) => void;
  /** Confirm forwarding to the selected recipient id. */
  onConfirm: () => void;
  /** Whether there are more recipients to load. */
  hasMore: boolean;
  /** Load more recipients. */
  onLoadMore: () => void;
}

const ForwardMessageDialog: React.FC<ForwardMessageDialogProps> = ({
  open,
  onOpenChange,
  recipients,
  isLoading,
  selectedId,
  onSelectRecipient,
  onConfirm,
  hasMore,
  onLoadMore,
}) => {
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return recipients;
    return recipients.filter((r) => {
      const hay = [r.name, r.email, r.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [recipients, search]);

  // Infinite scroll detection within ScrollArea viewport
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (!hasMore || isLoading) return;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      onLoadMore();
    }
  };

  const hasRecipients = filtered.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Forward Message</DialogTitle>
          <DialogDescription>
            Search and select a person to forward this message to.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-1"
            />
          </div>
        </div>

        <ScrollArea
          className="h-[400px]"
          onScrollCapture={handleScroll} // Capture scroll events from the viewport
        >
          <div className="p-2">
            {isLoading && filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="text-sm">Loading recipients...</span>
              </div>
            ) : !hasRecipients ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <User className="h-8 w-8 opacity-20" />
                <span className="text-sm">No recipients found.</span>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((r) => {
                  const selected = selectedId === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => onSelectRecipient(r.id)}
                      className={cn(
                        "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                        selected
                          ? "bg-primary/10 hover:bg-primary/15"
                          : "hover:bg-muted/80"
                      )}
                    >
                      <Avatar className="h-10 w-10 border border-border/50">
                        {/* Assuming r.avatarUrl exists, otherwise fallback */}
                        <AvatarImage src={(r as any).avatarUrl} alt={r.name} />
                        <AvatarFallback
                          className={cn(
                            "text-sm font-medium",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {r.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "font-medium truncate text-sm",
                              selected
                                ? "text-foreground"
                                : "text-foreground/90"
                            )}
                          >
                            {r.name}
                          </span>
                          {r.role && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 h-5 font-normal capitalize"
                            >
                              {r.role}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {r.email}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "flex-shrink-0 transition-opacity duration-200",
                          selected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-10"
                        )}
                      >
                        <div
                          className={cn(
                            "h-5 w-5 rounded-full flex items-center justify-center",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "border border-muted-foreground/30"
                          )}
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isLoading && filtered.length > 0 && (
                  <div className="py-4 flex justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-muted/10">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!selectedId || isLoading}
            className="min-w-[100px]"
          >
            Forward
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;
