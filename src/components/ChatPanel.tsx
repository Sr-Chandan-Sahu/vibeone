import { useState, useEffect, useRef } from 'react';
import type { Message, User } from '@/utils/types';
import { MessageBubble } from './MessageBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles } from 'lucide-react';
import { saveMessage, subscribeToMessages, addParticipant, removeParticipant, subscribeToParticipants } from '@/services/storageService';
import { GEMINI_BOT_USER, generateId } from '@/constants';
import { generateAiResponseStream } from '@/services/geminiService';

interface ChatPanelProps {
  user: User;
  roomId: string;
  onClose?: () => void;
}

export function ChatPanel({ user, roomId, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [currentAiMessage, setCurrentAiMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add user to participants
  useEffect(() => {
    addParticipant(roomId, user);

    const cleanup = () => {
      removeParticipant(roomId, user.id);
    };

    window.addEventListener('beforeunload', cleanup);

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [roomId, user]);

  // Subscribe to messages
  useEffect(() => {
    const unsubMessages = subscribeToMessages(roomId, (msgs) => {
      setMessages(msgs);
    });

    const unsubParticipants = subscribeToParticipants(roomId, (parts) => {
      setParticipants(parts);
    });

    // Add join message if not already present
    const joinMessageId = `join-${user.id}`;
    const alreadyJoined = messages.some(m => m.id === joinMessageId);
    if (!alreadyJoined) {
      saveMessage(roomId, {
        id: joinMessageId,
        roomId: roomId,
        sender: { id: 'system', name: 'System', avatar: '' },
        text: `${user.name} joined`,
        timestamp: Date.now(),
        type: 'system'
      });
    }

    return () => {
      unsubMessages();
      unsubParticipants();
    };
  }, [roomId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentAiMessage, isAiThinking]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: generateId(),
      roomId: roomId,
      sender: user,
      text: inputText.trim(),
      timestamp: Date.now(),
      type: 'text'
    };

    await saveMessage(roomId, newMessage);
    setInputText('');

    if (!isAiThinking) {
      setIsAiThinking(true);
      const aiMsgId = generateId();

      setCurrentAiMessage({
        id: aiMsgId,
        roomId: roomId,
        sender: GEMINI_BOT_USER,
        text: "Thinking...",
        timestamp: Date.now(),
        type: 'ai',
        isStreaming: true
      });

      let aiTextBuffer = "";

      try {
        const responseText = await generateAiResponseStream(
          messages,
          newMessage.text,
          (chunk) => {
            aiTextBuffer = chunk;
            setCurrentAiMessage(prev => prev ? ({ ...prev, text: aiTextBuffer }) : null);
          }
        );

        await saveMessage(roomId, {
          id: aiMsgId,
          roomId: roomId,
          sender: GEMINI_BOT_USER,
          text: responseText || "...",
          timestamp: Date.now(),
          type: 'ai'
        });
      } catch (error) {
        console.error("AI Generation failed", error);
      } finally {
        setIsAiThinking(false);
        setCurrentAiMessage(null);
      }
    }
  };

  const displayMessages = currentAiMessage ? [...messages, currentAiMessage] : messages;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chat ({participants.length})</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No messages yet. Start chatting!
          </div>
        ) : (
          displayMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCurrentUser={message.sender.id === user.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          <span>AI responses enabled</span>
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isAiThinking}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputText.trim() || isAiThinking}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
