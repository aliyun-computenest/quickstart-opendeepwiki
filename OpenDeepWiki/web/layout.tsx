'use client'

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { ConfigProvider } from '@lobehub/ui';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('管理员');
  const pathname = usePathname();
  const router = useRouter();

  // 获取当前选中的菜单项
  const getSelectedKey = () => {
    if (pathname === '/admin') return 'dashboard';
    if (pathname.startsWith('/admin/users')) return 'users';
    if (pathname.startsWith('/admin/repositories')) return 'repositories';
    if (pathname.startsWith('/admin/settings')) return 'settings';
    return '';
  };

  // 检查用户是否已登录
  useEffect(() => {
    // 模拟检查登录状态
    const checkLoginStatus = () => {
      const userToken = localStorage.getItem('userToken');
      if (!userToken) {
        // 保存当前路径，以便登录后返回
        localStorage.setItem('redirectPath', pathname);
        router.push('/login');
      } else {
        setIsLoggedIn(true);
        // 获取存储的用户名
        const storedUserName = localStorage.getItem('userName');
        if (storedUserName) {
          setUserName(storedUserName);
        }
      }
      setIsLoading(false);
    };

    checkLoginStatus();
  }, [router, pathname]);

  // 处理登出
  const handleLogout = () => {
    // 清除用户登录信息
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    // 重定向到登录页面
    router.push('/login');
  };

  // 切换侧边栏
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 如果正在加载，显示空内容
  if (isLoading) {
    return null;
  }

  // 如果未登录，将由useEffect重定向到登录页面
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <ConfigProvider
        config={{
          proxy: 'custom',
          customCdnFn: (e: { pkg: string, version: string, path: string }) => {
            console.log(e);
            return `/${e.pkg}/${e.version}/${e.path}`;
          }
        }}
      >

        <div style={{
          display: 'flex',
          height: '100vh',
          backgroundColor: '#f7f9fc'
        }}>
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            selectedKey={getSelectedKey()}
          />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            marginLeft: isSidebarOpen ? '16rem' : '5rem',
            transition: 'all 0.3s'
          }}>
            <Header
              toggleSidebar={toggleSidebar}
              userName={userName}
              onLogout={handleLogout}
            />

            <main style={{
              flex: 1,
              overflow: 'auto',
              padding: '1.5rem'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                padding: '1.5rem',
                minHeight: 'calc(100vh - 8rem)'
              }}>
                {children}
              </div>
            </main>
          </div>
        </div>
      </ConfigProvider>
    </>
  );
} 