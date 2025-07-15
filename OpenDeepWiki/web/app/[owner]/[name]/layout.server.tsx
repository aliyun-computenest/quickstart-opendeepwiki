import Link from 'next/link';
import { documentCatalog } from '../../services/warehouseService';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { Flexbox } from 'react-layout-kit';
import { Button } from '@/components/ui/button';
import MCPModal from './MCPModal';
import ExportMarkdownButton from '@/app/components/ExportMarkdownButton';
import TimeDisplay from '@/app/components/TimeDisplay';

export async function getRepositoryData(owner: string, name: string, branch?: string) {
  try {
    const { data } = await documentCatalog(owner, name, branch);
    return {
      catalogData: data || null,
      lastUpdated: data?.lastUpdate ?? ""
    };
  } catch (error) {
    console.error('Failed to fetch document catalog:', error);
    return {
      catalogData: null,
      lastUpdated: ''
    };
  }
}

export default async function RepositoryLayoutServer({
  owner,
  name,
  children,
  branch
}: any) {

  const { catalogData, lastUpdated } = await getRepositoryData(owner, name, branch);

  const processTreeItems = (items: any[]): any[] => {
    return items.map((item: any) => ({
      name: <Link href={`/${owner}/${name}/${item.url}`}>{item.label}</Link>,
      url: `/${owner}/${name}/${item.url}`,
      defaultOpen: true,
      type: (item.children && item.children.length > 0) ? 'folder' : 'file',
      children: item.children && item.children.length > 0 ? processTreeItems(item.children) : undefined
    }));
  };


  const tree = [
    {
      name: '概述',
      url: `/${owner}/${name}`,
      defaultOpen: true,
      type: 'file',
    },
    {
      name: '思维导图',
      url: `/${owner}/${name}/mindmap`,
      defaultOpen: false,
      type: 'file',
    },
    {
      type: 'separator',
    },
    ...processTreeItems(catalogData?.items ?? [])
  ];

  return (<DocsLayout

    nav={{
      title: `${owner}/${name}`,
    }}
    searchToggle={{
      enabled: true,
    }}
    githubUrl={catalogData?.git}
    links={[
      {
        type: 'custom',
        secondary: true,
        children: <Flexbox
          gap={8}
          >
          <div className="text-center">
            <TimeDisplay
              dateString={lastUpdated}
              className="text-sm text-gray-500"
              showPrefix={true}
            />
          </div>
          <Flexbox
            align={'center'}
            gap={8}
            horizontal
          >
            <ExportMarkdownButton warehouseId={catalogData.warehouseId} />
            <MCPModal owner={owner} name={name} />
          </Flexbox>
        </Flexbox>
      }
    ]}
    tree={
      {
        name: 'docs',
        children: tree,
      }
    }
  >
    {children}
  </DocsLayout>
  );
} 