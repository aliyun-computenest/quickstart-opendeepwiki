'use client';
import { fetchApi, API_URL, ApiResponse } from './api';

// 角色相关接口定义
export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  warehousePermissionCount: number;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateRoleDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface RoleDetail extends Role {
  users: UserInfo[];
  warehousePermissions: WarehousePermissionDetail[];
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
}

export interface WarehousePermissionDetail {
  warehouseId: string;
  isReadOnly: boolean;
  isWrite: boolean;
  isDelete: boolean;
  organizationName: string;
  warehouseName: string;
  warehouseDescription: string;
}

export interface PageResult<T> {
  total: number;
  items: T[];
}

// 角色管理API服务
export class RoleService {
  private baseUrl = `${API_URL}/api/Role`;

  // 获取角色列表
  async getRoleList(page: number = 1, pageSize: number = 20, keyword?: string, isActive?: boolean): Promise<PageResult<Role>> {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    
    if (keyword) params.append('keyword', keyword);
    if (isActive !== undefined) params.append('isActive', isActive.toString());

    const {data} = await fetchApi<any>(`${this.baseUrl}/rolelist?${params}`, {
      method: 'GET',
    });

    if (data.code !== 200) {
      throw new Error(data.message || '获取角色列表失败');
    }

    return data.data!;
  }

  // 获取角色详情
  async getRoleDetail(id: string): Promise<RoleDetail> {
    const result = await fetchApi<RoleDetail>(`${this.baseUrl}/RoleDetail?id=${encodeURIComponent(id)}`, {
      method: 'GET',
    });

    if (!result.success) {
      throw new Error(result.error || '获取角色详情失败');
    }

    return result.data!;
  }

  // 创建角色
  async createRole(input: CreateRoleDto): Promise<boolean> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/Role`, {
      method: 'POST',
      body: JSON.stringify(input)
    });

    if (data.code !== 200) {
      throw new Error(data.message || '创建角色失败');
    }

    return true;
  }

  // 更新角色
  async updateRole(id: string, input: UpdateRoleDto): Promise<boolean> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/Role?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input)
    });

    if (data.code !== 200) {
      throw new Error(data.message || '更新角色失败');
    }

    return true;
  }

  // 删除角色
  async deleteRole(id: string): Promise<boolean> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/Role?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (data.code !== 200) {
      throw new Error(data.message || '删除角色失败');
    }

    return true;
  }

  // 获取所有角色
  async getAllRoles(): Promise<any> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/RoleList`, {
      method: 'GET',
    });

    if (data.code !== 200) {
      throw new Error(data.message || '获取所有角色失败');
    }

    return data.data!;
  }

  // 批量更新角色状态
  async batchUpdateRoleStatus(ids: string[], isActive: boolean): Promise<boolean> {
    const {data} = await fetchApi<any>(`${this.baseUrl}/BatchUpdateRoleStatus?isActive=${isActive}`, {
      method: 'POST',
      body: JSON.stringify(ids)
    });

    if (data.code !== 200) {
      throw new Error(data.message || '批量更新角色状态失败');
    }

    return data.data!;
  }
}

// 导出服务实例
export const roleService = new RoleService(); 