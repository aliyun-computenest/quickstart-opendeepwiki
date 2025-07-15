'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Brain,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import Workspace from './workspace';

// 保持原有的内部消息类型
export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: Array<{
    type: string;
    content?: string;
    toolId?: string;
    toolResult?: string;
    toolArgs?: string;
    [key: string]: any;
  }>;
  createAt: number;
  updateAt: number;
  status?: 'loading' | 'complete' | 'error';
  meta: {
    avatar: string;
    title: string;
    backgroundColor: string;
  };
}

// 文件类型接口
interface ReferenceFile {
  path: string;
  title: string;
  content?: string;
}

// Tailwind CSS 类名常量
const styles = {
  floatingButton: "fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-[1000] transition-all duration-300 hover:scale-105 hover:shadow-xl",
  chatContainer: "fixed bottom-6 right-6 w-[550px] h-[700px] bg-card rounded-lg shadow-xl z-[1001] flex flex-col overflow-hidden transition-all duration-300 border",
  chatContainerMinimized: "h-[60px]",
  chatContainerMaximized: "w-[580px] h-full bottom-0 right-0",
  chatContainerEmbedded: "relative !bottom-auto !right-auto !w-full !h-full !rounded-none !shadow-none !border-none",
  chatHeader: "flex items-center justify-between p-4 border-b bg-gradient-to-r from-card to-muted/20 min-h-[60px]",
  headerTitle: "flex items-center gap-3 flex-1",
  titleIcon: "text-primary text-xl flex items-center justify-center w-8 h-8 rounded-full bg-background shadow-sm",
  titleText: "text-lg font-semibold text-card-foreground",
  headerActions: "flex gap-2",
  actionButton: "w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
  chatContent: "flex-1 flex flex-col overflow-hidden bg-muted/30",
  messagesContainer: "flex-1 overflow-hidden",
  emptyState: "flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground",
  emptyIcon: "text-5xl mb-4 text-primary opacity-80",
  emptyTitle: "text-lg mb-2 text-foreground font-semibold",
  emptyDescription: "text-sm leading-relaxed max-w-[280px] mx-auto",
  emptyButton: "mt-4 rounded-lg"
};

interface FloatingChatProps {
  // 应用配置
  appId?: string;
  organizationName?: string;
  repositoryName?: string;

  // 外观配置
  expandIcon?: string; // base64 图标
  closeIcon?: string; // base64 图标
  title?: string;
  theme?: 'light' | 'dark';

  // 功能配置
  enableDomainValidation?: boolean;
  allowedDomains?: string[];
  embedded?: boolean; // 嵌入式模式

  // 回调函数
  onError?: (error: string) => void;
  onValidationFailed?: (domain: string) => void;
}

const FloatingChat: React.FC<FloatingChatProps> = ({
  appId,
  organizationName = 'default',
  repositoryName = 'default',
  expandIcon,
  closeIcon,
  title = 'AI 助手',
  theme = 'light',
  enableDomainValidation = false,
  allowedDomains = [],
  embedded = false,
  onError,
  onValidationFailed,
}) => {
  const { toast } = useToast();

  // 状态管理
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [domainValidated, setDomainValidated] = useState(false);


  // 初始化
  useEffect(() => {
    const init = async () => {
      try {
        // 域名验证（嵌入式模式下跳过）
        if (!embedded && enableDomainValidation && allowedDomains.length > 0) {
          const currentDomain = window.location.hostname;
          const isValidDomain = allowedDomains.some(domain =>
            currentDomain === domain || currentDomain.endsWith('.' + domain)
          );

          if (!isValidDomain) {
            onValidationFailed?.(currentDomain);
            return;
          }
        }

        setDomainValidated(true);

        // 嵌入式模式下自动展开
        if (embedded) {
          setTimeout(() => {
            setIsExpanded(true);
          }, 100);
        }

      } catch (error) {
        console.error('初始化失败:', error);
        onError?.('初始化失败');
      }
    };

    init();
  }, [organizationName, repositoryName, enableDomainValidation, allowedDomains, embedded]);

  // 切换展开状态
  const toggleExpanded = () => {
    if (!domainValidated) {
      toast({
        title: '域名验证失败',
        description: '当前域名未被授权使用此功能',
        variant: 'destructive',
      });
      return;
    }

    setIsExpanded(!isExpanded);
    setIsMinimized(false);
  };

  // 最小化
  const minimize = () => {
    setIsMinimized(true);
  };

  // 最大化/还原
  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // 关闭
  const close = () => {
    setIsExpanded(false);
    setIsMinimized(false);
    setIsMaximized(false);
  };


  // 如果域名验证失败，不渲染组件
  if (enableDomainValidation && !domainValidated) {
    return null;
  }

  return (
    <>
      {!embedded && !isExpanded && domainValidated && (
        <Button
          className={cn(styles.floatingButton, "bg-primary text-primary-foreground hover:bg-primary/90")}
          onClick={toggleExpanded}
          aria-label="打开聊天"
          size="icon"
        >
          <Brain className="w-6 h-6" />
        </Button>
      )}

      {/* 聊天窗口 */}
      {(isExpanded || embedded) && domainValidated && (
        <Card
          style={{
            padding: 0,
          }}
          className={cn(
            styles.chatContainer,
            isMinimized && styles.chatContainerMinimized,
            isMaximized && styles.chatContainerMaximized,
            embedded && styles.chatContainerEmbedded
          )}
        >
          {/* 聊天窗口头部 */}
          {!embedded && (
            <div className={styles.chatHeader}>
              <div className={styles.headerTitle}>
                <div className={styles.titleIcon}>
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h3 className={styles.titleText}>{title}</h3>
              </div>
              <div className={styles.headerActions}>
                <TooltipProvider>
                  {!isMinimized ? (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={styles.actionButton}
                            onClick={toggleMaximize}
                            aria-label={isMaximized ? '恢复大小' : '最大化'}
                          >
                            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isMaximized ? '恢复大小' : '最大化'}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={styles.actionButton}
                            onClick={minimize}
                            aria-label="最小化"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>最小化</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={styles.actionButton}
                          onClick={() => setIsMinimized(false)}
                          aria-label="展开"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>展开</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={styles.actionButton}
                        onClick={close}
                        aria-label="关闭"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>关闭</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}

          {/* 聊天内容区域 - 最小化时隐藏 */}
          {!isMinimized && (
            <div className={styles.chatContent}>
              <Workspace 
                appId={appId}
                organizationName={organizationName}
                name={repositoryName}
              />
            </div>
          )}
        </Card>
      )}
    </>
  );
};

export default FloatingChat;
