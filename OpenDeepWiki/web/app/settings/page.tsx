'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Shield,
  Settings,
  Save,
  Camera,
  CheckCircle,
  Upload
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import {
  getCurrentUser,
  updateCurrentUserProfile,
  verifyPassword,
  changePassword,
  uploadAvatar,
  type UserInfo,
  type UpdateProfileRequest,
  type ChangePasswordRequest
} from '../services/userService';
import AppManagement from '../components/AppManagement';

// 表单验证模式
const profileFormSchema = z.object({
  name: z.string().min(2, '用户名至少2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string()
    .min(8, '密码至少8个字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, '密码必须包含大小写字母和数字'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const router = useRouter();

  // 表单实例
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // 获取当前用户信息
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { data } = await getCurrentUser() as any;
        if (data) {
          const user = data.data;
          // 添加时间戳参数到头像URL以防止浏览器缓存
          const timestamp = new Date().getTime();
          const avatarWithTimestamp = user.avatar ? `${user.avatar}?t=${timestamp}` : '';
          setUserInfo(user);
          setAvatarUrl(avatarWithTimestamp);

          profileForm.setValue('name', user.name || '');
          profileForm.setValue('email', user.email || '');
        } else {
          const storedUserInfo = localStorage.getItem('userInfo');
          if (storedUserInfo) {
            const user = JSON.parse(storedUserInfo);
            // 添加时间戳参数到头像URL以防止浏览器缓存
            const timestamp = new Date().getTime();
            const avatarWithTimestamp = user.avatar ? `${user.avatar}?t=${timestamp}` : '';
            setUserInfo(user);
            setAvatarUrl(avatarWithTimestamp);

            profileForm.setValue('name', user.name || '');
            profileForm.setValue('email', user.email || '');
          } else {
            toast.error('获取用户信息失败，请重新登录');
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
        toast.error('加载用户信息失败');
      }
    };

    loadUserInfo();
  }, [profileForm, router]);

  // 处理个人信息更新
  const handleProfileUpdate = async (values: z.infer<typeof profileFormSchema>) => {
    if (!userInfo) return;

    try {
      setLoading(true);

      const updateData: UpdateProfileRequest = {
        name: values.name,
        email: values.email,
        avatar: avatarUrl,
      };

      const { data } = await updateCurrentUserProfile(updateData) as any;
      if (data.code === 200) {
        toast.success('个人信息更新成功');
        const updatedUser = { ...userInfo, ...updateData };
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        setUserInfo(updatedUser);
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新个人信息失败:', error);
      toast.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理密码修改
  const handlePasswordChange = async (values: z.infer<typeof passwordFormSchema>) => {
    if (!userInfo) return;

    try {
      setLoading(true);

      const verifyResponse = await verifyPassword(values.currentPassword);
      if (verifyResponse.code !== 200 || !verifyResponse.data) {
        toast.error('当前密码不正确');
        return;
      }

      const changePasswordData: ChangePasswordRequest = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      };

      const response = await changePassword(changePasswordData);
      if (response.code === 200) {
        toast.success('密码修改成功');
        passwordForm.reset();
      } else {
        toast.error(response.message || '密码修改失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      toast.error('修改密码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 头像上传处理
  const handleAvatarUpload = async (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif';
    if (!isJpgOrPng) {
      toast.error('只能上传 JPG/PNG/GIF 格式的图片!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      toast.error('图片大小不能超过 2MB!');
      return false;
    }

    try {
      setLoading(true);
      const { data } = await uploadAvatar(file) as any;
      if (data.code === 200 && data.data) {
        // 添加时间戳参数到头像URL以防止浏览器缓存
        const timestamp = new Date().getTime();
        const avatarUrl = `${data.data}?t=${timestamp}`;
        setAvatarUrl(avatarUrl);
        toast.success('头像上传成功');

        if (userInfo) {
          const updateData: UpdateProfileRequest = {
            name: userInfo.name,
            email: userInfo.email,
            avatar: avatarUrl,
          };

          const { data } = await updateCurrentUserProfile(updateData) as any;
          if (data.code === 200) {
            const updatedUser = { ...userInfo, avatar: avatarUrl };
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            setUserInfo(updatedUser);
          }
        }
      } else {
        toast.error(data.message || '头像上传失败');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      toast.error('头像上传失败，请重试');
    } finally {
      setLoading(false);
    }

    return false;
  };

  // 返回首页
  const handleGoHome = () => {
    router.push('/');
  };

  // 侧边栏菜单项
  const menuItems = [
    {
      key: 'profile',
      icon: <User className="w-4 h-4" />,
      title: '账户信息',
    },
    {
      key: 'security',
      icon: <Shield className="w-4 h-4" />,
      title: '安全设置',
    },
    {
      key: 'apps',
      icon: <Settings className="w-4 h-4" />,
      title: '应用管理',
    }
  ];

  // 渲染内容区域
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">账户信息</h2>
              <p className="text-muted-foreground">管理您的个人资料和基本信息</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 头像卡片 */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback>
                          <User className="w-8 h-8" />
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              handleAvatarUpload(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-center">
                      <h3 className="font-medium">{userInfo?.name}</h3>
                      <p className="text-sm text-muted-foreground">{userInfo?.email}</p>
                      <Badge variant="secondary" className="mt-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已验证
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 基本信息表单 */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>用户名</FormLabel>
                              <FormControl>
                                <Input placeholder="请输入用户名" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>邮箱地址</FormLabel>
                              <FormControl>
                                <Input placeholder="请输入邮箱地址" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        <Save className="w-4 h-4 mr-2" />
                        保存更改
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">安全设置</h2>
              <p className="text-muted-foreground">管理您的账户安全和密码设置</p>
            </div>

            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    修改密码
                  </CardTitle>
                  <CardDescription>
                    定期更改密码有助于保护您的账户安全
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>当前密码</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="请输入当前密码" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>新密码</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="请输入新密码" {...field} />
                            </FormControl>
                            <FormDescription>
                              密码必须至少8个字符，包含大小写字母和数字
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>确认新密码</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="请再次输入新密码" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        <Save className="w-4 h-4 mr-2" />
                        更新密码
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'apps':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">应用管理</h2>
              <p className="text-muted-foreground">管理与您账户连接的应用</p>
            </div>
            <div>
              <AppManagement />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar className="border-r">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>设置</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map(item => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.key)}
                        isActive={activeSection === item.key}
                        className="w-full"
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main content */}
        <SidebarInset className="flex-1">
          {/* 顶部导航栏 */}
          <div className="border-b bg-background">
            <div className="flex items-center gap-4 px-4 py-4">
              <SidebarTrigger />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoHome}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">设置</h1>
              </div>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 p-6">
            {loading && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">更新中...</p>
                </div>
              </div>
            )}
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}