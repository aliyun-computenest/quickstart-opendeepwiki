import { API_URL } from './api';
import { fetchApi, ApiResponse } from './fetchApi';

// MCP配置接口
export interface AppConfigMcp {
  url: string;
  headers: Record<string, string>;
}

// 应用配置接口
export interface AppConfigInput {
  appId: string;
  name: string;
  organizationName: string;
  repositoryName: string;
  allowedDomains: string[];
  enableDomainValidation: boolean;
  description: string;
  prompt?: string;
  introduction?: string;
  model?: string;
  recommendedQuestions?: string[];
  mcps?: AppConfigMcp[];
}

export interface AppConfigOutput {
  appId: string;
  name: string;
  organizationName: string;
  repositoryName: string;
  allowedDomains: string[];
  enableDomainValidation: boolean;
  description: string;
  prompt?: string;
  introduction?: string;
  model?: string;
  recommendedQuestions?: string[];
  mcps?: AppConfigMcp[];
  createdAt: string;
  updatedAt: string;
  isEnabled?: boolean;
}

export interface DomainValidationRequest {
  appId: string;
  domain: string;
}

export interface DomainValidationResponse {
  isValid: boolean;
  reason?: string;
  appConfig?: AppConfigOutput;
}

/**
 * 创建应用配置
 * @param appConfig 应用配置信息
 * @returns 创建结果
 */
export async function createAppConfig(appConfig: AppConfigInput): Promise<ApiResponse<AppConfigOutput>> {
  return fetchApi<AppConfigOutput>(`${API_URL}/api/AppConfig`, {
    method: 'POST',
    body: JSON.stringify(appConfig),
  });
}

/**
 * 获取应用配置列表
 * @returns 应用配置列表
 */
export async function getAppConfigs(): Promise<ApiResponse<AppConfigOutput[]>> {
  return fetchApi<AppConfigOutput[]>(`${API_URL}/api/AppConfig`);
}

/**
 * 根据 AppId 获取应用配置
 * @param appId 应用ID
 * @returns 应用配置
 */
export async function getAppConfigByAppId(appId: string): Promise<ApiResponse<AppConfigOutput>> {
  return fetchApi<AppConfigOutput>(`${API_URL}/api/AppConfig/${encodeURIComponent(appId)}`);
}

/**
 * 更新应用配置
 * @param appId 应用ID
 * @param appConfig 应用配置信息
 * @returns 更新结果
 */
export async function updateAppConfig(appId: string, appConfig: AppConfigInput): Promise<ApiResponse<AppConfigOutput>> {
  return fetchApi<AppConfigOutput>(`${API_URL}/api/AppConfig/${encodeURIComponent(appId)}`, {
    method: 'PUT',
    body: JSON.stringify(appConfig),
  });
}

/**
 * 删除应用配置
 * @param appId 应用ID
 * @returns 删除结果
 */
export async function deleteAppConfig(appId: string): Promise<ApiResponse<void>> {
  return fetchApi<void>(`${API_URL}/api/AppConfig/${encodeURIComponent(appId)}`, {
    method: 'DELETE',
  });
}

/**
 * 启用/禁用应用
 * @param appId 应用ID
 * @returns 切换结果
 */
export async function toggleAppConfigEnabled(appId: string): Promise<ApiResponse<AppConfigOutput>> {
  return fetchApi<AppConfigOutput>(`${API_URL}/api/AppConfig/${encodeURIComponent(appId)}/toggle`, {
    method: 'POST',
  });
}

/**
 * 域名验证
 * @param request 验证请求
 * @returns 验证结果
 */
export async function validateDomain(request: DomainValidationRequest): Promise<ApiResponse<DomainValidationResponse>> {
  return fetchApi<DomainValidationResponse>(`${API_URL}/api/AppConfig/validatedomain`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * 获取公开应用配置
 * @param appId 应用ID
 * @returns 公开应用配置
 */
export async function getPublicAppConfig(appId: string): Promise<ApiResponse<AppConfigOutput>> {
  return fetchApi<AppConfigOutput>(`${API_URL}/api/AppConfig/public/${encodeURIComponent(appId)}`);
}

/**
 * 生成随机应用ID
 * @returns 随机应用ID
 */
export function generateAppId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `app_${timestamp}_${randomStr}`;
}

/**
 * 获取仓库列表（用于选择器）
 * @returns 仓库列表
 */
export async function getRepositoriesForSelector(): Promise<ApiResponse<{ organizationName: string; name: string; }[]>> {
  try {
    // 这里可以调用现有的仓库获取 API
    // 暂时返回空数组，可以根据实际需要修改
    return {
      code: 200,
      data: [],
      message: 'Success'
    };
  } catch (error) {
    return {
      code: 500,
      data: [],
      message: error instanceof Error ? error.message : '获取仓库列表失败'
    };
  }
} 