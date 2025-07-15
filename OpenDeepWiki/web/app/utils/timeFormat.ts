/**
 * 时间格式化工具函数
 */

/**
 * 格式化相对时间显示
 * @param dateString - 日期字符串
 * @param locale - 语言环境，默认为 'zh-CN'
 * @returns 格式化后的时间字符串
 */
export function formatRelativeTime(dateString: string, locale: string = 'zh-CN'): string {
  if (!dateString) {
    return locale === 'zh-CN' ? '未知' : 'Unknown';
  }

  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);

  // 如果是当天更新，显示小时
  if (diffInDays === 0) {
    if (diffInHours <= 0) {
      return locale === 'zh-CN' ? '刚刚更新' : 'Just updated';
    } else if (diffInHours === 1) {
      return locale === 'zh-CN' ? '1小时前' : '1 hour ago';
    } else {
      return locale === 'zh-CN' ? `${diffInHours}小时前` : `${diffInHours} hours ago`;
    }
  }

  // 如果是一周内，显示天数
  if (diffInWeeks === 0) {
    if (diffInDays === 1) {
      return locale === 'zh-CN' ? '1天前' : '1 day ago';
    } else {
      return locale === 'zh-CN' ? `${diffInDays}天前` : `${diffInDays} days ago`;
    }
  }

  // 超过一周，显示具体日期
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return date.toLocaleDateString(locale, options);
}

/**
 * 格式化标准日期显示
 * @param dateString - 日期字符串
 * @param locale - 语言环境，默认为 'zh-CN'
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string, locale: string = 'zh-CN'): string {
  if (!dateString) {
    return locale === 'zh-CN' ? '未知' : 'Unknown';
  }

  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  return date.toLocaleDateString(locale, options);
}

/**
 * 格式化时间戳为可读时间
 * @param timestamp - 时间戳
 * @param locale - 语言环境，默认为 'zh-CN'
 * @returns 格式化后的时间字符串
 */
export function formatTimestamp(timestamp: number, locale: string = 'zh-CN'): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * 格式化完整日期时间
 * @param dateString - 日期字符串
 * @param locale - 语言环境，默认为 'zh-CN'
 * @returns 格式化后的完整日期时间字符串
 */
export function formatDateTime(dateString: string, locale: string = 'zh-CN'): string {
  if (!dateString) {
    return locale === 'zh-CN' ? '未知' : 'Unknown';
  }

  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString(locale, options);
}
