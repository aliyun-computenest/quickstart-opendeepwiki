/**
 * API响应接口
 */
export interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

/**
 * 封装的fetch函数，用于API请求
 * @param url 请求地址
 * @param options 请求选项
 * @returns API响应
 */
export async function fetchApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // 设置默认请求头
  const headers = options.body instanceof FormData ? {} : {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 获取token（如果存在）
  const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  try {
    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5分钟超时

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // 清除超时定时器

    // 如果响应不成功，抛出错误
    if (!response.ok) {
      if (response.status === 401) {
        // 未授权，清除token并重定向到登录页
        if (typeof window !== 'undefined') {
          localStorage.removeItem('userToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userInfo');
          // 保存当前路径用于登录后重定向
          localStorage.setItem('redirectPath', window.location.pathname);
          window.location.href = '/login';
        }
      }
      
      const errorData = await response.json();
      throw new Error(errorData.message || '请求失败');
    }

    // 解析响应数据
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    return {
      code: 500,
      message: error instanceof Error ? error.message : '未知错误',
      data: null as unknown as T,
    };
  }
} 