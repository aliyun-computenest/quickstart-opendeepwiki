'use client'

import React, { useMemo } from 'react';
import { Repository } from '../types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '../i18n/client';
import { formatRelativeTime } from '../utils/timeFormat';
import {
  Github,
  GitFork,
  Calendar,
  ExternalLink,
  FileText
} from 'lucide-react';

interface RepositoryCardProps {
  repository: Repository;
}

const RepositoryCard: React.FC<RepositoryCardProps> = ({ repository }) => {
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language;

  // 根据地址获取头像
  const getAvatarUrl = () => {
    if (repository?.avatarUrl) {
      return repository.avatarUrl;
    }

    if (repository.address?.includes('github.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://github.com/${owner}.png`;
      }
    } else if (repository.address?.includes('gitee.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://gitee.com/${owner}.png`;
      }
    } else if (repository.address?.includes('gitea.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://gitea.com/${owner}.png`;
      }
    } else if (repository.address?.includes('gitlab.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://gitlab.com/${owner}.png`;
      }
    } else {
      return null;
    }
    return null;
  };

  const avatarUrl = useMemo(() => getAvatarUrl(), [repository.address, repository.organizationName]);

  const getStatusNumber = (status: string | number): number => {
    if (typeof status === 'number') return status;
    return parseInt(status, 10) || 0;
  };

  // 获取状态配置
  const getStatusConfig = (status: string | number) => {
    const statusNumber = getStatusNumber(status);
    switch (statusNumber) {
      case 0: return {
        variant: 'secondary' as const,
        color: '#6c757d',
        text: t('repository.status.pending', '待处理')
      };
      case 1: return {
        variant: 'default' as const,
        color: '#007bff',
        text: t('repository.status.processing', '处理中')
      };
      case 2: return {
        variant: 'success' as const,
        color: '#28a745',
        text: t('repository.status.completed', '已完成')
      };
      case 3: return {
        variant: 'outline' as const,
        color: '#6c757d',
        text: t('repository.status.cancelled', '已取消')
      };
      case 4: return {
        variant: 'secondary' as const,
        color: '#ffc107',
        text: t('repository.status.unauthorized', '未授权')
      };
      case 99: return {
        variant: 'destructive' as const,
        color: '#dc3545',
        text: t('repository.status.failed', '已失败')
      };
      default: return {
        variant: 'outline' as const,
        color: '#6c757d',
        text: t('repository.status.unknown', '未知状态')
      };
    }
  };

  const formatDate = (dateString: string) => {
    return formatRelativeTime(dateString, currentLocale);
  };

  const getRepoIcon = () => {
    if (repository.address?.includes('github.com')) {
      return <Github className="h-4 w-4" />;
    } else if (repository.address?.includes('gitee.com')) {
      return <div className="h-4 w-4 bg-foreground rounded-sm flex items-center justify-center">
        <span className="text-background text-xs font-bold">G</span>
      </div>;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };

  const statusConfig = getStatusConfig(repository.status);

  const handleCardClick = () => {
    window.location.href = `/${repository.organizationName}/${repository.name}`;
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md border-border/50 hover:border-border w-full"
      style={{
        height: '240px',
        minHeight: '240px',
        maxHeight: '240px',
      }}
      onClick={handleCardClick}
    >
      <CardHeader style={{
        height: '150px',
        minHeight: '150px',
        maxHeight: '150px',
      }} className="pb-3">
        <div className="flex items-start gap-3 h-full">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={avatarUrl || ''} alt={repository.organizationName} />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
              {repository.organizationName?.slice(0, 2)?.toUpperCase() || 'RE'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h3 className="font-semibold text-foreground text-base leading-tight cursor-pointer" style={{
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',   
                          textOverflow: 'ellipsis'
                        }}>
                          {repository.name.slice(0, 10) || t('repository.unknown_name', '未知仓库名称')}
                        </h3>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{repository.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge color={statusConfig.color} variant={statusConfig.variant} className="shrink-0 text-xs px-2 py-0.5">
                  {statusConfig.text}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1.5">
                {getRepoIcon()}
                <span className="text-sm text-muted-foreground truncate">
                  {repository.organizationName}
                </span>
              </div>
            </div>

            {repository.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm text-muted-foreground overflow-hidden cursor-pointer" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.4',
                      maxHeight: '2.8em',
                      wordBreak: 'break-word'
                    }}>
                      {repository.description.slice(0, 100) || t('repository.no_description', '暂无描述')}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{repository.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-6 pb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {repository.branch && (
              <div className="flex items-center gap-1 min-w-0">
                <GitFork className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-16">{repository.branch}</span>
              </div>
            )}

            <div className="flex items-center gap-1 min-w-0">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatDate(repository.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                window.open(repository.address, '_blank');
              }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepositoryCard; 