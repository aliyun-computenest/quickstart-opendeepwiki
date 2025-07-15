'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Users,
  Shield,
  ChevronRight,
  Settings,
  Key,
  Database,
  Lock
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

import { getUserList } from '../../services/userService';
import { roleService } from '../../services/roleService';

interface PermissionStats {
  totalUsers: number;
  totalRoles: number;
  totalPermissions: number;
  recentAssignments: number;
}

export default function PermissionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState<PermissionStats>({
    totalUsers: 0,
    totalRoles: 0,
    totalPermissions: 0,
    recentAssignments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取真实的统计数据
    const fetchStats = async () => {
      try {
        // 并行获取用户和角色数据
        const [usersResponse, rolesResponse] = await Promise.all([
          getUserList(1, 1), // 只获取第一页用于获取总数
          roleService.getRoleList(1, 1), // 只获取第一页用于获取总数
        ]);

        const newStats: PermissionStats = {
          totalUsers: 0,
          totalRoles: 0,
          totalPermissions: 0, // 这个需要根据实际权限系统来计算
          recentAssignments: 0, // 这个需要根据实际权限分配记录来计算
        };

        // 处理用户数据
        if (usersResponse.code === 200 && usersResponse.data) {
          newStats.totalUsers = usersResponse.data.total;
        }

        // 处理角色数据
        if (rolesResponse.total !== undefined) {
          newStats.totalRoles = rolesResponse.total;
        }

        // TODO: 这里可以添加更多的统计数据API调用
        // 比如权限数量、最近分配记录等

        setStats(newStats);
      } catch (error) {
        console.error('获取权限统计数据失败:', error);
        toast({
          title: "错误",
          description: "获取统计数据失败",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: '角色管理',
      description: '管理系统角色和角色权限',
      icon: <Users className="h-6 w-6 text-blue-500" />,
      path: '/admin/roles',
      color: 'blue',
    },
    {
      title: '用户管理',
      description: '管理用户和用户权限',
      icon: <User className="h-6 w-6 text-green-500" />,
      path: '/admin/users',
      color: 'green',
    },
    {
      title: '仓库权限',
      description: '管理仓库访问权限',
      icon: <Database className="h-6 w-6 text-purple-500" />,
      path: '/admin/repositories',
      color: 'purple',
    },
    {
      title: '系统设置',
      description: '配置系统权限设置',
      icon: <Settings className="h-6 w-6 text-orange-500" />,
      path: '/admin/settings',
      color: 'orange',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-3">
          <Shield className="h-6 w-6" />
          权限管理
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          管理系统用户权限、角色分配和访问控制
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总用户数</p>
                <p className="text-2xl font-bold">{loading ? '...' : stats.totalUsers}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">系统角色</p>
                <p className="text-2xl font-bold">{loading ? '...' : stats.totalRoles}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">权限项目</p>
                <p className="text-2xl font-bold">{loading ? '...' : stats.totalPermissions}</p>
              </div>
              <Key className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">最近分配</p>
                <p className="text-2xl font-bold">{loading ? '...' : stats.recentAssignments}</p>
              </div>
              <Lock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              onClick={() => router.push(action.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {action.icon}
                    <div>
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 权限管理说明 */}
      <Card>
        <CardHeader>
          <CardTitle>权限管理说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">角色管理</h4>
            <p className="text-sm text-muted-foreground">
              创建和管理系统角色，定义角色权限范围
            </p>
          </div>
          <div>
            <h4 className="font-semibold">用户管理</h4>
            <p className="text-sm text-muted-foreground">
              为用户分配角色，控制用户访问权限
            </p>
          </div>
          <div>
            <h4 className="font-semibold">访问控制</h4>
            <p className="text-sm text-muted-foreground">
              基于角色的访问控制 (RBAC)，确保系统安全
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}