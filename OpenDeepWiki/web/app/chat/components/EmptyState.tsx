'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Brain, Github, MessageSquare, Code, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface EmptyStateProps {
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ className }) => {
  return (
    <div className={cn(
      "flex items-center justify-center min-h-[400px] p-6",
      className
    )}>
      <Card className="max-w-md w-full border border-muted">
        <CardHeader className="pb-3 flex flex-col items-center space-y-3">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-medium text-center">
            欢迎使用 AI 智能助手
          </h3>
        </CardHeader>
        
        <CardContent className="text-center space-y-4 pb-6">
          <p className="text-muted-foreground text-sm">
            基于先进的 AI 技术，为您的项目提供智能代码分析和问答服务
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex flex-col items-center p-3 rounded-lg border bg-muted/30 text-sm">
              <MessageSquare className="w-5 h-5 text-primary mb-2" />
              <span className="font-medium">智能问答</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg border bg-muted/30 text-sm">
              <Code className="w-5 h-5 text-primary mb-2" />
              <span className="font-medium">代码分析</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4 pt-0">
          <Separator />
          <div className="flex justify-center w-full">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
            >
              <a
                href="https://github.com/AIDotNet/OpenDeepWiki"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4" />
                了解更多
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground w-full text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            提示：您可以询问代码问题、请求解释或寻求开发建议
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmptyState;
