'use client'

import Link from 'next/link';
import { 
  DashboardOutlined, 
  UserOutlined, 
  DatabaseOutlined, 
  SettingOutlined,
} from '@ant-design/icons';

// 定义导航项结构
export interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface SidebarProps {
  isSidebarOpen: boolean;
  selectedKey: string;
}

export default function Sidebar({ isSidebarOpen, selectedKey }: SidebarProps) {
  // 导航菜单配置
  const navItems: NavItem[] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '数据统计',
      path: '/admin',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: '用户管理',
      path: '/admin/users',
    },
    {
      key: 'repositories',
      icon: <DatabaseOutlined />,
      label: '仓库管理',
      path: '/admin/repositories',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统管理',
      path: '/admin/settings',
    },
  ];

  return (
    <aside 
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100%',
        backgroundColor: 'white',
        transition: 'all 0.3s',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
        zIndex: 20,
        width: isSidebarOpen ? '16rem' : '5rem'
      }}
    >
      <nav style={{ marginTop: '1.5rem' }}>
        <ul style={{ padding: '0 0.75rem' }}>
          {navItems.map((item) => (
            <li key={item.key}>
              <Link 
                href={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem',
                  transition: 'all 0.2s',
                  color: selectedKey === item.key ? '#0771c9' : '#4b5563',
                  backgroundColor: selectedKey === item.key ? '#f0f7ff' : 'transparent',
                  fontWeight: selectedKey === item.key ? 500 : 400
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                {isSidebarOpen && <span style={{ marginLeft: '0.75rem' }}>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
} 