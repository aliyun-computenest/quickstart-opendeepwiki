'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Database,
  Shield
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

import { roleService, Role, CreateRoleDto, UpdateRoleDto } from '../../services/roleService';

const RolesPage: React.FC = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // 加载角色列表
  const loadRoles = async (page = 1, pageSize = 10, keyword = '') => {
    setLoading(true);
    try {
      const result = await roleService.getRoleList(page, pageSize, keyword);
      setRoles(result.items);
      setPagination({
        current: page,
        pageSize,
        total: result.total,
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "加载角色列表失败",
        variant: "destructive",
      });
      console.error('加载角色列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // 搜索
  const handleSearch = () => {
    loadRoles(1, pagination.pageSize, searchKeyword);
  };

  // 创建/编辑角色
  const handleSubmit = async () => {
    if (!formData.name) {
      toast({
        title: "错误",
        description: "请填写角色名称",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, formData as UpdateRoleDto);
        toast({
          title: "成功",
          description: "更新角色成功",
        });
      } else {
        await roleService.createRole(formData as CreateRoleDto);
        toast({
          title: "成功",
          description: "创建角色成功",
        });
      }
      setIsModalVisible(false);
      setFormData({ name: '', description: '', isActive: true });
      setEditingRole(null);
      loadRoles(pagination.current, pagination.pageSize, searchKeyword);
    } catch (error) {
      toast({
        title: "错误",
        description: editingRole ? "更新角色失败" : "创建角色失败",
        variant: "destructive",
      });
      console.error('操作角色失败:', error);
    }
  };

  // 删除角色
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个角色吗？')) return;

    try {
      await roleService.deleteRole(id);
      toast({
        title: "成功",
        description: "删除角色成功",
      });
      loadRoles(pagination.current, pagination.pageSize, searchKeyword);
    } catch (error) {
      toast({
        title: "错误",
        description: "删除角色失败",
        variant: "destructive",
      });
      console.error('删除角色失败:', error);
    }
  };

  // 编辑角色
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      isActive: role.isActive,
    });
    setIsModalVisible(true);
  };

  // 新增角色
  const handleAdd = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', isActive: true });
    setIsModalVisible(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">角色管理</h1>
        <p className="text-sm text-muted-foreground mt-2">
          管理系统角色和权限
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              角色列表
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索角色名称"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8 w-80"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                搜索
              </Button>
              <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
                <DialogTrigger asChild>
                  <Button onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加角色
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingRole ? '编辑角色' : '添加角色'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">角色名称</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="请输入角色名称"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">描述</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="角色描述（可选）"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                      />
                      <Label htmlFor="isActive">启用角色</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsModalVisible(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSubmit}>
                        {editingRole ? '更新' : '创建'}
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
                <TableHead>角色名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>用户数</TableHead>
                <TableHead>权限数</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      {role.isSystemRole && (
                        <Badge variant="destructive">系统角色</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.description || '暂无描述'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isActive ? 'default' : 'secondary'}>
                      {role.isActive ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {role.userCount || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Database className="h-4 w-4" />
                      {role.warehousePermissionCount || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(role.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(role)}
                        disabled={role.isSystemRole}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(role.id)}
                        disabled={role.isSystemRole}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPage;