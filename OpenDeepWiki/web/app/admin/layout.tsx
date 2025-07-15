'use client'

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  Database,
  Settings,
  Zap,
  LogOut,
  UserCheck,
  Key,
  User
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import { UserMenu } from '../services/menuService';

// 菜单项类型定义
interface MenuItemType {
  key: string;
  icon: React.ReactNode;
  label: string;
  url?: string;
  children?: MenuItemType[];
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('管理员');
  const [userRole, setUserRole] = useState('user');
  const [userMenu, setUserMenu] = useState<UserMenu | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // 获取当前激活的菜单项
  const getActiveKey = () => {
    if (pathname === '/admin') return 'dashboard';
    if (pathname.startsWith('/admin/users')) return 'users';
    if (pathname.startsWith('/admin/repositories')) return 'repositories';
    if (pathname.startsWith('/admin/finetune')) return 'finetune';
    if (pathname.startsWith('/admin/roles')) return 'roles';
    if (pathname.startsWith('/admin/permissions')) return 'permissions';
    if (pathname.startsWith('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  // 导航菜单配置
  const getNavItems = (): MenuItemType[] => {
    const allItems: MenuItemType[] = [
      {
        key: 'dashboard',
        icon: <BarChart3 className="h-4 w-4" />,
        label: '数据统计',
        url: '/admin',
      },
      {
        key: 'users',
        icon: <Users className="h-4 w-4" />,
        label: '用户管理',
        url: '/admin/users',
      },
      {
        key: 'repositories',
        icon: <Database className="h-4 w-4" />,
        label: '仓库管理',
        url: '/admin/repositories',
      },
      {
        key: 'finetune',
        icon: <Zap className="h-4 w-4" />,
        label: '数据微调',
        url: '/admin/finetune',
      },
      {
        key: 'permissions',
        icon: <Key className="h-4 w-4" />,
        label: '权限管理',
        children: [
          {
            key: 'roles',
            icon: <UserCheck className="h-4 w-4" />,
            label: '角色管理',
            url: '/admin/roles',
          },
          {
            key: 'permissions-roles',
            icon: <Key className="h-4 w-4" />,
            label: '角色权限',
            url: '/admin/permissions/roles',
          },
          {
            key: 'permissions-users',
            icon: <Users className="h-4 w-4" />,
            label: '用户角色',
            url: '/admin/permissions/users',
          },
        ],
      },
      {
        key: 'settings',
        icon: <Settings className="h-4 w-4" />,
        label: '系统设置',
        url: '/admin/settings',
      },
    ];

    if (userRole === 'admin') {
      return allItems;
    } else {
      // 普通用户显示：数据统计、仓库管理、数据微调、系统设置
      return [
        allItems[0], // 数据统计
        allItems[2], // 仓库管理
        allItems[3], // 数据微调
        allItems[5], // 系统设置
      ];
    }
  };

  // 用户下拉菜单项
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <User className="h-4 w-4" />,
    },
    {
      key: 'settings',
      label: '设置',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogOut className="h-4 w-4" />,
    },
  ];

  // 检查用户是否已登录
  useEffect(() => {
    const checkLoginStatus = async () => {
      const userToken = localStorage.getItem('userToken') || localStorage.getItem('token');
      if (!userToken) {
        localStorage.setItem('redirectPath', pathname);
        router.push('/login');
      } else {
        setIsLoggedIn(true);
        const storedUserName = localStorage.getItem('userName');
        if (storedUserName) {
          setUserName(storedUserName);
        }
        
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          try {
            const userInfo = JSON.parse(userInfoStr);
            if (userInfo.role) {
              setUserRole(userInfo.role);
            } else {
              setUserRole('user');
            }
          } catch (error) {
            console.error('解析用户信息失败:', error);
            setUserRole('user');
          }
        } else {
          setUserRole('user');
        }
      }
      setIsLoading(false);
    };
    
    checkLoginStatus();
  }, [router, pathname]);

  // 处理登出
  const handleLogout = () => {
    console.log('用户退出登录');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('redirectPath');

    setIsLoggedIn(false);
    setUserName('管理员');
    setUserRole('user');

    router.push('/login');
  };

  // 处理菜单点击
  const handleMenuClick = (url: string) => {
    router.push(url);
  };

  // 处理用户菜单点击
  const handleUserMenuClick = (key: string) => {
    switch (key) {
      case 'profile':
        router.push('/admin/settings/profile');
        break;
      case 'settings':
        router.push('/admin/settings');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-sm text-muted-foreground">加载中...</div>
      </div>
    );
  }

  // 如果未登录，将由useEffect重定向到登录页面
  if (!isLoggedIn) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground text-sm font-semibold">
                K
              </div>
              <span className="text-lg font-semibold">KoalaWiki</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {getNavItems().map((item) => (
                    <SidebarMenuItem key={item.key}>
                      {item.children ? (
                        <SidebarMenuSub>
                          <SidebarMenuButton
                            isActive={getActiveKey() === item.key}
                            className="w-full"
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.key}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={getActiveKey() === child.key}
                              >
                                <button
                                  onClick={() => child.url && handleMenuClick(child.url)}
                                  className="w-full"
                                >
                                  {child.icon}
                                  <span>{child.label}</span>
                                </button>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={getActiveKey() === item.key}
                        >
                          <button
                            onClick={() => item.url && handleMenuClick(item.url)}
                            className="w-full"
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="overflow-hidden">
          {/* 头部 */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {userName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{userName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {userMenuItems.map((item) => (
                  item.key === 'logout' ? (
                    <div key={item.key}>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleUserMenuClick(item.key)}
                        className="text-destructive focus:text-destructive"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    </div>
                  ) : (
                    <DropdownMenuItem
                      key={item.key}
                      onClick={() => handleUserMenuClick(item.key)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  )
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* 内容区域 */}
          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}