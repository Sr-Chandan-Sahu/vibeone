import type { Message } from '@/utils/types';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const bubbleClass = isCurrentUser
    ? 'bg-primary/80 text-white'
    : message.type === 'ai'
    ? 'bg-purple-600/80 text-white'
    : 'bg-secondary text-foreground';

  return (
    <div className={`flex gap-2 mb-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="w-8 h-8">
        <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
        <AvatarFallback className="text-xs">
          {getInitials(message.sender.name)}
        </AvatarFallback>
      </Avatar>
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <span className="text-xs text-muted-foreground mb-1">
          {message.sender.name}
        </span>
        <div
          className={`max-w-xs px-3 py-2 rounded-lg text-sm break-words ${bubbleClass}`}
        >
          {message.text}
          {message.isStreaming && <span className="animate-pulse">▌</span>}
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {format(message.timestamp, 'HH:mm')}
        </span>
      </div>
    </div>
  );
}
