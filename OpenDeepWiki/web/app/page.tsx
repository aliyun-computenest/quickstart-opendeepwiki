'use server'

import { getWarehouse } from './services/warehouseService';
import { getBasicHomeStats } from './services/statsService';
import HomeClient from './components/HomeClient';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // 确保 searchParams 已经被解析
  const resolvedSearchParams = searchParams ? await searchParams : {};

  // 从 URL 参数中获取分页信息
  const page = Number(resolvedSearchParams?.page) || 1;
  const pageSize = Number(resolvedSearchParams?.pageSize) || 20;
  const keyword = (resolvedSearchParams?.keyword as string) || '';

  // 并行获取初始数据和统计数据
  const [response, statsData] = await Promise.all([
    getWarehouse(page, pageSize, keyword),
    getBasicHomeStats()
  ]);

  const initialRepositories = response.success ? response.data.items : [];
  const initialTotal = response.success ? response.data.total : 0;

  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '20%' }}><Skeleton className="w-32 h-32 mx-auto" /></div>}>
      <HomeClient
        initialRepositories={initialRepositories}
        initialTotal={initialTotal}
        initialPage={page}
        initialPageSize={pageSize}
        initialSearchValue={keyword}
        initialStats={statsData}
      />  
    </Suspense>
  );
}