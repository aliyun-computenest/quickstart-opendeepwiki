'use client'

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createDataset, CreateDatasetInput } from '../../../services/fineTuningService';
import { getWarehouse } from '../../../services/warehouseService';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';

export default function CreateDatasetPage() {
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDatasetInput>({
    name: '',
    warehouseId: '',
    endpoint: 'https://api.token-ai.cn/v1',
    apiKey: '',
    model: '',
    prompt: `
# AI Training Data Engineering System for LLaMA-Factory

## SYSTEM ROLE AND OBJECTIVE
You are an Advanced AI Training Data Engineer specializing in creating premium-quality fine-tuning datasets for large language models. Your mission is to transform Markdown documentation into comprehensive, diverse instruction-response pairs for LLaMA-Factory model training.

## INPUT SPECIFICATION
<markdown_content>
{{markdown_content}}
</markdown_content>

## QUALITY STANDARDS AND METRICS
### Coverage Requirements
- Achieve 100% content coverage across all document sections
- Include every technical detail, code example, and implementation scenario
- Capture all domain-specific terminology and concepts
- Address all edge cases and special considerations

### Format Quality Metrics
- Maintain source code fidelity with exact syntax and formatting
- Preserve all original structural elements (tables, lists, hierarchies)
- Implement consistent markdown formatting throughout responses
- Ensure JSON output validates against schema specification

## INSTRUCTION DESIGN FRAMEWORK
### Cognitive Complexity Distribution
1. **Foundational (20%)**
   - Knowledge recall
   - Basic comprehension
   - Term definitions
   
2. **Practical (30%)**
   - Implementation tasks
   - Code application
   - Procedure execution
   
3. **Analytical (30%)**
   - Pattern recognition
   - Comparative analysis
   - System relationships
   
4. **Advanced (20%)**
   - Design evaluation
   - Solution synthesis
   - Architecture decisions

### Instruction Format Matrix
| Format Type | Target % | Example Structure |
|-------------|----------|-------------------|
| Direct Questions | 20% | "What is [concept]?" |
| Implementation Commands | 25% | "Implement [feature] using [method]" |
| Scenario Challenges | 25% | "Given [scenario], solve [problem]" |
| Analysis Tasks | 15% | "Compare [A] and [B] approaches" |
| Synthesis Problems | 15% | "Design a solution that integrates [components]" |

## RESPONSE QUALITY FRAMEWORK
### Technical Accuracy Requirements
- Code examples must match document exactly
- All technical specifications must be preserved
- Implementation details must remain unchanged
- Domain terminology must be consistently applied

### Structural Requirements
- Use appropriate headings (h1-h6)
- Implement code blocks with language tags
- Format tables with proper alignment
- Preserve list hierarchies and numbering

### Validation Checklist
✓ Content completely addresses instruction
✓ Technical details are accurate
✓ Formatting is properly implemented
✓ Code examples are correctly rendered
✓ Domain terminology is accurate

output format：
<data>
[
{"instruction": "Instruction text", "input": "", "output": "Response content"},
...additional pairs...
]
</data>

### Quality Control Gates
1. Verify instruction diversity across format matrix
2. Confirm cognitive complexity distribution
3. Validate technical accuracy of all content
4. Check structural integrity of responses
5. Ensure JSON schema compliance

## EXECUTION PROTOCOL
1. Analyze document structure and content map
2. Design instruction set meeting all requirements
3. Generate detailed, accurate responses
4. Validate against quality framework
5. Format output in specified JSON structure

Begin processing now. Generate exactly 30-40 instruction-response pairs implementing all quality requirements within the specified JSON structure.
`
  });
  const router = useRouter();
  const { toast } = useToast();

  // 获取仓库列表
  useEffect(() => {
    const fetchWarehouses = async () => {
      setWarehouseLoading(true);
      try {
        const response = await getWarehouse(1, 100, ''); // 获取前100个仓库
        if (response.success && response.data) {
          setWarehouses(response.data.items || []);
          // 设置默认仓库
          if (response.data.items && response.data.items.length > 0) {
            setFormData(prev => ({ ...prev, warehouseId: response.data.items[0].id }));
          }
        } else {
          toast({
            title: "错误",
            description: response.error || '获取仓库列表失败',
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('获取仓库列表失败:', error);
        toast({
          title: "错误",
          description: '获取仓库列表失败',
          variant: "destructive",
        });
      } finally {
        setWarehouseLoading(false);
      }
    };

    fetchWarehouses();
  }, [toast]);

  // 获取模型列表
  const fetchModels = async () => {
    if (!formData.endpoint || !formData.apiKey) {
      toast({
        title: "提示",
        description: '请先填写API端点和API密钥',
        variant: "default",
      });
      return;
    }

    setModelLoading(true);
    try {
      const response = await fetch(`${formData.endpoint}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${formData.apiKey}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const modelIds = data.data.map((model: any) => model.id);
        setModels(modelIds);
        
        // 如果有模型，默认选择第一个
        if (modelIds.length > 0) {
          setFormData(prev => ({ ...prev, model: modelIds[0] }));
        }
      } else {
        throw new Error('无效的模型数据格式');
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      toast({
        title: "错误",
        description: '获取模型列表失败，请检查API端点和密钥是否正确',
        variant: "destructive",
      });
    } finally {
      setModelLoading(false);
    }
  };

  // 当API端点或密钥变化时尝试获取模型
  useEffect(() => {
    if (formData.endpoint && formData.apiKey) {
      fetchModels();
    }
  }, [formData.endpoint, formData.apiKey]);

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 简单验证
    if (!formData.name || !formData.warehouseId || !formData.endpoint || !formData.apiKey || !formData.model || !formData.prompt) {
      toast({
        title: "错误",
        description: '请填写所有必填字段',
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await createDataset(formData);
      if (response.success && response.data) {
        toast({
          title: "成功",
          description: '数据集创建成功',
        });
        router.push('/admin/finetune');
      } else {
        toast({
          title: "错误",
          description: response.error || '创建数据集失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('创建数据集失败:', error);
      toast({
        title: "错误",
        description: '创建数据集失败',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 返回列表页
  const handleBack = () => {
    router.push('/admin/finetune');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-semibold">创建新数据集</h1>
      </div>

      <Card className="p-6">
        <Alert className="mb-6">
          <AlertDescription>
            微调数据集是用于训练模型的数据集合。您需要指定关联仓库、API端点和密钥等信息。
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">数据集名称 *</Label>
            <Input
              id="name"
              placeholder="输入一个描述性的名称"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse">选择仓库 *</Label>
            <Select
              value={formData.warehouseId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, warehouseId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择关联的知识库仓库" />
              </SelectTrigger>
              <SelectContent>
                {warehouseLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.organizationName}/{warehouse.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint">API端点 *</Label>
            <Input
              id="endpoint"
              placeholder="例如: https://api.token-ai.cn/v1"
              value={formData.endpoint}
              onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API密钥 *</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="输入API密钥"
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="model">选择模型 *</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={fetchModels} 
                disabled={modelLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${modelLoading ? 'animate-spin' : ''}`} />
                刷新模型列表
              </Button>
            </div>
            <Select
              value={formData.model}
              onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择用于生成数据集的模型" />
              </SelectTrigger>
              <SelectContent>
                {modelLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner size="sm" />
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center p-4 text-muted-foreground">
                    请先填写API端点和密钥并刷新
                  </div>
                ) : (
                  models.map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">
              提示词模板 * 
              <Badge variant="secondary" className="ml-2">{'{{markdown_content}}'}</Badge>
            </Label>
            <Textarea 
              id="prompt"
              rows={12}
              placeholder="输入用于微调的提示词模板"
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              className="font-mono text-sm"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Spinner size="sm" className="mr-2" />}
              创建数据集
            </Button>
            <Button type="button" variant="outline" onClick={handleBack}>
              取消
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 