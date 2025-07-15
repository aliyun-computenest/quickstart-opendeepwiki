'use client';

import React, { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Copy, MoreVertical, RefreshCw, Trash2, User, Bot, Loader2, Sparkles, Wrench, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ChatMessageItem } from '..';

interface ChatMessagesProps {
  messages: ChatMessageItem[];
  loading?: boolean;
  onRegenerateMessage?: (id: string) => void;
  onDeleteMessage?: (id: string) => void;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  loading = false,
  onRegenerateMessage,
  onDeleteMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = React.useState(false);
  const [activeMessageId, setActiveMessageId] = React.useState<string | null>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('已复制到剪贴板');
  };

  const handleDeleteMessage = (messageId: string) => {
    setActiveMessageId(messageId);
    setDeleteDialogOpen(true);
  };

  const handleRegenerateMessage = (messageId: string) => {
    setActiveMessageId(messageId);
    setRegenerateDialogOpen(true);
  };

  // 格式化时间戳为可读时间
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = (message: ChatMessageItem) => {
    if (message.status === 'loading') {
      return (
        <div className="flex items-center gap-2 p-3 text-muted-foreground animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>
            正在思考
            <span className="inline-flex items-center ml-1">
              <span className="animate-bounce mx-0.5 w-1 h-1 rounded-full bg-current" style={{ animationDelay: '0ms' }}></span>
              <span className="animate-bounce mx-0.5 w-1 h-1 rounded-full bg-current" style={{ animationDelay: '150ms' }}></span>
              <span className="animate-bounce mx-0.5 w-1 h-1 rounded-full bg-current" style={{ animationDelay: '300ms' }}></span>
            </span>
          </span>
        </div>
      );
    }

    if (message.status === 'error') {
      // 显示错误状态时，提取第一个文本内容
      const errorText = message.content.find(item => item.type === 'text')?.content || '发生未知错误';
      return (
        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md border border-destructive/20">
          {errorText}
        </div>
      );
    }

    // 根据content数组中的类型渲染不同内容
    return (
      <div className="space-y-4">
        {message.content.map((contentItem, index) => {
          switch (contentItem.type) {
            case 'reasoning':
              return (
                <div key={`reasoning-${index}`} className="p-3 bg-muted/50 rounded-md border border-border text-sm">
                  <div className="flex items-center gap-1.5 mb-2 text-muted-foreground font-medium">
                    <Sparkles className="h-4 w-4" />
                    <span>思考过程</span>
                  </div>
                  <div className="whitespace-pre-wrap text-xs leading-relaxed">
                    {contentItem.content}
                  </div>
                </div>
              );
              
            case 'tool':
              return (
                <div key={`tool-${index}`} className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900/30 text-sm">
                  <div className="flex items-center gap-1.5 mb-2 text-blue-600 dark:text-blue-400 font-medium">
                    <Wrench className="h-4 w-4" />
                    <span>工具调用: {contentItem.toolName || contentItem.toolId}</span>
                  </div>
                  <div className="font-mono text-xs whitespace-pre-wrap bg-background/80 p-2 rounded border border-border/50 max-h-[200px] overflow-auto">
                    <div className="mb-1 text-muted-foreground">参数:</div>
                    <div className="mb-2">{contentItem.toolArgs}</div>
                    {contentItem.toolResult && (
                      <>
                        <div className="mb-1 text-muted-foreground">结果:</div>
                        <div>{contentItem.toolResult}</div>
                      </>
                    )}
                  </div>
                </div>
              );
              
            case 'text':
              return (
                <div key={`text-${index}`} className="prose prose-sm dark:prose-invert max-w-none">
                  {contentItem.content?.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < contentItem.content!.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              );
              
            case 'image':
              return contentItem.imageContents && contentItem.imageContents.length > 0 ? (
                <div key={`image-${index}`} className="flex flex-wrap gap-2 mt-2">
                  {contentItem.imageContents.map((image: any, imgIndex: number) => (
                    <div 
                      key={imgIndex}
                      className="relative group cursor-pointer"
                      onClick={() => window.open(`data:${image.mimeType};base64,${image.data}`, '_blank')}
                    >
                      <img 
                        src={`data:${image.mimeType};base64,${image.data}`}
                        alt="图片内容"
                        className="max-w-[200px] max-h-[200px] rounded-md border border-border object-contain hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                        <span className="text-white text-xs">点击查看大图</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null;
              
            default:
              // 处理其他类型或未知类型
              return (
                <div key={`unknown-${index}`} className="text-sm text-muted-foreground italic">
                  {contentItem.content || JSON.stringify(contentItem)}
                </div>
              );
          }
        })}
      </div>
    );
  };

  return (
    <div className="h-full p-4 overflow-y-auto bg-background">
      <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 max-w-full group animate-in fade-in-0 duration-200",
              message.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            {/* 头像 */}
            <div className="flex-shrink-0">
              <Avatar className={cn(
                "border-2 border-background",
                message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}>
                {message.role === 'user' ? (
                  <>
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    <AvatarImage src="/avatar-user.png" />
                  </>
                ) : (
                  <>
                    <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    <AvatarImage src="/avatar-bot.png" />
                  </>
                )}
              </Avatar>
            </div>
            
            {/* 消息内容 */}
            <div className={cn(
              "relative group flex-1 max-w-[85%]",
              message.role === 'user' ? "mr-2" : "ml-2"
            )}>
              <Card className={cn(
                "p-4 overflow-hidden",
                message.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                  : "bg-card text-card-foreground rounded-2xl rounded-tl-sm shadow-sm"
              )}>
                {renderMessageContent(message)}
                
                {/* 操作按钮 */}
                <div className={cn(
                  "absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity",
                  message.role === 'user' ? "left-2" : "right-2"
                )}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={message.role === 'user' ? "start" : "end"} className="w-40">
                      <DropdownMenuItem onClick={() => {
                        // 提取所有文本和推理内容
                        const textContent = message.content
                          .filter(item => item.type === 'text' || item.type === 'reasoning')
                          .map(item => item.content || '')
                          .join('\n\n');
                        handleCopyMessage(textContent);
                      }}>
                        <Copy className="mr-2 h-4 w-4" />
                        <span>复制内容</span>
                      </DropdownMenuItem>
                      
                      {message.role === 'assistant' && (
                        <DropdownMenuItem onClick={() => handleRegenerateMessage(message.id)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          <span>重新生成</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => handleDeleteMessage(message.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>删除消息</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
              
              {/* 消息元数据 */}
              <div className={cn(
                "flex items-center gap-2 mt-1 text-xs text-muted-foreground",
                message.role === 'user' ? "justify-end mr-2" : "justify-start ml-2"
              )}>
                <Badge variant={message.role === 'user' ? "outline" : "secondary"} className="px-1.5 py-0 text-[10px] font-normal">
                  {message.role === 'user' ? '用户' : 'AI'}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(message.createAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条消息吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (activeMessageId) {
                  onDeleteMessage?.(activeMessageId);
                  setActiveMessageId(null);
                  toast.success('消息已删除');
                }
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重新生成确认对话框 */}
      <AlertDialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>重新生成</AlertDialogTitle>
            <AlertDialogDescription>
              重新生成将删除此消息及之后的所有消息，确定继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (activeMessageId) {
                  onRegenerateMessage?.(activeMessageId);
                  setActiveMessageId(null);
                  toast.success('正在重新生成回答');
                }
                setRegenerateDialogOpen(false);
              }}
            >
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatMessages;