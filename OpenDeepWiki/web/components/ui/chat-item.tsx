"use client"

import React from 'react';
import { cn } from '@/lib/utils';

interface ChatItemProps {
  actions?: () => React.ReactNode;
  renderMessage?: () => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  role?: 'user' | 'assistant';
}

export function ChatItem({
  actions,
  renderMessage,
  className,
  style,
  role = 'assistant',
}: ChatItemProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        "group flex py-4 px-0 transition-all duration-200 w-full",
        isUser ? "justify-end" : "justify-start",
        className
      )}
      style={style}
    >
      {/* 内容区域 */}
      <div className={cn(
        "min-w-0 max-w-[85%] w-full",
        isUser ? "flex-shrink-0" : "flex-1"
      )}>
        {renderMessage && (
          <div className={cn(
            "text-sm leading-relaxed word-wrap break-word",
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3 ml-auto w-fit"
              : "text-foreground bg-transparent px-0 py-0"
          )}>
            {renderMessage()}
          </div>
        )}

        {/* 操作按钮 - 悬停时显示 */}
        {actions && (
          <div className={cn(
            "flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isUser ? "justify-end" : "justify-start"
          )}>
            {actions()}
          </div>
        )}
      </div>
    </div>
  );
}
