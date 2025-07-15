'use client';
import { fetchApi, API_URL, ApiResponse } from './api';

// 权限相关接口定义
export interface WarehousePermission {
  warehouseId: string;
  isReadOnly: boolean;
  isWrite: boolean;
  isDelete: boolean;
}

export interface WarehousePermissionTree {
  id: string;
  name: string;
  type: 'organization' | 'warehouse';
  isSelected: boolean;
  permission?: WarehousePermission;
  children: WarehousePermissionTree[];
}

export interface RolePermission {
  roleId: string;
  warehousePermissions: WarehousePermission[];
}

export interface UserRole {
  userId: string;
  roleIds: string[];
}

// 权限管理API服务
export class PermissionService {
  private baseUrl = `${API_URL}/api/Permission`;

  // 获取仓库权限树形结构
  async getWarehousePermissionTree(roleId?: string): Promise<WarehousePermissionTree[]> {
    const params = roleId ? `?roleId=${encodeURIComponent(roleId)}` : '';
    
    const {data} = await fetchApi<any>(`${this.baseUrl}/WarehousePermissionTree${params}`, {
      method: 'GET',
    });

    if (data.code !== 200) {
      throw new Error(data.message || '获取仓库权限树失败');
    }

    return data.data!;
  }

  // 设置角色权限
  async setRolePermissions(data: RolePermission): Promise<boolean> {
    const result = await fetchApi<boolean>(`${this.baseUrl}/SetRolePermissions`, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!result.success) {
      throw new Error(result.error || '设置角色权限失败');
    }

    return result.data!;
  }

  // 获取角色的仓库权限列表
  async getRoleWarehousePermissions(roleId: string): Promise<import('./roleService').WarehousePermissionDetail[]> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/RoleWarehousePermissions?roleId=${encodeURIComponent(roleId)}`, {
      method: 'GET',
    });

    if (data.code !== 200) {
      throw new Error(data.message || '获取角色仓库权限失败');
    }

    return data.data!;
  }

  // 分配用户角色
  async assignUserRoles(input: UserRole): Promise<boolean> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/AssignUserRoles`, {
      method: 'POST',
      body: JSON.stringify(input)
    });

    if (data.code !== 200) {
      throw new Error(data.message || '分配用户角色失败');
    }

    return data.data!;
  }

  // 获取用户的角色列表
  async getUserRoles(userId: string): Promise<import('./roleService').Role[]> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/UserRoles?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
    });

    if (data.code !== 200) {
      throw new Error(data.message || '获取用户角色失败');
    }

    return data.data!;
  }

  // 检查用户对仓库的权限
  async checkUserWarehousePermission(userId: string, warehouseId: string): Promise<WarehousePermission | null> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/CheckUserWarehousePermission?userId=${encodeURIComponent(userId)}&warehouseId=${encodeURIComponent(warehouseId)}`, {
      method: 'POST',
    });

    if (data.code !== 200) {
      throw new Error(data.message || '检查用户仓库权限失败');
    }

    return data.data!;
  }

  // 获取用户可访问的仓库列表
  async getUserAccessibleWarehouses(userId: string): Promise<import('./roleService').WarehousePermissionDetail[]> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/UserAccessibleWarehouses?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
    });

    if (data.code !== 200) {
      throw new Error(data.message || '获取用户可访问仓库失败');
    }

    return data.data!;
  }

  // 批量设置组织权限
  async setOrganizationPermissions(roleId: string, organizationName: string, permission: WarehousePermission): Promise<boolean> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/SetOrganizationPermissions?roleId=${encodeURIComponent(roleId)}&organizationName=${encodeURIComponent(organizationName)}`, {
      method: 'POST',
      body: JSON.stringify(permission)
    });

    if (data.code !== 200) {
      throw new Error(data.message || '批量设置组织权限失败');
    }

    return data.data!;
  }
}

// 导出服务实例
export const permissionService = new PermissionService(); 