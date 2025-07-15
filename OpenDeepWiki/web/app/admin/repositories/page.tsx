'use client'
import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  MoreHorizontal,
  Folder,
  Clock,
  User,
  RotateCcw,
  GitBranch
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { getRepositoryList, createGitRepository, updateRepository, deleteRepository, resetRepository, RepositoryInfo, CreateGitRepositoryRequest, UpdateRepositoryRequest } from '../../services/repositoryService';
import Link from 'next/link';

// 仓库状态映射
const getStatusBadgeVariant = (status: number) => {
  // 根据状态返回不同颜色
  switch (status) {
    case 0: return '#CBD5E0'; // 待处理 - 灰色
    case 1: return '#63B3ED'; // 处理中 - 蓝色
    case 2: return '#68D391'; // 已完成 - 绿色
    case 3: return '#A0AEC0'; // 已取消 - 深灰色
    case 4: return '#F6AD55'; // 未授权 - 橙色
    case 99: return '#FC8181'; // 已失败 - 红色
    default: return '#CBD5E0'; // 默认灰色
  }
};

const getStatusText = (status: number) => {
  const statusMap = {
    0: '待处理',
    1: '处理中',
    2: '已完成',
    3: '已取消',
    4: '未授权',
    99: '已失败'
  };
  return statusMap[status as keyof typeof statusMap] || '未知';
};

