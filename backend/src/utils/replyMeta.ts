import { MessageType, ReplyToMessageType } from "../models/Message";
import { DELETED_REPLY_SNIPPET } from "./messages";

export const REPLY_SNIPPET_MIN = 50;
export const REPLY_SNIPPET_MAX = 70;

export const sanitizeSnippetSource = (value: string): string =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/[`*_~]/g, "")
    .replace(/[\[\]#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const mapMessageTypeToReplyType = (
  type?: MessageType | null
): ReplyToMessageType => {
  switch (type) {
    case "image":
      return "photo";
    case "doc":
      return "document";
    case "file":
      return "file";
    case "audio":
      return "audio";
    case "video":
      return "video";
    default:
      return "text";
  }
};

const nonTextLabelForReplyType = (type: ReplyToMessageType): string => {
  switch (type) {
    case "photo":
      return "Photo";
    case "file":
      return "File";
    case "document":
      return "Document";
    case "audio":
      return "Audio";
    case "video":
      return "Video";
    default:
      return "Text";
  }
};

const buildTextSnippet = (content: string): string => {
  const sanitized = sanitizeSnippetSource(content);
  if (!sanitized) {
    return "Text message";
  }
  if (sanitized.length <= REPLY_SNIPPET_MAX) {
    return sanitized;
  }
  const truncated = sanitized.slice(0, REPLY_SNIPPET_MAX - 1).trimEnd();
  return `${truncated}…`;
};

export const buildReplySnippet = (
  replyType: ReplyToMessageType,
  content: string,
  referencedDeleted: boolean
): string => {
  if (referencedDeleted) {
    return DELETED_REPLY_SNIPPET;
  }

  if (replyType !== "text") {
    return nonTextLabelForReplyType(replyType);
  }

  return buildTextSnippet(content ?? "");
};
