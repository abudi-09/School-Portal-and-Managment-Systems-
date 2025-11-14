import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
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

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current || !hasMore || isLoading) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        // 100px threshold
        onLoadMore();
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [hasMore, isLoading, onLoadMore]);

  const hasRecipients = filtered.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-2xl md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
          <DialogDescription>
            Select one recipient to forward your message.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Input
            placeholder="Search recipients"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="mt-4 max-h-80">
          <div
            ref={scrollRef}
            className="space-y-3 p-3 max-h-80 overflow-y-auto border rounded-md"
          >
            {isLoading && filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4">
                Loading recipients…
              </div>
            ) : !hasRecipients ? (
              <div className="text-sm text-muted-foreground p-4">
                No recipients available.
              </div>
            ) : (
              <>
                {filtered.map((r) => {
                  const selected = selectedId === r.id;
                  return (
                    <label
                      key={r.id}
                      className={cn(
                        "w-full flex items-center gap-4 rounded-lg px-4 py-3 transition cursor-pointer",
                        "border border-border bg-background hover:bg-muted"
                      )}
                    >
                      <input
                        type="radio"
                        name="forward-recipient"
                        className="sr-only"
                        checked={selected}
                        onChange={() => onSelectRecipient(r.id)}
                        aria-checked={selected}
                        aria-label={`Select ${r.name}`}
                      />

                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-shrink-0">
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border transition",
                              selected
                                ? "border-primary"
                                : "border-muted-foreground/40"
                            )}
                            aria-hidden="true"
                          >
                            {selected ? (
                              <span className="h-3 w-3 rounded-full bg-primary" />
                            ) : null}
                          </span>
                        </div>

                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-medium">
                          {r.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-medium">{r.name}</p>
                            <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {r.role}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.email ?? r.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {selected ? (
                          <Check className="h-5 w-5 text-primary" />
                        ) : null}
                      </div>
                    </label>
                  );
                })}
                {isLoading && filtered.length > 0 && (
                  <div className="text-sm text-muted-foreground p-4 text-center">
                    Loading more…
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 flex justify-end gap-3">
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!selectedId || isLoading}>
            Send
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;
