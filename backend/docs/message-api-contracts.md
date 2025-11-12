# Message Management API Contracts

This document defines REST endpoints and Socket.IO events for message management: edit, delete (for-me / for-everyone), reply, copy (client-side), and forward.

---

## Common types

- `messageId`: MongoDB ObjectId string
- `userId`: MongoDB ObjectId string
- `threadKey`: string

---

## REST Endpoints

### POST /messages

- Existing send endpoint. Accepts `receiverId`, `type`, `content`, `fileUrl`, `fileName`, optional `replyToMessageId`.
- Response: 201 `{ success: true, data: { message, sender, receiver } }` where `message` is normalized.
- Socket events emitted: `message:new` to receiver, `message:sent` to sender.

### PATCH /messages/:id/edit

- Purpose: allow sender to edit message text (only for `type: "text"`).
- Auth: required.
- Validation: `:id` is mongo id, body `{ content: string }` required (1..4000)
- Authorization: only `message.sender` may edit; also disallow editing if `isDeletedForEveryone === true`.
- Behavior:
  - Update `content`, set `isEdited = true`, set `editedAt = now`.
  - Do NOT change `createdAt`.
  - Do NOT remove delivery/seen lists.
- Response: 200 `{ success: true, data: { message } }` (normalized)
- Socket events: emit `message:edited` to all participants in thread with payload `{ message: normalizedMessage }`.

Example request body:

```
{ "content": "Updated message text" }
```

### DELETE /messages/:id?mode=me|everyone

- Purpose: Delete a message for the current user (`mode=me`) or for everyone (`mode=everyone`). Defaults to `me`.
- Auth: required.
- Validation: `:id` is mongo id.
- Behavior:
  - `me`: add currentUser.\_id to `hiddenFor` array (server will filter these messages out for that user in fetch endpoints); do NOT modify content.
  - `everyone`: require `currentUser === message.sender`; set `isDeletedForEveryone = true`, `deletedAt = now`, replace `content` with placeholder `"This message was deleted."`, clear `fileUrl` and `fileName`, keep `editedAt` for audit; emit `message:deleted` event.
- Response: 200 `{ success: true, data: { message } }` (normalized). For `me` simply return success and no broadcast.
- Socket events:
  - `mode=everyone`: emit `message:deleted` to all participants including `{ messageId, threadKey, mode: "everyone", placeholder }`.
  - `mode=me`: no broadcast (client can remove locally).

### POST /messages/:id/forward

- Purpose: Forward an existing message to another recipient.
- Body: `{ receiverId }` (target recipient id)
- Auth: required.
- Validation: ensure `receiverId` is a valid user and allowed by hierarchy; ensure original message exists and is visible to forwarder.
- Behavior:
  - Create a new Message with `sender = currentUser`, `receiver = receiverId`, `type`, `content`, `fileUrl`, `fileName` copied from original.
  - Set `forwardedFrom = { originalMessageId, originalSenderId, originalSenderName?, originalSentAt }` and `forwardedAt = now`.
- Response: 201 `{ success: true, data: { message, sender, receiver } }`.
- Socket events: `message:new` to destination and `message:sent` to forwarder; normalized message includes `forwardedFrom`.

### POST /messages (reply)

- Purpose: Replying is handled by existing `POST /messages` send endpoint by passing `replyToMessageId`.
- Behavior:
  - Validate referenced message exists and thread matches or is within allowed scope.
  - Store `replyToMessageId` in new message and optionally embed preview fields for faster rendering.
- Socket events: `message:new` as usual, message payload includes `replyTo` metadata.

---

## Socket.IO events (server -> client)

- `message:new` - A new message was created.
  Payload: `{ message: NormalizedMessage, sender: { id, name, role }, receiver: { id, name, role } }`

- `message:sent` - Acknowledge sender's sent message.
  Payload: same as `message:new`.

- `message:edited` - A message was edited.
  Payload: `{ message: NormalizedMessage }` (includes `editedAt`, `isEdited`)

- `message:deleted` - A message was deleted for everyone.
  Payload: `{ messageId, threadKey, mode: "everyone", placeholder: "This message was deleted.", deletedAt }`

- `message:seen:update` - One or more messages were seen by a user (existing event).
  Payload: `{ messageIds: string[], seenBy: string, readerId, threadKey }`

- `message:read` - Messages marked read (existing event).
  Payload: `{ messageIds: string[], readerId, threadKey }`

- `presence:update` - Presence changes for a user.
  Payload: `{ userId, online: boolean, lastSeen?: isoString }`

Notes:

- Events should be emitted to the target user's socket room / namespace using existing `emitToUser` helper.
- Clients should ignore duplicate events (idempotent handling): server events must be authoritative.

---

## Normalized fields (NormalizedMessage)

Additions to normalized message payload:

- `isEdited?: boolean`
- `editedAt?: string`
- `isDeletedForEveryone?: boolean`
- `deletedAt?: string`
- `hiddenFor?: string[]` (server does not include the current user in feed if present)
- `replyToMessageId?: string`
- `forwardedFrom?: { originalMessageId: string, originalSenderId: string, originalSenderName?: string, originalSentAt?: string }`

## Error codes

- `400` - Validation failed
- `401` - Authentication required
- `403` - Forbidden (not owner or hierarchy violation)
- `404` - Message or user not found
- `409` - Conflict (e.g., message already deleted for everyone when attempting edit)
- `500` - Server error

---

## Example Socket flow: Edit

1. Client A PATCH `/messages/:id/edit` with new content.
2. Server validates user is sender, updates document (set `isEdited`, `editedAt`).
3. Server emits `message:edited` to both participants with updated normalized message.
4. Clients update UI bubble and show "edited" badge.

---

End of contract doc.
