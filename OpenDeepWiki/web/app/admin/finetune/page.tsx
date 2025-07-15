'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Plus,
  Trash2,
  Eye,
  Download,
  Upload,
  Settings,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

import { TrainingDataset, getDatasets, deleteDataset } from '../../services/fineTuningService';

export default function FinetunePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState<TrainingDataset[]>([]);
  const router = useRouter();

  // 加载数据集列表，这里需要一个warehouseId，暂时使用默认值
  // 实际使用时应该从URL参数或状态管理中获取
  const fetchDatasets = async (warehouseId = '') => {
    setLoading(true);
    try {
      const { data } = await getDatasets(warehouseId);
      if (data.code === 200) {
        setDatasets(data.data);
      }
    } catch (error) {
      console.error('获取数据集失败:', error);
      toast({
        title: "错误",
        description: "获取数据集列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  // 删除数据集
  const handleDelete = async (id: string) => {
    try {
      const response = await deleteDataset(id);
      if (response.success) {
        toast({
          title: "成功",
          description: "数据集删除成功",
        });
        fetchDatasets(); // 重新加载数据
      } else {
        toast({
          title: "错误",
          description: response.error || "删除数据集失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('删除数据集失败:', error);
      toast({
        title: "错误",
        description: "删除数据集失败",
        variant: "destructive",
      });
    }
  };

  // 创建新数据集
  const handleCreate = () => {
    router.push('/admin/finetune/create');
  };

  // 渲染状态标签
  const renderStatus = (status: number) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let text = '准备就绪';

    switch (status) {
      case 0:
        variant = 'secondary';
        text = '未开始';
        break;
      case 1:
        variant = 'default';
        text = '进行中';
        break;
      case 2:
        variant = 'outline';
        text = '已完成';
        break;
      case 3:
        variant = 'destructive';
        text = '失败';
        break;
      default:
        variant = 'secondary';
        text = status.toString();
    }

    return <Badge variant={variant}>{text}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <Brain className="h-6 w-6" />
            模型微调
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            管理训练数据集和模型微调任务
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          创建数据集
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>训练数据集</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>数据集名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>文件数量</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>最后更新</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell>
                    <button
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => router.push(`/admin/finetune/dataset/${dataset.id}`)}
                    >
                      {dataset.name}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {dataset.description}
                  </TableCell>
                  <TableCell>
                    {renderStatus(dataset.status)}
                  </TableCell>
                  <TableCell>{dataset.fileCount}</TableCell>
                  <TableCell>
                    {new Date(dataset.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    {dataset.updatedAt ? new Date(dataset.updatedAt).toLocaleDateString('zh-CN') : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/finetune/dataset/${dataset.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          下载数据集
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除数据集"{dataset.name}"吗？此操作无法撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(dataset.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {datasets.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              暂无数据集，点击上方按钮创建新的训练数据集
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
