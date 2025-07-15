(function() {
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeadingAnchors);
  } else {
    initHeadingAnchors();
  }
  
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
    
    headings.forEach(function(heading) {
      const text = heading.textContent || heading.innerText;
      if (!text.trim()) return;
      
      // 生成ID（将文本转换为适合作为ID的格式）
      const id = text.trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-') // 保留中文字符
        .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
      
      // 设置标题的ID
      heading.id = id;
      
      // 创建锚点链接
      const anchor = document.createElement('a');
      anchor.href = '#' + id;
      anchor.textContent = text;
      anchor.style.textDecoration = 'none';
      anchor.style.color = 'inherit';
      
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
})();
