
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { LoadingIndicator } from './LoadingIndicator';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onContextMenu: (event: React.MouseEvent, message: Message) => void;
  animatedMessageId: string | null;
  onStyleSelect: (style: string) => void;
  onEditComicRequest: (message: Message) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onContextMenu, animatedMessageId, onStyleSelect, onEditComicRequest }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 space-y-6">
      {messages.map((msg) => (
        <MessageBubble 
            key={msg.id} 
            message={msg} 
            onContextMenu={(e) => onContextMenu(e, msg)}
            isAnimated={msg.id === animatedMessageId}
            onStyleSelect={onStyleSelect}
            isLoading={isLoading}
            onEditComicRequest={onEditComicRequest}
        />
      ))}
      {isLoading && <LoadingIndicator />}
      <div ref={scrollRef} />
    </div>
  );
};
