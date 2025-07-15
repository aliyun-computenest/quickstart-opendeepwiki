'use client';

import { useEffect } from 'react';
import { generateSlug, ensureUniqueSlug } from '@/app/utils/slug';

export default function HeadingAnchors() {
  useEffect(() => {
    function initHeadingAnchors() {
      console.log('Initializing heading anchors...');
      
      // 查找包含markdown内容的元素，尝试多种可能的选择器
      const markdownBody = document.getElementById('markdown-body') || 
                          document.querySelector('.markdown-body') ||
                          document.querySelector('[data-content]') ||
                          document.querySelector('main') ||
                          document.querySelector('article');
      
      if (!markdownBody) {
        console.log('No markdown body found');
        return;
      }
      
      // 查找所有h1-h6标签
      const headings = markdownBody.querySelectorAll('h1, h2, h3, h4, h5, h6');
      console.log('Found headings:', headings.length);
      
      const existingSlugs = new Set<string>();
      
      headings.forEach(function(heading) {
        const text = heading.textContent || (heading as HTMLElement).innerText;
        if (!text.trim()) return;
        
        // 使用统一的slug生成逻辑
        const baseSlug = generateSlug(text);
        const slug = ensureUniqueSlug(baseSlug, existingSlugs);
        
        // 设置标题的ID
        heading.id = slug;
        heading.setAttribute('class', 'flex scroll-m-28 flex-row items-center gap-2');
        
        // 创建锚点链接
        const anchor = document.createElement('a');
        anchor.href = '#' + slug;
        anchor.textContent = text;
        anchor.style.textDecoration = 'none';
        anchor.style.color = 'inherit';
        anchor.setAttribute('data-card','');
        anchor.className = "peer";

        // 添加悬停效果
        anchor.addEventListener('mouseenter', function() {
          this.style.textDecoration = 'underline';
        });
        
        anchor.addEventListener('mouseleave', function() {
          this.style.textDecoration = 'none';
        });
        
        // 清空标题内容并添加锚点链接
        heading.innerHTML = '';
        heading.appendChild(anchor);
      });
    }
    
    // 延迟执行以确保DOM完全加载
    const timer = setTimeout(initHeadingAnchors, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return null;
}
