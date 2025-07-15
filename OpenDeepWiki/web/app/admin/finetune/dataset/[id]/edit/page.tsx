'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getDataset, updateDataset, TrainingDataset, UpdateDatasetInput } from '../../../../../services/fineTuningService';

export default function EditDatasetPage({ params }: any) {
  const [loading, setLoading] = useState(false);
  const [dataset, setDataset] = useState<TrainingDataset | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    endpoint: '',
    apiKey: '',
    prompt: ''
  });
  const router = useRouter();

  // 加载数据集详情
  useEffect(() => {
    const fetchDataset = async () => {
      setFetchLoading(true);
      try {
        const response = await getDataset(params.id);
        if (response.success && response.data) {
          setDataset(response.data);
          // 设置表单初始值，使用any类型避免TS错误
          const datasetWithExtras = response.data as any;
          setFormData({
            name: response.data.name,
            endpoint: datasetWithExtras.endpoint || '',
            apiKey: datasetWithExtras.apiKey || '',
            prompt: datasetWithExtras.prompt || '',
          });
        } else {
          toast({
            title: "获取失败",
            description: response.error || '获取数据集详情失败',
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('获取数据集详情失败:', error);
        toast({
          title: "获取失败",
          description: '获取数据集详情失败',
          variant: "destructive",
        });
      } finally {
        setFetchLoading(false);
      }
    };

    fetchDataset();
  }, [params.id]);

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataset) return;

    const updateData: UpdateDatasetInput = {
      datasetId: params.id,
      name: formData.name,
      endpoint: formData.endpoint,
      apiKey: formData.apiKey,
      prompt: formData.prompt
    };

    setLoading(true);
    try {
      const response = await updateDataset(updateData);
      if (response.success && response.data) {
        toast({
          title: "更新成功",
          description: '数据集更新成功',
        });
        router.push(`/admin/finetune/dataset/${params.id}`);
      } else {
        toast({
          title: "更新失败",
          description: response.error || '更新数据集失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('更新数据集失败:', error);
      toast({
        title: "更新失败",
        description: '更新数据集失败',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理表单输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 返回详情页
  const handleBack = () => {
    router.push(`/admin/finetune/dataset/${params.id}`);
  };

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Skeleton className="w-32 h-32 rounded-lg" />
        <div className="text-muted-foreground">加载数据集信息...</div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/finetune')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center text-center p-12 space-y-4">
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">数据未找到</div>
                <div className="text-sm mt-1">未找到要编辑的数据集或数据集已删除</div>
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/admin/finetune')}>
              返回列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <h1 className="text-xl font-semibold">编辑数据集: {dataset.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">编辑微调数据集</div>
              <div className="text-sm mt-1">您可以修改数据集的名称、API端点、密钥和提示词模板。</div>
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">数据集名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="输入一个描述性的名称"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">API端点 *</Label>
              <Input
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) => handleInputChange('endpoint', e.target.value)}
                placeholder="例如: https://api.openai.com/v1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API密钥 *</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder="输入API密钥"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">提示词模板 *</Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                placeholder="输入用于微调的提示词模板"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouseId">仓库ID</Label>
              <Input
                id="warehouseId"
                value={dataset.warehouseId}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : '保存修改'}
              </Button>
              <Button type="button" variant="outline" onClick={handleBack}>
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}