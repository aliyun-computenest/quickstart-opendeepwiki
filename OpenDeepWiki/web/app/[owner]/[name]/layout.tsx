import { Metadata, } from 'next';
import RepositoryLayoutServer from './layout.server';
import { NextProvider } from 'fumadocs-core/framework/next';

type Props = {
  params: Promise<{ owner: string; name: string; branch: string }>
  children: React.ReactNode
}

// 为页面生成动态元数据
export async function generateMetadata(
  { params }: any
): Promise<Metadata> {
  const { owner, name } = await params;

  // 优化SEO的元数据
  return {
    title: `${name} - ${owner} 的文档仓库 | OpenDeekWiki`,
    description: `浏览 ${owner}/${name} 的文档内容，查看技术文档、API文档和其他相关资源。`,
    keywords: [`${name}`, `${owner}`, '文档', '知识库', 'OpenDeekWiki', '技术文档'],
    openGraph: {
      title: `${name} - ${owner} 的文档仓库`,
      description: `浏览 ${owner}/${name} 的文档内容，查看技术文档、API文档和其他相关资源。`,
      url: `/${owner}/${name}`,
      siteName: 'OpenDeekWiki',
      locale: 'zh_CN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} - ${owner} 的文档仓库 | OpenDeekWiki`,
      description: `浏览 ${owner}/${name} 的文档内容，查看技术文档、API文档和其他相关资源。`,
    },
    alternates: {
      canonical: `/${owner}/${name}`,
    },
    robots: {
      index: true,
      follow: true,
    }
  }
}

export default async function RepositoryLayout({
  params,
  children,
}: any) {
  const { owner, name, branch } = await params;
  
  return (
    <NextProvider>
      <RepositoryLayoutServer
        owner={owner}
        name={name}
        branch={branch}
      >
        {children}
      </RepositoryLayoutServer>
    </NextProvider>
  );
} 