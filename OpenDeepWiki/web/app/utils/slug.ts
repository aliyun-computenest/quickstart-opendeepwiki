// 生成适合作为HTML ID和URL片段的slug
export function generateSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-') // 保留中文字符，其他字符替换为连字符
    .replace(/^-+|-+$/g, '') // 移除开头和结尾的连字符
    .replace(/-+/g, '-'); // 合并多个连续的连字符
}

// 确保slug的唯一性
export function ensureUniqueSlug(slug: string, existingSlugs: Set<string>): string {
  let uniqueSlug = slug;
  let counter = 1;
  
  while (existingSlugs.has(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  existingSlugs.add(uniqueSlug);
  return uniqueSlug;
}
