import { useState } from 'react';
import { MessageComposer } from '@/components/messaging/MessageComposer';
import { MessageBubble } from '@/components/messaging/MessageBubble';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageItem } from '@/components/messaging/types';

export default function VoiceTestPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);

  const handleSendMessage = (content: string, file?: File) => {
    const newMessage: MessageItem = {
      id: Date.now().toString(),
      senderId: 'test-user',
      senderRole: 'teacher',
      receiverId: 'test-recipient',
      receiverRole: 'head',
      content,
      timestamp: new Date().toLocaleTimeString(),
      timestampIso: new Date().toISOString(),
      status: 'unread',
      type: file ? (file.type.startsWith('image/') ? 'image' : 'file') : 'text',
      fileUrl: file ? URL.createObjectURL(file) : undefined,
      fileName: file?.name,
      fileSize: file?.size,
      deleted: false,
      deliveredTo: [],
      seenBy: [],
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendVoice = (audioBlob: Blob, duration: number, waveform: number[]) => {
    const newMessage: MessageItem = {
      id: Date.now().toString(),
      senderId: 'test-user',
      senderRole: 'teacher',
      receiverId: 'test-recipient',
      receiverRole: 'head',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      timestampIso: new Date().toISOString(),
      status: 'unread',
      type: 'voice',
      fileUrl: URL.createObjectURL(audioBlob),
      voiceDuration: duration,
      voiceWaveform: waveform,
      deleted: false,
      deliveredTo: [],
      seenBy: [],
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Voice & File Upload Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <div className="min-h-[400px] max-h-[600px] overflow-y-auto border rounded-lg p-4 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                No messages yet. Try sending a text, voice, or file message!
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={true}
                  showAvatar={false}
                  senderName="You"
                />
              ))
            )}
          </div>

          {/* Composer */}
          <MessageComposer
            onSend={handleSendMessage}
            onSendVoice={handleSendVoice}
            placeholder="Type a message, record voice, or upload files..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
