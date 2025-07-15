import { API_URL } from './api';
import { fetchApi, ApiResponse } from './fetchApi';

// 目录条目接口
export interface DirectoryItem {
  label: string;
  key: string;
  Url: string;
  disabled: boolean;
  lastUpdate: string;
  children?: DirectoryItem[];
}

// 文档内容接口
export interface DocumentContent {
  content: string;
  title: string;
  fileSource: any[];
  address: string;
  branch?: string;
}

// 目录更新请求
export interface UpdateCatalogRequest {
  id: string;
  name: string;
  prompt: string;
}

/**
 * 获取文档目录
 * @param organizationName 组织名称
 * @param name 仓库名称
 * @param branch 分支名称
 * @returns 文档目录
 */
export async function getDocumentCatalog(
  organizationName: string,
  name: string,
  branch?: string
): Promise<ApiResponse<{ items: DirectoryItem[], lastUpdate: string, warehouseId: string }>> {
  let url = `${API_URL}/api/DocumentCatalog/DocumentCatalogs?organizationName=${encodeURIComponent(organizationName)}&name=${encodeURIComponent(name)}`;
  if (branch) {
    url += `&branch=${encodeURIComponent(branch)}`;
  }
  return fetchApi(url);
}

/**
 * 获取指定路径的文档内容
 * @param owner 组织名称
 * @param name 仓库名称
 * @param path 文档路径
 * @param branch 分支名称
 * @returns 文档内容
 */
export async function getDocumentById(
  owner: string,
  name: string,
  path: string,
  branch?: string
): Promise<ApiResponse<DocumentContent>> {
  let url = `${API_URL}/api/DocumentCatalog/DocumentById?owner=${encodeURIComponent(owner)}&name=${encodeURIComponent(name)}&path=${encodeURIComponent(path)}`;
  if (branch) {
    url += `&branch=${encodeURIComponent(branch)}`;
  }
  return fetchApi(url);
}

/**
 * 更新目录信息（标题和提示词）
 * @param catalog 目录更新请求
 * @returns 更新结果
 */
export async function updateCatalog(
  catalog: UpdateCatalogRequest
): Promise<ApiResponse<boolean>> {
  return fetchApi(`${API_URL}/api/DocumentCatalog/UpdateCatalog`, {
    method: 'PUT',
    body: JSON.stringify(catalog),
  });
}

/**
 * 更新文档内容
 * @param id 文档ID
 * @param content 文档内容
 * @returns 更新结果
 */
export async function updateDocumentContent(
  id: string,
  content: string
): Promise<ApiResponse<boolean>> {
  return fetchApi(`${API_URL}/api/DocumentCatalog/UpdateDocumentContent`, {
    method: 'PUT',
    body: JSON.stringify({
      id,
      content
    }),
  });
} 