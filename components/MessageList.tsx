
import React from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { LoadingIndicator } from './LoadingIndicator';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onContextMenu: (event: React.MouseEvent, message: Message) => void;
  animatedMessageId: string | null;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onContextMenu, animatedMessageId }) => {

  return (
    <div className="flex-1 space-y-6">
      {messages.map((msg) => (
        <MessageBubble 
            key={msg.id} 
            message={msg} 
            onContextMenu={(e) => onContextMenu(e, msg)}
            isAnimated={msg.id === animatedMessageId}
        />
      ))}
      {isLoading && <LoadingIndicator />}
    </div>
  );
};
