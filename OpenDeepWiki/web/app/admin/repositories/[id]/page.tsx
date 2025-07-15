'use client'
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import {
  FilePlus,
  FileEdit,
  Trash2,
  Plus,
  FileText,
  FolderPlus,
  Save,
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Database
} from 'lucide-react';
import { useTheme } from 'next-themes';

// 导入上下文菜单组件
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel
} from '@/components/ui/context-menu';

// shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import {
  getRepositoryById,
  updateRepository,
  getRepositoryFiles,
  getRepositoryFileContent,
  saveRepositoryFileContent,
  UpdateRepositoryRequest,
  addCatalog,
  renameCatalog,
  deleteCatalog,
  aiGenerateFileContent
} from '../../../services/repositoryService';

// 定义文件树节点类型
interface TreeNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  children?: TreeNode[];
  catalog?: {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    deletedTime: string;
    dependentFile: string[];
    ducumentId: string;
    isCompleted: boolean;
    isDeleted: boolean;
    order: number;
    parentId: string;
    prompt: string;
    url: string;
    warehouseId: string;
  };
}

// 自定义树形组件
interface TreeItemProps {
  node: TreeNode;
  onSelect: (node: TreeNode) => void;
  onRightClick: (node: TreeNode, event: React.MouseEvent) => void;
  selectedKey?: string;
  level?: number;
  showModal: (type: 'newMenu' | 'rename' | 'delete') => void;
  setRightClickNode: React.Dispatch<React.SetStateAction<TreeNode | null>>;
}

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  onSelect,
  onRightClick,
  selectedKey,
  level = 0,
  showModal,
  setRightClickNode
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedKey === node.key;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSelect(node);
  };

  // 处理上下文菜单点击
  const handleContextMenuClick = (type: 'newMenu' | 'rename' | 'delete') => {
    // 设置当前右键点击的节点为当前节点
    setRightClickNode(node);
    // 显示对应的模态框
    showModal(type);
  };

  return (
    <div className="select-none">
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent/50 transition-colors ${isSelected ? 'bg-accent text-accent-foreground' : ''
              }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={handleClick}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <div className="w-4" />
            )}
            <span className="text-sm truncate">{node.title}</span>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuLabel>{node.title || '菜单操作'}</ContextMenuLabel>
          <ContextMenuItem onClick={() => handleContextMenuClick('newMenu')}>
            <FolderPlus className="h-4 w-4 mr-2" /> 新建菜单
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleContextMenuClick('rename')}>
            <FileEdit className="h-4 w-4 mr-2" /> 重命名
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onClick={() => handleContextMenuClick('delete')}>
            <Trash2 className="h-4 w-4 mr-2" /> 删除
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <TreeItem
              key={child.key}
              node={child}
              onSelect={onSelect}
              onRightClick={onRightClick}
              selectedKey={selectedKey}
              level={level + 1}
              showModal={showModal}
              setRightClickNode={setRightClickNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 示例目录树结构
const defaultTreeData: TreeNode[] = [
  {
    title: '加载中...',
    key: 'loading',
    isLeaf: true,
  },
];

export default function RepositoryDetailPage() {
  const params = useParams();
  const repositoryId = params.id as string;
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();

  // 状态管理
  const [repository, setRepository] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<TreeNode[]>(defaultTreeData);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<TreeNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [rightClickNode, setRightClickNode] = useState<TreeNode | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'newMenu' | 'rename' | 'delete'>('newMenu');
  const [newFileName, setNewFileName] = useState('');
  const [editorId] = useState<string>('md-editor-rt-1');
  // 添加AI生成相关状态
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);

  const [aiGenerating, setAiGenerating] = useState(false);

  // 表单管理
  const repositoryForm = useForm({
    defaultValues: {
      description: '',
      isRecommended: false,
      prompt: '',
    }
  });

  const catalogForm = useForm({
    defaultValues: {
      name: '',
      url: '',
      description: '',
      prompt: '',
      order: 0,
    }
  });

  const promptForm = useForm({
    defaultValues: {
      prompt: '',
    }
  });

  // 使用Radix UI的Context Menu，不需要手动处理Escape键

  // 加载仓库详情
  useEffect(() => {
    const fetchRepositoryDetail = async () => {
      try {
        setLoading(true);
        const { code, data } = await getRepositoryById(repositoryId);
        if (code === 200 && data) {
          setRepository(data);
          repositoryForm.reset({
            description: data.description,
            isRecommended: data.isRecommended,
            prompt: data.prompt,
          });

          // 加载文件目录结构
          try {
            const filesResponse = await getRepositoryFiles(repositoryId);
            if (filesResponse.code === 200 && filesResponse.data) {
              setTreeData(filesResponse.data);
            } else {
              toast({
                title: "错误",
                description: filesResponse.message || '获取文件目录结构失败',
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('加载文件目录失败:', error);
            toast({
              title: "错误",
              description: '加载文件目录失败',
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "错误",
            description: '获取仓库详情失败',
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('加载仓库详情失败:', error);
        toast({
          title: "错误",
          description: '加载仓库详情失败',
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (repositoryId) {
      fetchRepositoryDetail();
    }
  }, [repositoryId, repositoryForm, toast]);

  // 处理保存仓库信息
  const handleSaveRepository = async () => {
    try {
      const values = repositoryForm.getValues();
      const updateData: UpdateRepositoryRequest = {
        description: values.description,
        isRecommended: values.isRecommended,
        prompt: values.prompt,
      };

      const response = await updateRepository(repositoryId, updateData);
      if (response.code === 200) {
        toast({
          title: "成功",
          description: '仓库信息更新成功',
        });
        // 更新本地数据
        setRepository({
          ...repository,
          ...updateData,
        });
      } else {
        toast({
          title: "错误",
          description: response.message || '更新仓库信息失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('提交表单失败:', error);
      toast({
        title: "错误",
        description: '操作失败，请重试',
        variant: "destructive",
      });
    }
  };

  // 处理文件选择
  const handleSelectFile = async (node: TreeNode) => {
    if (node.catalog) {
      setSelectedFile(node.key);
      setSelectedCatalog(node);

      try {
        // 通过API获取文件内容
        const response = await getRepositoryFileContent(node.catalog.id);
        if (response.code === 200) {
          setFileContent(response.data);
        } else {
          toast({
            title: "错误",
            description: '获取文件内容失败',
            variant: "destructive",
          });
          setFileContent('// 获取文件内容失败');
        }
      } catch (error) {
        console.error('获取文件内容失败:', error);
        toast({
          title: "错误",
          description: '获取文件内容失败',
          variant: "destructive",
        });
        setFileContent('// 获取文件内容失败');
      }
    }
  };

  // 处理右键点击
  const handleRightClick = (node: TreeNode, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setRightClickNode(node);
  };

  const handleAiGenerate = async () => {
    if (!selectedCatalog) return;

    // 设置默认prompt为选中菜单的prompt
    const defaultPrompt = selectedCatalog.catalog?.prompt || '';
    promptForm.reset({ prompt: defaultPrompt });

    // 显示AI生成对话框
    setIsAiModalVisible(true);
  }

  // 处理AI内容生成
  const handleAiContentGenerate = async () => {
    try {
      if (!selectedCatalog) {
        toast({
          title: "错误",
          description: '请先选择一个文件',
          variant: "destructive",
        });
        return;
      }

      // 获取prompt值
      const values = promptForm.getValues();
      const prompt = values.prompt;

      if (!prompt.trim()) {
        toast({
          title: "错误",
          description: '请输入提示词',
          variant: "destructive",
        });
        return;
      }

      // 设置生成中状态
      setAiGenerating(true);

      // 调用API生成内容
      await aiGenerateFileContent(selectedCatalog.catalog.id, prompt);
      toast({
        title: "成功",
        description: '生成提交成功，请等待大约5分钟，再刷新页面查看结果',
      });
      setIsAiModalVisible(false);
    } catch (error) {
      console.error('AI内容生成失败:', error);
      toast({
        title: "错误",
        description: 'AI内容生成失败，请重试',
        variant: "destructive",
      });
    } finally {
      setAiGenerating(false);
    }
  };

  // 处理保存文件内容
  const handleSaveContent = async () => {
    if (!selectedCatalog) return;

    try {
      const response = await saveRepositoryFileContent(selectedCatalog.catalog.id, fileContent);
      if (response.code === 200 && response.data) {
        toast({
          title: "成功",
          description: '文件内容保存成功',
        });
      } else {
        toast({
          title: "错误",
          description: response.message || '保存文件内容失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('保存文件内容失败:', error);
      toast({
        title: "错误",
        description: '保存文件内容失败',
        variant: "destructive",
      });
    }
  };

  // 创建新菜单
  const handleCreateMenu = async () => {
    try {
      if (!rightClickNode) {
        toast({
          title: "错误",
          description: '请选择父级菜单',
          variant: "destructive",
        });
        return;
      }

      // 获取表单值
      const formValues = catalogForm.getValues();

      // 构建目录数据
      const catalogInput = {
        name: formValues.name,
        url: formValues.url || '',
        description: formValues.description || '',
        parentId: rightClickNode.catalog?.id || rightClickNode.key, // 使用catalog.id如果存在
        order: formValues.order || 0,
        ducumentId: '',
        warehouseId: repositoryId,
        prompt: formValues.prompt || '',
        dependentFile: []
      };

      const response = await addCatalog(catalogInput);
      if (response.code === 200 && response.data) {
        toast({
          title: "成功",
          description: '菜单创建成功',
        });
        setIsModalVisible(false);

        // 重置表单
        catalogForm.reset();
        setNewFileName('');

        // 刷新文件树
        const filesResponse = await getRepositoryFiles(repositoryId);
        if (filesResponse.code === 200 && filesResponse.data) {
          setTreeData(filesResponse.data);
        }
      } else {
        toast({
          title: "错误",
          description: response.message || '创建菜单失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('创建菜单失败:', error);
      toast({
        title: "错误",
        description: '操作失败，请检查表单填写是否完整',
        variant: "destructive",
      });
    }
  };

  const handleDeleteMenu = async () => {
    if (!rightClickNode) return;

    try {
      const response = await deleteCatalog(rightClickNode.catalog.id);
      if (response.code === 200 && response.data) {
        toast({
          title: "成功",
          description: '菜单删除成功',
        });
        setIsModalVisible(false);

        // 刷新文件树
        const filesResponse = await getRepositoryFiles(repositoryId);
        if (filesResponse.code === 200 && filesResponse.data) {
          setTreeData(filesResponse.data);
        }
      } else {
        toast({
          title: "错误",
          description: response.message || '删除菜单失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('删除菜单失败:', error);
      toast({
        title: "错误",
        description: '删除菜单失败',
        variant: "destructive",
      });
    }
  }

  // 重命名菜单
  const handleRenameMenu = async () => {
    if (!rightClickNode || !newFileName) return;

    try {
      const response = await renameCatalog(rightClickNode.catalog.id, newFileName);
      if (response.code === 200 && response.data) {
        toast({
          title: "成功",
          description: '菜单重命名成功',
        });
        setIsModalVisible(false);
        setNewFileName('');

        // 刷新文件树
        const filesResponse = await getRepositoryFiles(repositoryId);
        if (filesResponse.code === 200 && filesResponse.data) {
          setTreeData(filesResponse.data);
        }
      } else {
        toast({
          title: "错误",
          description: response.message || '重命名菜单失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('重命名菜单失败:', error);
      toast({
        title: "错误",
        description: '重命名菜单失败',
        variant: "destructive",
      });
    }
  };

  // 显示模态框
  const showModal = (type: 'newMenu' | 'rename' | 'delete') => {
    setModalType(type);

    // 如果是新建菜单，重置表单
    if (type === 'newMenu') {
      catalogForm.reset();
    } else if (type === 'rename') {
      setNewFileName('');
    }

    setIsModalVisible(true);
  };

  // 处理模态框确认
  const handleModalOk = async () => {
    switch (modalType) {
      case 'newMenu':
        await handleCreateMenu();
        break;
      case 'rename':
        await handleRenameMenu();
        break;
      case 'delete':
        await handleDeleteMenu();
        break;
    }
  };

  // 渲染模态框标题
  const renderModalTitle = () => {
    switch (modalType) {
      case 'newMenu':
        return '新建菜单';
      case 'rename':
        return '重命名';
      case 'delete':
        return '确认删除';
    }
  };

  // 渲染模态框内容
  const renderModalContent = () => {
    switch (modalType) {
      case 'newMenu':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">菜单名称 *</Label>
              <Input
                id="name"
                placeholder="请输入菜单名称"
                value={catalogForm.watch('name')}
                onChange={(e) => catalogForm.setValue('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="请输入菜单URL"
                value={catalogForm.watch('url')}
                onChange={(e) => catalogForm.setValue('url', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="请输入菜单描述"
                rows={2}
                value={catalogForm.watch('description')}
                onChange={(e) => catalogForm.setValue('description', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt">提示词</Label>
              <Textarea
                id="prompt"
                placeholder="请输入菜单提示词"
                rows={2}
                value={catalogForm.watch('prompt')}
                onChange={(e) => catalogForm.setValue('prompt', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">排序</Label>
              <Input
                id="order"
                type="number"
                placeholder="请输入排序值"
                value={catalogForm.watch('order')}
                onChange={(e) => catalogForm.setValue('order', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        );
      case 'rename':
        return (
          <div className="space-y-2">
            <Label htmlFor="newName">新名称 *</Label>
            <Input
              id="newName"
              placeholder="请输入新名称"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
          </div>
        );
      case 'delete':
        return (
          <p className="text-sm text-muted-foreground">
            确定要删除 "{rightClickNode?.title}" 吗？此操作不可撤销。
          </p>
        );
    }
  };



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Skeleton className="w-32 h-32 mx-auto mb-4" />
        <div className="text-muted-foreground">加载仓库详情中...</div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">

      <div className="flex gap-4 h-[calc(100vh-100px)]">
        {/* 左侧文件目录 */}
        <Card className="w-80 h-full overflow-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Folder className="h-4 w-4" />
              文件目录
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {treeData.map((node) => (
                <TreeItem
                  key={node.key}
                  node={node}
                  onSelect={handleSelectFile}
                  onRightClick={handleRightClick}
                  selectedKey={selectedFile || undefined}
                  showModal={showModal}
                  setRightClickNode={setRightClickNode}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 h-full overflow-auto">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedFile || '选择文件查看内容'}
              </CardTitle>
              {selectedFile && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleAiGenerate}
                    disabled={aiGenerating}
                    size="sm"
                  >
                    AI 智能生成
                  </Button>
                  <Button
                    onClick={handleSaveContent}
                    disabled={aiGenerating}
                    size="sm"
                    variant="outline"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    保存
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 h-[calc(100%-80px)]">
            {selectedFile ? (
              <MdEditor
                value={fileContent}
                onChange={setFileContent}
                style={{ height: '100%' }}
                id={editorId}
                previewTheme="vuepress"
                preview={false}
                toolbarsExclude={['image']}
                disabled={aiGenerating}
                theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                从左侧选择文件查看内容
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用Radix UI的ContextMenu组件替代自定义右键菜单 */}

      <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
        <DialogContent className={modalType === 'newMenu' ? 'max-w-lg' : 'max-w-md'}>
          <DialogHeader>
            <DialogTitle>{renderModalTitle()}</DialogTitle>
          </DialogHeader>
          {renderModalContent()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalVisible(false)}>
              取消
            </Button>
            <Button
              onClick={handleModalOk}
              variant={modalType === 'delete' ? 'destructive' : 'default'}
            >
              {modalType === 'delete' ? '确认删除' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI生成对话框 */}
      <Dialog open={isAiModalVisible} onOpenChange={(open) => !aiGenerating && setIsAiModalVisible(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI 智能生成内容</DialogTitle>
            <DialogDescription>
              请输入详细的提示词，以便AI生成更准确的内容
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aiPrompt">提示词 *</Label>
              <Textarea
                id="aiPrompt"
                rows={6}
                placeholder="请输入提示词，描述你希望生成的内容"
                value={promptForm.watch('prompt')}
                onChange={(e) => {
                  promptForm.setValue('prompt', e.target.value);
                }}
                disabled={aiGenerating}
              />
            </div>
            {aiGenerating && (
              <div className="text-center space-y-2">
                <Skeleton className="w-32 h-8 mx-auto" />
                <div className="text-sm text-muted-foreground">AI 内容生成中，请稍候...</div>
                <p className="text-xs text-blue-600">
                  正在根据提示词生成内容，这可能需要一些时间...
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAiModalVisible(false)}
              disabled={aiGenerating}
            >
              取消
            </Button>
            <Button
              onClick={handleAiContentGenerate}
              disabled={aiGenerating}
            >
              {aiGenerating ? '生成中...' : '生成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 