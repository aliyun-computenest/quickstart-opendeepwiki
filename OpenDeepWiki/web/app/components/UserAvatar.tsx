'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../i18n/client';
import {
  User,
  LogOut,
  Settings,
  Mail,
  Calendar
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import { UserInfo } from '../services/userService';

interface UserAvatarProps {
  className?: string;
}

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// 获取角色文本
function getRoleText(role: string) {
  switch (role.toLowerCase()) {
    case 'admin':
      return '管理员';
    case 'user':
      return '普通用户';
    default:
      return role;
  }
}

export default function UserAvatar({ className }: UserAvatarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('userToken');
      const userInfoStr = localStorage.getItem('userInfo');

      if (token && userInfoStr) {
        try {
          const user = JSON.parse(userInfoStr);
          setUserInfo(user);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('解析用户信息失败:', error);
          // 清除无效数据
          localStorage.removeItem('userToken');
          localStorage.removeItem('userInfo');
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();

    // 监听存储变化（用于多标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userToken' || e.key === 'userInfo') {
        checkLoginStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 处理登录
  const handleLogin = () => {
    // 保存当前路径用于登录后返回
    localStorage.setItem('redirectPath', window.location.pathname);
    router.push('/login');
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      // 清除本地存储的用户信息
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      setIsLoggedIn(false);
      setUserInfo(null);
      setDropdownOpen(false);
      toast({
        title: "已登出",
        description: "您已成功退出登录",
      });
      // 重定向到首页
      router.push('/');
    } catch (error) {
      console.error('登出失败:', error);
      toast({
        title: "登出失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (!userInfo) return '游客';
    return userInfo.name || userInfo.email || '用户';
  };

  // 为头像URL添加时间戳以防止缓存
  const getAvatarUrl = () => {
    if (!userInfo?.avatar) return '';
    const timestamp = new Date().getTime();
    return `${userInfo.avatar}?t=${timestamp}`;
  };

  return (
    <div className={className}>
      {isLoggedIn ? (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("relative h-8 w-8 rounded-full", className)}>
              <Avatar className="h-8 w-8">
                {userInfo?.avatar ? (
                  <AvatarImage src={getAvatarUrl()} alt={getUserDisplayName()} />
                ) : (
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center p-2">
              <Avatar className="h-10 w-10 mr-3">
                {userInfo?.avatar ? (
                  <AvatarImage src={getAvatarUrl()} alt={getUserDisplayName()} />
                ) : (
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="text-sm font-medium">{getUserDisplayName()}</p>
                <p className="text-xs text-muted-foreground">{getRoleText(userInfo?.role || 'user')}</p>
              </div>
            </div>

            {userInfo?.email && (
              <div className="px-2 py-1.5 flex items-center text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 mr-2" />
                <span>{userInfo.email}</span>
              </div>
            )}

            {userInfo?.createdAt && (
              <div className="px-2 py-1.5 flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-2" />
                <span>{t('auth.joined', '加入于')} {formatDate(userInfo.createdAt)}</span>
              </div>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              <span>{t('auth.settings', '设置')}</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push('/admin')}>
              <User className="h-4 w-4 mr-2" />
              <span>{t('auth.admin_panel', '管理面板')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span>{t('auth.logout', '退出登录')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogin}
          className="px-4"
        >
          {t('auth.login', '登录')}
        </Button>
      )}
    </div>
  );
} 