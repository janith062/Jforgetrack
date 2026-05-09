import React from 'react';
import { Bot, User } from 'lucide-react';

/**
 * A chat bubble for the AI agent conversation panel.
 * @param {object} props
 * @param {'ai'|'user'} props.role
 * @param {string} props.content
 * @param {'thinking'|'done'|'error'} props.status
 */
export const ChatBubble = ({ role, content, status = 'done' }) => {
  const isAI = role === 'ai';

  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'} mb-4`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isAI
          ? 'bg-accent-glow/15 border border-accent-glow/30'
          : 'bg-surface-raised border border-border-default'
        }
      `}>
        {isAI
          ? <Bot size={16} className="text-accent-glow" />
          : <User size={16} className="text-fg-secondary" />
        }
      </div>

      {/* Bubble */}
      <div className={`
        max-w-[85%] rounded-2xl px-4 py-3 text-body-sm leading-relaxed
        ${isAI
          ? 'bg-surface-inset border border-border-subtle text-fg-primary rounded-tl-sm'
          : 'bg-accent-glow/10 border border-accent-glow/20 text-fg-primary rounded-tr-sm'
        }
        ${status === 'thinking' ? 'animate-pulse' : ''}
        ${status === 'error' ? '!bg-danger/10 !border-danger/20 !text-danger' : ''}
      `}>
        {status === 'thinking'
          ? <span className="flex gap-1 items-center text-fg-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-fg-tertiary animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-fg-tertiary animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-fg-tertiary animate-bounce [animation-delay:300ms]" />
            </span>
          : content
        }
      </div>
    </div>
  );
};