export default function RepositoriesPage() {
  const { toast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [repositories, setRepositories] = useState<RepositoryInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRepository, setCurrentRepository] = useState<RepositoryInfo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    isPrivate: false,
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });

  // 加载仓库数据
  const loadRepositories = async (page = currentPage, size = pageSize, keyword = searchText) => {
    try {
      setLoading(true);
      const { code, data } = await getRepositoryList(page, size, keyword);
      if (code === 200) {
        setRepositories(data.items);
        setTotal(data.total);
      } else {
        toast({
          title: "错误",
          description: "获取仓库列表失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('加载仓库数据失败:', error);
      toast({
        title: "错误",
        description: "加载仓库数据失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadRepositories();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1); // 重置到第一页
    loadRepositories(1, pageSize, searchText);
  };

  // 处理仓库操作（编辑、删除等）
  const handleRepositoryAction = async (action: string, repository: RepositoryInfo) => {
    if (action === 'edit') {
      setCurrentRepository(repository);
      setEditFormData({
        name: repository.name,
        description: repository.description || '',
        isPrivate: repository.isPrivate || false,
      });
      setIsEditModalOpen(true);
    } else if (action === 'delete') {
      try {
        const response = await deleteRepository(repository.id);
        if (response.code === 200 && response.data) {
          toast({
            title: "成功",
            description: "仓库删除成功",
          });
          loadRepositories(); // 重新加载仓库列表
        } else {
          toast({
            title: "错误",
            description: response.message || "删除仓库失败",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('删除仓库失败:', error);
        toast({
          title: "错误",
          description: "删除仓库失败",
          variant: "destructive",
        });
      }
    } else if (action === 'reprocess') {
      if (confirm(`确定要重新处理仓库 ${repository.organizationName}/${repository.name} 吗？`)) {
        try {
          const response = await resetRepository(repository.id);
          if (response.code === 200 && response.data) {
            toast({
              title: "成功",
              description: "已提交重新处理请求",
            });
            loadRepositories(); // 重新加载仓库列表
          } else {
            toast({
              title: "错误",
              description: response.message || "提交重新处理请求失败",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('重新处理仓库失败:', error);
          toast({
            title: "错误",
            description: "重新处理仓库失败",
            variant: "destructive",
          });
        }
      }
    }
  };

  // 处理创建仓库表单提交
  const handleFormSubmit = async () => {
    if (!formData.url) {
      toast({
        title: "错误",
        description: "请填写仓库地址",
        variant: "destructive",
      });
      return;
    }

    try {
      // 创建Git仓库
      const createData: CreateGitRepositoryRequest = {
        address: formData.url,
        branch: 'main', // 默认分支
      };

      const response = await createGitRepository(createData);
      if (response.code === 200) {
        toast({
          title: "成功",
          description: "仓库创建成功",
        });
        setIsModalOpen(false);
        setFormData({ name: '', url: '', description: '', isPrivate: false });
        loadRepositories(); // 重新加载仓库列表
      } else {
        toast({
          title: "错误",
          description: response.message || "创建仓库失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('提交表单失败:', error);
      toast({
        title: "错误",
        description: "操作失败，请重试",
        variant: "destructive",
      });
    }
  };

  // 处理编辑仓库表单提交
  const handleEditFormSubmit = async () => {
    if (!currentRepository) return;

    if (!editFormData.name) {
      toast({
        title: "错误",
        description: "请填写仓库名称",
        variant: "destructive",
      });
      return;
    }

    try {
      // 更新仓库
      const updateData: UpdateRepositoryRequest = {
        description: editFormData.description,
        isRecommended: false, // 默认值
        prompt: '', // 默认值
      };

      const response = await updateRepository(currentRepository.id, updateData);
      if (response.code === 200) {
        toast({
          title: "成功",
          description: "仓库更新成功",
        });
        setIsEditModalOpen(false);
        setCurrentRepository(null);
        setEditFormData({ name: '', description: '', isPrivate: false });
        loadRepositories(); // 重新加载仓库列表
      } else {
        toast({
          title: "错误",
          description: response.message || "更新仓库失败",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('提交表单失败:', error);
      toast({
        title: "错误",
        description: "操作失败，请重试",
        variant: "destructive",
      });
    }
  };

  // 创建新仓库
  const handleAddRepository = () => {
    setFormData({ name: '', url: '', description: '', isPrivate: false });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">仓库管理</h1>
        <p className="text-sm text-muted-foreground mt-2">
          管理Git仓库和文档处理状态
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              仓库列表
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索仓库名称"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8 w-80"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                搜索
              </Button>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddRepository}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加仓库
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加Git仓库</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">仓库名称</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="请输入仓库名称"
                      />
                    </div>
                    <div>
                      <Label htmlFor="url">仓库地址</Label>
                      <Input
                        id="url"
                        value={formData.url}
                        onChange={(e) => setFormData({...formData, url: e.target.value})}
                        placeholder="https://github.com/user/repo.git"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">描述</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="仓库描述（可选）"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isPrivate"
                        checked={formData.isPrivate}
                        onCheckedChange={(checked) => setFormData({...formData, isPrivate: checked})}
                      />
                      <Label htmlFor="isPrivate">私有仓库</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleFormSubmit}>
                        创建
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>仓库名称</TableHead>
                <TableHead>Git地址</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>文档数</TableHead>
                <TableHead>分支</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repositories.map((repo) => (
                <TableRow key={repo.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-500" />
                      <div>
                        <Link href={`/admin/repositories/${repo.id}`} className="font-medium hover:underline">
                          {repo.organizationName}/{repo.name}
                        </Link>
                        {repo.isRecommended && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-yellow-600">推荐</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {repo.address || '暂无地址'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {repo.description || '暂无描述'}
                  </TableCell>
                  <TableCell>
                    <Badge color={getStatusBadgeVariant(repo.status)}>
                      {getStatusText(repo.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {repo.documentCount || 0}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {repo.branch || 'main'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(repo.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => window.open(`/admin/repositories/${repo.id}`, '_blank')}>
                          <Eye className="h-4 w-4 mr-2" />
                          查看
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRepositoryAction('edit', repo)}>
                          <Edit className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRepositoryAction('reprocess', repo)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          重新处理
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRepositoryAction('delete', repo)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* 分页控件 */}
          {total > 0 && (
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                总共 {total} 条记录，每页 {pageSize} 条
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage > 1) {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      loadRepositories(newPage);
                    }
                  }}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <div className="text-sm">
                  第 {currentPage} 页，共 {Math.ceil(total / pageSize)} 页
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPage < Math.ceil(total / pageSize)) {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      loadRepositories(newPage);
                    }
                  }}
                  disabled={currentPage >= Math.ceil(total / pageSize)}
                >
                  下一页
                </Button>
                <Select 
                  value={pageSize.toString()} 
                  onValueChange={(value) => {
                    const newSize = parseInt(value);
                    setPageSize(newSize);
                    setCurrentPage(1);
                    loadRepositories(1, newSize);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10条</SelectItem>
                    <SelectItem value="20">20条</SelectItem>
                    <SelectItem value="50">50条</SelectItem>
                    <SelectItem value="100">100条</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑仓库对话框 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑仓库</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">仓库名称</Label>
              <Input
                id="editName"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                placeholder="请输入仓库名称"
                disabled
              />
            </div>
            <div>
              <Label htmlFor="editDescription">描述</Label>
              <Input
                id="editDescription"
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                placeholder="仓库描述（可选）"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editIsPrivate"
                checked={editFormData.isPrivate}
                onCheckedChange={(checked) => setEditFormData({...editFormData, isPrivate: checked})}
              />
              <Label htmlFor="editIsPrivate">私有仓库</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                取消
              </Button>
              <Button onClick={handleEditFormSubmit}>
                更新
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
