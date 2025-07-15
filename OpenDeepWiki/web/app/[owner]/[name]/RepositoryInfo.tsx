'use client'

import * as React from "react"
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  Star,
  GitFork,
  Calendar,
  Link as LinkIcon,
  Globe,
  User,
  Building,
  Github,
  History,
  FileText,
  Plus,
  Eye,
  GitBranch,
  Clock,
  ExternalLink,
  Copy,
  CheckCircle
} from "lucide-react"
import Link from 'next/link'

interface GitHubRepoInfo {
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
  owner: {
    avatar_url: string;
    html_url: string;
    login: string;
  };
  license?: {
    name: string;
  };
  default_branch: string;
  topics: string[];
  open_issues_count: number;
  visibility: string;
}

import RepositoryForm from '../../components/RepositoryForm'
import { submitWarehouse, getGitHubReadme } from '../../services'
import { RepositoryFormValues } from '../../types'
import { toast } from 'sonner'

interface RepositoryInfoProps {
  owner: string;
  name: string; 
  branch?: string;
}

export default function RepositoryInfo({ owner, name, branch }: RepositoryInfoProps) {
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [readme, setReadme] = useState<string | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [currentBranch, setCurrentBranch] = useState<string | undefined>(branch)
  const [copied, setCopied] = useState(false)
  const [branches, setBranches] = useState<string[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  useEffect(() => {
    async function fetchGitHubRepo() {
      try {
        setLoading(true)

        const response = await fetch(`https://api.github.com/repos/${owner}/${name}`)

        if (!response.ok) {
          throw new Error('GitHub仓库信息获取失败')
        }

        const data = await response.json()
        setRepoInfo(data)

        // 如果没有指定分支，使用默认分支
        if (!currentBranch) {
          setCurrentBranch(data.default_branch)
        }

        // 获取分支列表
        fetchBranches()

        // 获取README内容
        try {
          // 使用导入的getGitHubReadme函数，传递当前分支
          const readmeContent = await getGitHubReadme(owner, name, currentBranch || data.default_branch)
          if (readmeContent) {
            setReadme(readmeContent)
          }
        } catch (readmeErr) {
          console.error('获取README失败:', readmeErr)
          // README获取失败不影响主流程
        }

        setError(null)
      } catch (err) {
        console.error('获取GitHub仓库信息出错:', err)
        setError('无法获取GitHub仓库信息')
      } finally {
        setLoading(false)
      }
    }

    if (owner && name) {
      fetchGitHubRepo()
    }
  }, [owner, name, currentBranch])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("已复制到剪贴板")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("复制失败")
    }
  }

  const fetchBranches = async () => {
    if (!owner || !name) return

    try {
      setLoadingBranches(true)
      const response = await fetch(`https://api.github.com/repos/${owner}/${name}/branches`)
      if (response.ok) {
        const branchData = await response.json()
        setBranches(branchData.map((branch: any) => branch.name))
      }
    } catch (error) {
      console.error('获取分支列表失败:', error)
    } finally {
      setLoadingBranches(false)
    }
  }

  const handleAddRepository = async (values: RepositoryFormValues) => {
    try {
      const response = await submitWarehouse(values)
      if (response.success) {
        toast.success("仓库添加成功")
        // 刷新页面以获取最新数据
        window.location.reload()
      } else {
        toast.error(response.error || '未知错误')
      }
    } catch (error) {
      console.error('添加仓库出错:', error)
      toast.error("请稍后重试")
    }
    setFormVisible(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">仓库未索引</h2>
          <p className="text-muted-foreground mb-6">如果已经添加成功可能需要等待一段时间。</p>
          <p className="text-sm text-muted-foreground mb-6">{`${owner}/${name} ${error}`}</p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href={`https://github.com/${owner}/${name}`} target="_blank">
                <Github className="mr-2 h-4 w-4" />
                前往GitHub查看
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setFormVisible(true)}>
              <Plus className="mr-2 h-4 w-4" />
              添加仓库
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {repoInfo && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={repoInfo.owner.avatar_url} alt={owner} />
                  <AvatarFallback>{owner.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-2xl">
                      <Link href={repoInfo.html_url} target="_blank" className="hover:underline">
                        {owner}/{name}{currentBranch && currentBranch !== repoInfo.default_branch ? ` (${currentBranch})` : ''}
                      </Link>
                    </CardTitle>
                    <Badge variant="outline">
                      {repoInfo.visibility}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    {repoInfo.description || `${owner}/${name} 仓库`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button asChild>
                    <Link href={`https://github.com/${owner}/${name}${currentBranch && currentBranch !== repoInfo.default_branch ? `/tree/${currentBranch}` : ''}`} target="_blank">
                      <Github className="mr-2 h-4 w-4" />
                      在GitHub上查看
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => setFormVisible(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加仓库
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {repoInfo.stargazers_count} 星标
                </Badge>
                <Badge className="flex items-center gap-1" variant="secondary">
                  <GitFork className="h-3 w-3" />
                  {repoInfo.forks_count} 分支
                </Badge>
                {repoInfo.language && (
                  <Badge className="flex items-center gap-1" variant="outline">
                    {repoInfo.language}
                  </Badge>
                )}
                {repoInfo.license && (
                  <Badge className="flex items-center gap-1" variant="outline">
                    {repoInfo.license.name}
                  </Badge>
                )}
                <Badge className="flex items-center gap-1" variant="outline">
                  <Calendar className="h-3 w-3" />
                  更新于 {formatDate(repoInfo.updated_at)}
                </Badge>
                {repoInfo.topics && repoInfo.topics.length > 0 && (
                  repoInfo.topics.slice(0, 3).map(topic => (
                    <Badge key={topic} variant="secondary" className="bg-primary/10 hover:bg-primary/20">
                      {topic}
                    </Badge>
                  ))
                )}
              </div>
              
              {/* 仓库链接和信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-3">仓库信息</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">所有者:</span>
                        <Link href={repoInfo.owner.html_url} target="_blank" className="hover:underline text-primary">
                          {owner}
                        </Link>
                      </li>
                      <li className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">可见性:</span>
                        <span>{repoInfo.visibility}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">默认分支:</span>
                        <span>{repoInfo.default_branch}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">问题:</span>
                        <span>{repoInfo.open_issues_count} 个开放问题</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-3">快速链接</h3>
                    <ul className="space-y-2 text-sm">
                      <li>
                        <Link 
                          href={`https://github.com/${owner}/${name}/issues`} 
                          target="_blank"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          问题列表
                        </Link>
                      </li>
                      <li>
                        <Link 
                          href={`https://github.com/${owner}/${name}/pulls`} 
                          target="_blank"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          拉取请求
                        </Link>
                      </li>
                      <li>
                        <Link 
                          href={`https://github.com/${owner}/${name}/releases`} 
                          target="_blank"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          发布版本
                        </Link>
                      </li>
                      <li>
                        <Link 
                          href={`https://github.com/${owner}/${name}/wiki`} 
                          target="_blank"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <LinkIcon className="h-4 w-4" />
                          Wiki
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          {formVisible && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>添加仓库</CardTitle>
                <CardDescription>将此仓库添加到KoalaWiki以便索引和查询</CardDescription>
              </CardHeader>
              <CardContent>
                <RepositoryForm 
                  open={formVisible}
                  initialValues={{
                    address: `https://github.com/${owner}/${name}`,
                    type: 'git',
                    branch: currentBranch || repoInfo.default_branch || 'main',
                  }}
                  onSubmit={handleAddRepository}
                  onCancel={() => setFormVisible(false)}
                  disabledFields={['address']}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
} 