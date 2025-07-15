'use client'

import * as React from "react"
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage 
} from "../../components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Building, 
  Github, 
  Database, 
  Home, 
  Search, 
  Calendar, 
  Link as LinkIcon, 
  Globe, 
  User, 
  Code, 
  History, 
  FileText,
  Star,
  GitFork,
  AlertCircle
} from "lucide-react"
import Link from 'next/link'
import { Repository } from '../types'
import { getWarehouse } from '../services/warehouseService'
import { usePathname } from 'next/navigation'
import { useTranslation } from '../i18n/client'

export default function OrganizationPageOptimized({ params }: any) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const pathParts = pathname.split('/').filter(Boolean)
  const owner = pathParts[0] || ''

  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [total, setTotal] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [orgInfo, setOrgInfo] = useState<any>(null)
  const [orgInfoLoading, setOrgInfoLoading] = useState(true)

  // 获取组织头像和信息
  useEffect(() => {
    if (owner) {
      setAvatarUrl(`https://github.com/${owner}.png`)
      fetchOrganizationInfo()
    }
  }, [owner])

  // 加载仓库数据
  useEffect(() => {
    fetchRepositories()
  }, [owner, searchValue])

  const fetchOrganizationInfo = async () => {
    setOrgInfoLoading(true)
    try {
      const response = await fetch(`https://api.github.com/orgs/${owner}`)
      if (response.ok) {
        const data = await response.json()
        setOrgInfo(data)
      } else {
        const userResponse = await fetch(`https://api.github.com/users/${owner}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setOrgInfo({
            ...userData,
            isUser: true
          })
        }
      }
    } catch (error) {
      console.error('获取组织信息失败:', error)
      setOrgInfo({
        name: owner,
        description: `${owner} 的文档仓库`,
        created_at: null,
        isDefault: true
      })
    } finally {
      setOrgInfoLoading(false)
    }
  }

  const fetchRepositories = async () => {
    setLoading(true)
    try {
      const response = await getWarehouse(1, 100, searchValue)
      if (response.success && response.data) {
        const orgRepos = response.data.items.filter(repo => {
          try {
            const url = new URL(repo.address)
            const repoOwner = url.pathname.split('/')[1]
            return repoOwner.toLowerCase() === owner.toLowerCase()
          } catch (e) {
            if (repo.address.includes('github.com')) {
              const parts = repo.address.replace('https://github.com/', '').split('/')
              return parts[0].toLowerCase() === owner.toLowerCase()
            }
            return false
          }
        })
        setRepositories(orgRepos)
        setTotal(orgRepos.length)
      }
    } catch (error) {
      console.error('获取仓库失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '未知'
    return new Date(dateString).toLocaleDateString()
  }

  const getRepoInfo = (address: string) => {
    try {
      if (address.includes('github.com')) {
        const parts = address.replace('https://github.com/', '').split('/')
        return {
          owner: parts[0],
          name: parts[1].split('/')[0].replace('.git', '')
        }
      }
      const url = new URL(address)
      const owner = url.pathname.split('/')[1]
      const name = url.pathname.split('/')[2]
      return {
        owner: owner,
        name: name.split('.')[0]
      }
    } catch (e) {
      return { owner: '', name: '' }
    }
  }

  const stats = {
    totalRepositories: total,
    gitRepos: repositories.filter(repo => repo.type === 'git').length,
    completedRepos: repositories.filter(repo => repo.status === 2).length,
    lastUpdated: repositories.length ? new Date(
      Math.max(...repositories.map(repo => new Date(repo.updatedAt || repo.createdAt).getTime()))
    ).toLocaleDateString() : '-'
  }

  if (orgInfoLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 面包屑导航 */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>{owner}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 组织信息卡片 */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} alt={owner} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">{orgInfo?.name || owner}</CardTitle>
                <Badge variant="secondary">
                  {orgInfo?.isUser ? (
                    <>
                      <User className="h-3 w-3 mr-1" />
                      个人用户
                    </>
                  ) : (
                    <>
                      <Building className="h-3 w-3 mr-1" />
                      组织
                    </>
                  )}
                </Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`https://github.com/${owner}`} target="_blank">
                    <Github className="h-4 w-4 mr-1" />
                    GitHub
                  </Link>
                </Button>
              </div>
              <CardDescription className="text-base">
                {orgInfo?.description || `${owner} 的文档仓库`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalRepositories}</div>
              <div className="text-sm text-muted-foreground">总仓库数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.gitRepos}</div>
              <div className="text-sm text-muted-foreground">Git 仓库</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.completedRepos}</div>
              <div className="text-sm text-muted-foreground">已完成</div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {orgInfo?.created_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">创建时间:</span>
                <span>{formatDate(orgInfo.created_at)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">最后更新:</span>
              <span>{stats.lastUpdated}</span>
            </div>
            {orgInfo?.location && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">地点:</span>
                <span>{orgInfo.location}</span>
              </div>
            )}
            {orgInfo?.blog && (
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">网站:</span>
                <Link 
                  href={orgInfo.blog.startsWith('http') ? orgInfo.blog : `https://${orgInfo.blog}`} 
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  {orgInfo.blog}
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 仓库列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>仓库列表</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索仓库..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : repositories.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchValue ? `未找到匹配 "${searchValue}" 的仓库` : `${owner} 还没有仓库`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.map((repo) => {
                const repoInfo = getRepoInfo(repo.address)
                return (
                  <Card key={repo.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          <Link 
                            href={`/${repoInfo.owner}/${repoInfo.name}`}
                            className="hover:text-primary"
                          >
                            {repo.name}
                          </Link>
                        </CardTitle>
                        <Badge variant={repo.type === 'git' ? 'default' : 'secondary'}>
                          {repo.type === 'git' ? <Github className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                          {repo.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatDate(repo.updatedAt || repo.createdAt)}</span>
                        <Badge variant="outline" className="text-xs">
                          {repo.status === 2 ? '已完成' : '处理中'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 