import { fetchApi, ApiResponse } from './api';

// 系统统计数据接口
export interface SystemStats {
  totalUsers: number;
  totalRepositories: number;
  totalDocuments: number;
  totalViews: number;
  monthlyNewUsers: number;
  monthlyNewRepositories: number;
  monthlyNewDocuments: number;
  monthlyViews: number;
  userGrowthRate: number;
  repositoryGrowthRate: number;
  documentGrowthRate: number;
  viewGrowthRate: number;
}

// 最近仓库接口
export interface RecentRepository {
  id: string;
  name: string;
  organizationName: string;
  description: string;
  createdAt: string;
  status: string;
  isRecommended: boolean;
  documentCount: number;
}

// 最近用户接口
export interface RecentUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt?: string;
  roles: string[];
  isOnline: boolean;
}

// 详细统计数据接口
export interface DetailedStatistics {
  systemStats: SystemStats;
  recentRepositories: RecentRepository[];
  recentUsers: RecentUser[];
}

/**
 * 获取详细统计数据
 * @returns 详细统计数据
 */
export async function getDetailedStatistics(): Promise<ApiResponse<any>> {
  return fetchApi<any>('/api/Statistics/DetailedStatistics');
}

/**
 * 获取系统基础统计数据
 * @returns 系统统计数据
 */
export async function getSystemStats(): Promise<ApiResponse<SystemStats>> {
  return fetchApi<SystemStats>('/api/Statistics/SystemStats');
}

/**
 * 获取最近创建的仓库列表
 * @param limit 限制返回数量，默认为10
 * @returns 最近仓库列表
 */
export async function getRecentRepositories(limit: number = 10): Promise<ApiResponse<RecentRepository[]>> {
  return fetchApi<RecentRepository[]>(`/api/Statistics/RecentRepositories?limit=${limit}`);
}

/**
 * 获取最近注册的用户列表
 * @param limit 限制返回数量，默认为10
 * @returns 最近用户列表
 */
export async function getRecentUsers(limit: number = 10): Promise<ApiResponse<RecentUser[]>> {
  return fetchApi<RecentUser[]>(`/api/Statistics/RecentUsers?limit=${limit}`);
} 