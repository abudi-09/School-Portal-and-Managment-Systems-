import { Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import type { RecipientDto } from "@/lib/api/messagesApi";
import type { UserRole } from "@/components/messaging/types";
import { cn } from "@/lib/utils";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: RecipientDto[];
  isLoading: boolean;
  selectedRecipientId: string | null;
  onSelectRecipient: (recipientId: string) => void;
  onConfirm: () => void;
  confirmLabel?: string;
  description?: string;
  title?: string;
}

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  head: "Head of School",
  teacher: "Teacher",
};

const formatRole = (role: string) => roleLabels[role as UserRole] ?? role;

const NewConversationDialog = ({
  open,
  onOpenChange,
  recipients,
  isLoading,
  selectedRecipientId,
  onSelectRecipient,
  onConfirm,
  confirmLabel = "Start conversation",
  description = "Choose a recipient to begin a new conversation.",
  title = "New Message",
}: NewConversationDialogProps) => {
  const hasRecipients = recipients.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Command shouldFilter>
            <CommandInput placeholder="Search recipients" />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading recipients…
                </div>
              ) : (
                <>
                  <CommandEmpty>No recipients found.</CommandEmpty>
                  <CommandGroup>
                    {recipients.map((recipient) => {
                      const isSelected = selectedRecipientId === recipient.id;
                      return (
                        <CommandItem
                          key={recipient.id}
                          value={`${recipient.name} ${
                            recipient.email ?? recipient.role
                          }`.trim()}
                          onSelect={() => onSelectRecipient(recipient.id)}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2",
                            isSelected ? "bg-primary/10" : undefined
                          )}
                        >
                          <div className="flex flex-col text-left">
                            <span className="font-medium text-foreground">
                              {recipient.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {recipient.email ?? formatRole(recipient.role)}
                            </span>
                          </div>
                          {isSelected ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : null}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={onConfirm}
              disabled={!selectedRecipientId || isLoading || !hasRecipients}
              className="gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog;
