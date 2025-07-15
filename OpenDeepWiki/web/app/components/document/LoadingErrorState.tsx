'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, FileX, RotateCcw, Github, Star, GitFork, Calendar } from 'lucide-react';
import Link from 'next/link';
import { getLastWarehouse } from '../../services/warehouseService';

interface LoadingErrorStateProps {
  loading: boolean;
  error: string | null;
  owner: string;
  name: string;
  token: any;
}

interface GitHubRepoInfo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  updated_at: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

// 仓库信息展示组件
const RepositoryInfoState = ({ owner, name, token }) => {
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRepoInfo = async () => {
      try {
        // 尝试直接从GitHub API获取仓库信息
        const response = await fetch(`https://api.github.com/repos/${owner}/${name}`);
        
        if (response.ok) {
          const data = await response.json();
          setRepoInfo({
            name: data.name,
            description: data.description || '暂无描述',
            stars: data.stargazers_count,
            forks: data.forks_count,
            language: data.language,
            updated_at: data.updated_at,
            html_url: data.html_url,
            owner: {
              login: data.owner.login,
              avatar_url: data.owner.avatar_url,
              html_url: data.owner.html_url
            }
          });
        }
      } catch (err) {
        setError('获取仓库信息时出错');
      } finally {
        setLoading(false);
      }
    };

    fetchRepoInfo();
  }, [owner, name]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (error || !repoInfo) {
    return (
      <div className="flex flex-col items-center space-y-4 text-center">
        <p className="text-muted-foreground text-base">
          仓库地址: https://github.com/{owner}/{name}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild>
            <a
              href={`https://github.com/${owner}/${name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              访问GitHub仓库
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={repoInfo.owner.avatar_url} alt={repoInfo.owner.login} />
          <AvatarFallback>
            <Github className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <h3 className="text-xl font-semibold text-foreground m-0">
            <a
              href={repoInfo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {repoInfo.owner.login}/{repoInfo.name}
            </a>
          </h3>
          <p className="text-muted-foreground m-0">
            {repoInfo.description}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {repoInfo.language && (
              <Badge variant="secondary">
                {repoInfo.language}
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">{repoInfo.stars}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="h-4 w-4" />
              <span className="text-sm">{repoInfo.forks}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{new Date(repoInfo.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button asChild>
          <a
            href={repoInfo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Github className="h-4 w-4" />
            访问GitHub仓库
          </a>
        </Button>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          重新加载
        </Button>
      </div>
    </div>
  );
};

const LoadingErrorState: React.FC<LoadingErrorStateProps> = ({
  loading,
  error,
  owner,
  name,
  token
}) => {
  // 加载状态显示骨架屏
  if (loading) {
    return (
      <Card className="rounded-lg shadow-sm">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 根据错误类型显示不同的错误信息
  if (error) {
    if (error.includes('不存在') || error.includes('路径')) {
      return (
        <Card className="rounded-lg overflow-hidden shadow-sm">
          <CardContent className="p-6">
            <RepositoryInfoState
              owner={owner}
              name={name}
              token={token}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="rounded-lg overflow-hidden shadow-sm">
        <CardContent className="flex flex-col items-center text-center space-y-4 p-8">
          <div className="flex flex-col items-center space-y-2">
            <FileX className="h-12 w-12 text-yellow-500" />
            <h3 className="text-xl font-semibold text-foreground">无法加载文档内容</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild>
              <Link href={`/${owner}/${name}`} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回仓库概览
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              重新加载
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default LoadingErrorState; 