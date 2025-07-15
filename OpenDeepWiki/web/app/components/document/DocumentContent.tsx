'use client'

import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Markdown, Mermaid } from '@lobehub/ui';
import RenderThinking from './Component';
import { normalizeThinkTags,extractThinkContent } from './thinking/remarkPlugin';

interface DocumentContentProps {
  document: any;
  owner: string;
  name: string;
  think?: string;
  token: any;
}

const DocumentContent: React.FC<DocumentContentProps> = ({
  document,
  owner,
  name,
  token,
  think
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const codeBlocks = contentRef.current?.querySelectorAll('pre code');
    codeBlocks?.forEach((block) => {
      block.parentElement?.classList.add('code-block-wrapper');
    });
  }, [document?.content]);
  return (
    <div ref={contentRef} style={{
      background: token.colorBgContainer,
      padding: '24px 32px',
      borderRadius: '0px',
      color: token.colorText
    }}>
      {think && (
        <RenderThinking think={think}>
        </RenderThinking>
      )}
      <div className="markdown-content">
        <Markdown
          variant='chat'
          enableCustomFootnotes={true}
          enableMermaid
          fullFeaturedCodeBlock={true}
        >
          {document?.content}
        </Markdown>
      </div>

      <style jsx global>{`
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          color: ${token.colorTextHeading};
          font-weight: 600;
          line-height: 1.4;
        }
        
        .markdown-content h1 {
          font-size: 28px;
          margin-top: 0;
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .markdown-content h2 {
          font-size: 24px;
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .markdown-content h3 {
          font-size: 20px;
        }
        
        .markdown-content a {
          color: ${token.colorPrimary};
          text-decoration: none;
          transition: color 0.3s;
        }
        
        .markdown-content a:hover {
          color: ${token.colorPrimaryHover};
          text-decoration: underline;
        }
        
        .markdown-content blockquote {
          border-left: 4px solid ${token.colorPrimaryBorder};
          padding: 12px 16px;
          margin: 16px 0;
          background: rgba(0,0,0,0.03);
          border-radius: 0px;
        }
        
        .markdown-content blockquote p {
          margin-bottom: 0;
        }
        
        .markdown-content ul,
        .markdown-content ol {
          padding-left: 24px;
          margin-bottom: 16px;
        }
        
        .markdown-content li {
          margin-bottom: 8px;
          font-size: 16px;
        }
        
        .markdown-content li p {
          margin-bottom: 8px;
        }
        
        .markdown-content img {
          max-width: 100%;
          height: auto;
          margin: 16px 0;
        }
        
        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          overflow-x: auto;
          display: block;
        }
        
        .markdown-content table th,
        .markdown-content table td {
          padding: 8px 16px;
          border: 1px solid ${token.colorBorderSecondary};
          text-align: left;
        }
        
        .markdown-content table th {
          background-color: ${token.colorFillSecondary};
          font-weight: 600;
        }
        
        .markdown-content table tr:nth-child(even) {
          background-color: ${token.colorFillQuaternary};
        }
        
        .markdown-content pre {
          background: rgba(0,0,0,0.03);
          border-radius: 0px;
          overflow-x: auto;
        }
        
        .markdown-content code {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
          background: rgba(0,0,0,0.03);
          padding: 2px 4px;
          border-radius: 2px;
          font-size: 14px !important;
        }
        
        .markdown-content pre > code {
          background: transparent;
          padding: 0;
          border: none;
          font-size: 14px !important;
        }

        /* 列表样式匹配图片效果 */
        .markdown-content ul {
          list-style-type: disc;
        }
        
        /* 符合图片样式，增加段落间距 */
        .markdown-content h2 + p,
        .markdown-content h3 + p {
          margin-top: 16px;
        }

        /* AntThinking 内容样式 */
        .ant-thinking-content {
          white-space: pre-wrap;
          font-size: 14px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

export default DocumentContent; 