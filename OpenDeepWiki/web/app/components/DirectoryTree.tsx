import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Folder, File, Edit, Settings } from 'lucide-react';
import { useState } from 'react';
import { UpdateCatalogRequest, updateCatalog } from '../services/documentService';

// 定义树节点类型
interface ExtendedDataNode {
  key: string;
  title: string;
  children?: ExtendedDataNode[];
  prompt?: string;
  label?: string;
  icon?: React.ReactNode;
}

interface DirectoryTreeProps {
  treeData: ExtendedDataNode[];
  repositoryId?: string;
  owner?: string;
  name?: string;
  currentPath?: string;
  onRefresh?: () => void;
}

const DocDirectoryTree: React.FC<DirectoryTreeProps> = ({
  treeData,
  repositoryId,
  owner,
  name,
  currentPath,
  onRefresh
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentNode, setCurrentNode] = useState<ExtendedDataNode | null>(null);
  const [formData, setFormData] = useState({ name: '', prompt: '' });



  // 递归处理树节点，添加图标
  const processTreeData = (data: ExtendedDataNode[]): ExtendedDataNode[] => {
    return data.map(node => {
      const newNode = { ...node };

      if (newNode.children) {
        newNode.icon = <Folder className="h-4 w-4" />;
        newNode.children = processTreeData(newNode.children as ExtendedDataNode[]);
      } else {
        newNode.icon = <File className="h-4 w-4" />;
      }

      return newNode;
    });
  };

  // 处理右键菜单点击
  const handleMenuClick = (node: ExtendedDataNode) => {
    setCurrentNode(node);
    setFormData({
      name: node.title || node.label || '',
      prompt: node.prompt || ''
    });
    setIsEditModalVisible(true);
  };

  // 提交编辑表单
  const handleEditSubmit = async () => {
    try {
      if (!currentNode) return;

      const updateRequest: UpdateCatalogRequest = {
        id: currentNode.key as string,
        name: formData.name,
        prompt: formData.prompt
      };

      const response = await updateCatalog(updateRequest);
      if (response.code === 200) {
        toast({ description: '目录更新成功' });
        setIsEditModalVisible(false);
        // 刷新目录树
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast({ description: response.message || '更新目录失败', variant: 'destructive' });
      }
    } catch (error) {
      console.error('提交表单失败:', error);
      toast({ description: '操作失败，请重试', variant: 'destructive' });
    }
  };

  const processedTreeData = processTreeData(treeData);

  // 渲染树节点
  const renderTreeNode = (node: ExtendedDataNode, level: number = 0) => {
    const isSelected = currentPath === node.key;

    return (
      <div key={node.key} className={`ml-${level * 4}`}>
        <div
          className={`flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer ${
            isSelected ? 'bg-accent' : ''
          }`}
          onClick={() => handleSelect(node)}
        >
          <div className="flex items-center space-x-2">
            {node.icon}
            <span className="text-sm">{node.title}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Edit className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleMenuClick(node)}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {node.children && (
          <div className="ml-4">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleSelect = (node: ExtendedDataNode) => {
    if (!node.children) {
      const path = node.key;

      // 根据提供的参数决定使用哪种路由格式
      if (owner && name) {
        router.push(`/${owner}/${name}/${path}`);
      } else if (repositoryId) {
        router.push(`/repository/${repositoryId}/${path}`);
      }
    }
  };

  return (
    <>
      <Card className="directory-tree-card">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Folder className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">文档目录</h3>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-3" />
          <div className="space-y-1">
            {processedTreeData.map(node => renderTreeNode(node))}
          </div>
        </CardContent>
      </Card>
      
      {/* 编辑目录对话框 */}
      <Dialog open={isEditModalVisible} onOpenChange={setIsEditModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑目录</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">标题</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入标题"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">提示词</label>
              <Textarea
                value={formData.prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="自定义AI生成内容的提示词"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">自定义AI生成内容的提示词</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalVisible(false)}>
              取消
            </Button>
            <Button onClick={handleEditSubmit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocDirectoryTree; 