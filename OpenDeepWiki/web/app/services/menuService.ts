'use client';
import { fetchApi, API_URL, ApiResponse } from './api';
import { UserInfo } from './roleService';

// 菜单相关接口定义
export interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon?: string;
  order: number;
  isHidden: boolean;
  requiredRoles: string[];
  children: MenuItem[];
}

export interface UserMenu {
  user?: UserInfo;
  menus: MenuItem[];
}

// 菜单管理API服务
export class MenuService {
  private baseUrl = `${API_URL}/api/Menu`;

  // 获取当前用户的菜单
  async getUserMenu(): Promise<UserMenu> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/UserMenu`, {
      method: 'GET',
    });

    if (data.code !== 200) {
      throw new Error(data.message || '获取用户菜单失败');
    }
    return data.data!;
  }

  // 获取系统菜单结构（管理员权限）
  async getSystemMenus(): Promise<MenuItem[]> {
    const result = await fetchApi<MenuItem[]>(`${this.baseUrl}/SystemMenu`, {
      method: 'GET',
    });

    if (!result.success) {
      throw new Error(result.error || '获取系统菜单失败');
    }

    return result.data!;
  }

  // 检查用户路径访问权限
  async checkUserPathPermission(path: string, userId?: string): Promise<boolean> {
    const params = new URLSearchParams({ path });
    if (userId) params.append('userId', userId);

    const { data } = await fetchApi<any>(`${this.baseUrl}/CheckUserPathPermission?${params}`, {
      method: 'POST',
    });

    if (data.code !== 200) {
      throw new Error(data.message || '检查用户路径权限失败');
    }

    return data.data!;
  }

  // 本地菜单工具方法

  // 根据路径查找菜单项
  findMenuByPath(menus: MenuItem[], path: string): MenuItem | null {
    for (const menu of menus) {
      if (menu.path === path) {
        return menu;
      }

      const childResult = this.findMenuByPath(menu.children, path);
      if (childResult) {
        return childResult;
      }
    }
    return null;
  }

  // 根据角色过滤菜单
  filterMenusByRoles(menus: MenuItem[], userRoles: string[]): MenuItem[] {
    const filteredMenus: MenuItem[] = [];

    for (const menu of menus) {
      // 检查当前菜单项是否有权限访问
      const hasAccess = !menu.requiredRoles.length || menu.requiredRoles.some(role => userRoles.includes(role));

      if (hasAccess) {
        // 递归过滤子菜单
        const filteredChildren = this.filterMenusByRoles(menu.children, userRoles);

        // 创建过滤后的菜单项
        const filteredMenu: MenuItem = {
          ...menu,
          children: filteredChildren
        };

        filteredMenus.push(filteredMenu);
      }
    }

    return filteredMenus;
  }

  // 扁平化菜单结构
  flattenMenus(menus: MenuItem[]): MenuItem[] {
    const flattened: MenuItem[] = [];

    function flatten(items: MenuItem[]) {
      for (const item of items) {
        flattened.push(item);
        if (item.children.length > 0) {
          flatten(item.children);
        }
      }
    }

    flatten(menus);
    return flattened;
  }

  // 获取面包屑路径
  getBreadcrumb(menus: MenuItem[], currentPath: string): MenuItem[] {
    const breadcrumb: MenuItem[] = [];

    function findPath(items: MenuItem[], path: string, current: MenuItem[]): boolean {
      for (const item of items) {
        const newPath = [...current, item];

        if (item.path === path) {
          breadcrumb.push(...newPath);
          return true;
        }

        if (item.children.length > 0) {
          if (findPath(item.children, path, newPath)) {
            return true;
          }
        }
      }
      return false;
    }

    findPath(menus, currentPath, []);
    return breadcrumb;
  }

  // 检查菜单是否激活（当前路径或子路径）
  isMenuActive(menu: MenuItem, currentPath: string): boolean {
    if (menu.path === currentPath) {
      return true;
    }

    // 检查是否有子菜单激活
    return menu.children.some(child => this.isMenuActive(child, currentPath));
  }

  // 获取管理员菜单列表（用于权限配置）
  getAdminMenuList(): MenuItem[] {
    return [
      {
        id: 'admin',
        name: '系统管理',
        path: '/admin',
        icon: 'admin',
        order: 1,
        isHidden: false,
        requiredRoles: ['admin'],
        children: [
          {
            id: 'admin-users',
            name: '用户管理',
            path: '/admin/users',
            icon: 'user',
            order: 1,
            isHidden: false,
            requiredRoles: ['admin'],
            children: []
          },
          {
            id: 'admin-roles',
            name: '角色管理',
            path: '/admin/roles',
            icon: 'role',
            order: 2,
            isHidden: false,
            requiredRoles: ['admin'],
            children: []
          },
          {
            id: 'admin-permissions',
            name: '权限管理',
            path: '/admin/permissions',
            icon: 'permission',
            order: 3,
            isHidden: false,
            requiredRoles: ['admin'],
            children: [
              {
                id: 'admin-role-permissions',
                name: '角色权限',
                path: '/admin/permissions/roles',
                order: 1,
                isHidden: false,
                requiredRoles: ['admin'],
                children: []
              },
              {
                id: 'admin-user-roles',
                name: '用户角色',
                path: '/admin/permissions/users',
                order: 2,
                isHidden: false,
                requiredRoles: ['admin'],
                children: []
              }
            ]
          },
          {
            id: 'admin-repositories',
            name: '仓库管理',
            path: '/admin/repositories',
            icon: 'repository',
            order: 4,
            isHidden: false,
            requiredRoles: ['admin'],
            children: []
          },
          {
            id: 'admin-settings',
            name: '系统设置',
            path: '/admin/settings',
            icon: 'setting',
            order: 5,
            isHidden: false,
            requiredRoles: ['admin'],
            children: []
          }
        ]
      }
    ];
  }
}

// 导出服务实例
export const menuService = new MenuService(); 