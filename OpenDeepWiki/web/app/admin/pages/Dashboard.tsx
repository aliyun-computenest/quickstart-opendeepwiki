'use client'

import { useState, useEffect } from 'react';
import {
  Users,
  Database,
  FileText,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  getDetailedStatistics,
  DetailedStatistics,
} from '../../services/dashboardService';

export default function Dashboard() {
  const [stats, setStats] = useState<DetailedStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const {data} = await getDetailedStatistics();

      if (data) {
        setStats(data.data);
      } else {
        throw new Error(data.message || data.error || '获取统计数据失败');
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : '获取统计数据失败，请稍后重试';
      setError(errorMessage);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#52c41a';
      case 'Pending':
        return '#faad14';
      case 'Processing':
        return '#1677ff';
      default:
        return '#8c8c8c';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Completed':
        return '已完成';
      case 'Pending':
        return '待处理';
      case 'Processing':
        return '处理中';
      default:
        return '未知';
    }
  };

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? 'text-green-500' : 'text-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">数据统计</h1>

        {/* 统计卡片骨架屏 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item} className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 详细信息骨架屏 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats && error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">数据统计</h1>
          <p className="text-sm text-muted-foreground mt-2">
            系统运行概况与数据分析
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            数据加载失败：{error}
            <button
              onClick={() => window.location.reload()}
              className="ml-4 px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
            >
              重新加载
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px'
      }}>
        <span className="text-muted-foreground">暂无数据</span>
      </div>
    );
  }

  // 统计卡片数据
  const statCards = [
    {
      title: '总用户数',
      value: stats.systemStats.totalUsers,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      iconBg: 'bg-blue-100',
      growth: `${stats.systemStats.userGrowthRate >= 0 ? '+' : ''}${stats.systemStats.userGrowthRate}%`,
      growthRate: stats.systemStats.userGrowthRate,
    },
    {
      title: '仓库数量',
      value: stats.systemStats.totalRepositories,
      icon: <Database className="h-6 w-6 text-green-600" />,
      iconBg: 'bg-green-100',
      growth: `${stats.systemStats.repositoryGrowthRate >= 0 ? '+' : ''}${stats.systemStats.repositoryGrowthRate}%`,
      growthRate: stats.systemStats.repositoryGrowthRate,
    },
    {
      title: '文档数量',
      value: stats.systemStats.totalDocuments,
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      iconBg: 'bg-purple-100',
      growth: `${stats.systemStats.documentGrowthRate >= 0 ? '+' : ''}${stats.systemStats.documentGrowthRate}%`,
      growthRate: stats.systemStats.documentGrowthRate,
    },
    {
      title: '总访问量',
      value: stats.systemStats.totalViews,
      icon: <Eye className="h-6 w-6 text-orange-600" />,
      iconBg: 'bg-orange-100',
      growth: `${stats.systemStats.viewGrowthRate >= 0 ? '+' : ''}${stats.systemStats.viewGrowthRate}%`,
      growthRate: stats.systemStats.viewGrowthRate,
    },
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Processing':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">数据统计</h1>
        <p className="text-sm text-muted-foreground mt-2">
          系统运行概况与数据分析
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  {card.title}
                </p>
                <p className="text-3xl font-semibold mb-4">
                  {card.value.toLocaleString()}
                </p>
                <div className="flex items-center text-xs">
                  {getGrowthIcon(card.growthRate)}
                  <span className={`ml-1 mr-2 ${getGrowthColor(card.growthRate)}`}>
                    {card.growth}
                  </span>
                  <span className="text-muted-foreground">本月增长</span>
                </div>
              </div>
              <div className={`w-12 h-12 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 详细信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近创建的仓库 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              最近创建的仓库
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>仓库名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>文档数</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentRepositories.map((repo) => (
                  <TableRow key={repo.name}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {repo.organizationName}/{repo.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {repo.description || '暂无描述'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(repo.status)} className="gap-1">
                        {repo.status === 'Completed' ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {getStatusText(repo.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{repo.documentCount} 个</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(repo.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 最近注册的用户 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              最近注册的用户
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>注册时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentUsers.map((user) => (
                  <TableRow key={user.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                          {user.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.roles.map((role, index) => (
                          <Badge
                            key={index}
                            variant={role === 'admin' ? 'destructive' : 'default'}
                          >
                            {role === 'admin' ? '管理员' : '用户'}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}