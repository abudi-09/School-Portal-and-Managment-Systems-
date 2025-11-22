import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContactItem, UserRole } from "./types";

interface ChatHeaderProps {
  contact: ContactItem;
  onBack: () => void;
  onInfo?: () => void;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatRoleLabel = (role: UserRole) => {
  switch (role) {
    case "admin":
      return "Admin";
    case "head":
      return "Head";
    case "teacher":
      return "Teacher";
    default:
      return role;
  }
};

export const ChatHeader = ({ contact, onBack, onInfo }: ChatHeaderProps) => {
  const isOnline =
    contact.presence?.visibleStatus === "online" && !contact.presence.hidden;

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden -ml-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="relative">
          <Avatar>
            <AvatarImage src={contact.avatarUrl} />
            <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 border-2 border-background bg-green-500 rounded-full" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{contact.name}</h3>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              {formatRoleLabel(contact.role)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          <Phone className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
          <Video className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onInfo}>
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
};
