import type { KoalaChatWidgetConfig } from "./types";

/**
 * 获取API URL的辅助函数
 */
export function getApiUrl(config: KoalaChatWidgetConfig): string {
  // 如果配置中有apiUrl，直接使用
  if (config.apiUrl) {
    return config.apiUrl;
  }

  // 尝试从脚本标签获取源域名
  const scriptElement = document.querySelector(
    'script[src*="koala-chat-widget.js"]'
  );
  if (scriptElement) {
    const scriptSrc = scriptElement.getAttribute("src");
    if (scriptSrc) {
      try {
        const url = new URL(scriptSrc, window.location.href);
        return url.origin;
      } catch (e) {
        console.warn("Unable to parse script source URL:", scriptSrc);
      }
    }
  }

  // 兜底使用当前页面域名
  return window.location.origin;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 清理定时器
 */
export function clearTimer(timer: NodeJS.Timeout | null): null {
  if (timer) {
    clearTimeout(timer);
  }
  return null;
}
