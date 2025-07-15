'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useTranslation } from '@/app/i18n/client';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ExportMarkdownZip } from '../services';

interface ExportMarkdownButtonProps {
  warehouseId: string;
  className?: string;
}

export default function ExportMarkdownButton({ 
  warehouseId,
  className 
}: ExportMarkdownButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    setIsDialogOpen(false);
    
    try {
      // 显示下载中的提示
      toast({
        title: t('repository_layout.sidebar.export.downloading', '正在下载...'),
        description: t('repository_layout.sidebar.export.modal_content', '正在导出文档为Markdown格式'),
      });

      // 调用导出API
      const response = await ExportMarkdownZip(warehouseId) as any;
      if (!response.success) {
        throw new Error(response.message);
      }

      
      // 创建下载链接
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${warehouseId}.zip`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // 显示成功提示
      toast({
        title: t('repository_layout.sidebar.export.success_message', '文档导出成功！'),
        description: `文档已成功导出`,
      });

    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: t('repository_layout.sidebar.export.failed_message', '导出失败，请稍后再试。'),
        description: '请检查网络连接或稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={className}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {t('repository_layout.sidebar.export.button', '导出Markdown')}
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('repository_layout.sidebar.export.modal_title', '导出Markdown')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('repository_layout.sidebar.export.modal_content', '是否将当前文档导出为Markdown格式？')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t('repository_layout.sidebar.export.cancel_text', '取消')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExport}>
            {t('repository_layout.sidebar.export.ok_text', '导出')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
