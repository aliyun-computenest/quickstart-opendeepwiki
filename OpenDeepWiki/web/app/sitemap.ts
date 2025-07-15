import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // 直接转发 https://opendeep.wiki/api/sitemap.xml 的内容
    const response = await fetch('https://opendeep.wiki/api/sitemap.xml');
    
    if (!response.ok) {
      throw new Error(`获取sitemap失败: ${response.status}`);
    }
    
    const xmlContent = await response.text();
    
    // 使用正则表达式解析XML内容
    const urlRegex = /<url>([\s\S]*?)<\/url>/g;
    const locRegex = /<loc>(.*?)<\/loc>/;
    const lastmodRegex = /<lastmod>(.*?)<\/lastmod>/;
    const changefreqRegex = /<changefreq>(.*?)<\/changefreq>/;
    const priorityRegex = /<priority>(.*?)<\/priority>/;
    
    const sitemapData: MetadataRoute.Sitemap = [];
    let match;
    
    while ((match = urlRegex.exec(xmlContent)) !== null) {
      const urlContent = match[1];
      const loc = locRegex.exec(urlContent)?.[1] || '';
      const lastmod = lastmodRegex.exec(urlContent)?.[1];
      const changefreq = changefreqRegex.exec(urlContent)?.[1] as any;
      const priority = priorityRegex.exec(urlContent)?.[1];
      
      sitemapData.push({
        url: loc,
        lastModified: lastmod ? new Date(lastmod) : new Date(),
        changeFrequency: changefreq || 'weekly',
        priority: priority ? parseFloat(priority) : 0.5,
      });
    }
    
    return sitemapData;
  } catch (error) {
    console.error('转发sitemap时出错:', error);
    
    // 如果转发失败，返回一个基本的sitemap
    return [
      {
        url: process.env.NEXT_PUBLIC_BASE_URL || 'https://opendeep.wiki',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
} 