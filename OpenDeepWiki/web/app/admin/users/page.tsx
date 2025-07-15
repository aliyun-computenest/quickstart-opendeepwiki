'use client'
import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

import { getUserList, createUser, updateUser, deleteUser, UserInfo, CreateUserRequest, UpdateUserRequest } from '../../services/userService';
import { roleService, Role } from '../../services/roleService';

export default function UsersPage() {
  const { toast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  });

  // 加载角色数据
  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await roleService.getRoleList(1, 100, '', true); // 只获取激活的角色
      setRoles(response.items);
    } catch (error) {
      console.error('加载角色数据失败:', error);
      toast({
        title: "错误",
        description: "加载角色数据失败",
        variant: "destructive",
      });
    } finally {
      setRolesLoading(false);
    }
  };

  // 加载用户数据
  const loadUsers = async (page = currentPage, size = pageSize, keyword = searchText) => {
    try {
      setLoading(true);
      const response = await getUserList(page, size, keyword);
      if (response.code === 200) {
        setUsers(response.data.items);
        setTotal(response.data.total);
      } else {
        toast({
          title: "错误",
          description: response.message || '获取用户列表失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      toast({
        title: "错误",
        description: "加载用户数据失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1); // 重置到第一页
    loadUsers(1, pageSize, searchText);
  };

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadUsers(page, pageSize, searchText);
  };

  // 处理用户操作（编辑、删除等）
  const handleUserAction = async (action: string, user: UserInfo) => {
    if (action === 'edit') {
      setCurrentUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '', // 不设置密码字段，让用户选择是否修改
      });
      setIsModalOpen(true);
    } else if (action === 'delete') {
      if (confirm(`确定要删除用户 ${user.name} 吗？此操作不可恢复。`)) {
        try {
          const response = await deleteUser(user.id);
          if (response.code === 200 && response.data) {
            toast({
              title: "成功",
              description: "用户删除成功",
            });
            loadUsers(); // 重新加载用户列表
          } else {
            toast({
              title: "错误",
              description: response.message || '删除用户失败',
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('删除用户失败:', error);
          toast({
            title: "错误",
            description: "删除用户失败",
            variant: "destructive",
          });
        }
      }
    }
  };

  // 处理表单提交（创建/更新用户）
  const handleFormSubmit = async () => {
    // 简单的表单验证
    if (!formData.name || !formData.email || (!currentUser && !formData.password)) {
      toast({
        title: "错误",
        description: "请填写所有必填字段",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentUser) {
        // 更新用户
        const updateData: UpdateUserRequest = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password || undefined, // 如果没有输入密码，会是undefined
        };

        const response = await updateUser(currentUser.id, updateData);
        if (response.code === 200) {
          toast({
            title: "成功",
            description: "用户更新成功",
          });
          setIsModalOpen(false);
          loadUsers(); // 重新加载用户列表
        } else {
          toast({
            title: "错误",
            description: response.message || '更新用户失败',
            variant: "destructive",
          });
        }
      } else {
        // 创建用户
        const createData: CreateUserRequest = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        };

        const { data } = await createUser(createData) as any;
        if (data.code === 200) {
          toast({
            title: "成功",
            description: "用户创建成功",
          });
          setIsModalOpen(false);
          loadUsers(); // 重新加载用户列表
        } else {
          toast({
            title: "错误",
            description: data.message || '创建用户失败',
            variant: "destructive",
          });
        }
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

  // 创建新用户
  const handleAddUser = () => {
    setCurrentUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
    });
    setIsModalOpen(true);
  };

  // 根据角色获取标签颜色和样式
  const getRoleTagProps = (role: string) => {
    if (role === 'admin' || role === '管理员') {
      return {
        color: '#ff4d4f',
        backgroundColor: '#fff2f0',
        border: 'none',
        fontWeight: 500,
      };
    } else {
      return {
        color: '#1677ff',
        backgroundColor: '#e6f4ff',
        border: 'none',
        fontWeight: 500,
      };
    }
  };

  // 获取角色标签样式
  const getRoleBadgeVariant = (role: string) => {
    if (role === 'admin' || role === '管理员') {
      return 'destructive';
    }
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">用户管理</h1>
        <p className="text-sm text-muted-foreground mt-2">
          管理系统用户和权限设置
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              用户列表
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户名或邮箱"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers(1, pageSize, searchText)}
                  className="pl-8 w-80"
                />
              </div>
              <Button
                onClick={() => loadUsers(1, pageSize, searchText)}
                variant="outline"
              >
                搜索
              </Button>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddUser}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加用户
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {currentUser ? '编辑用户' : '添加用户'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">用户名</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="请输入用户名"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="请输入邮箱"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">密码</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder={currentUser ? "留空则不修改密码" : "请输入密码"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">角色</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleFormSubmit}>
                        {currentUser ? '更新' : '创建'}
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
                <TableHead>用户名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-muted-foreground">加载中...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无用户数据
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {roles.find(r => r.name === user.role)?.name || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '从未登录'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleUserAction('edit', user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUserAction('delete', user)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* 分页组件 */}
          {total > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  共 {total} 条记录，第 {currentPage} 页，共 {Math.ceil(total / pageSize)} 页
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">每页显示</span>
                  <Select value={pageSize.toString()} onValueChange={(value) => {
                    const newSize = parseInt(value);
                    setPageSize(newSize);
                    setCurrentPage(1);
                    loadUsers(1, newSize, searchText);
                  }}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">条</span>
                </div>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {/* 页码显示逻辑 */}
                  {(() => {
                    const totalPages = Math.ceil(total / pageSize);
                    const pages = [];
                    
                    // 如果总页数小于等于7，显示所有页码
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => handlePageChange(i)}
                              isActive={currentPage === i}
                              className="cursor-pointer"
                            >
                              {i}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                    } else {
                      // 复杂的分页逻辑
                      if (currentPage <= 4) {
                        // 当前页在前4页
                        for (let i = 1; i <= 5; i++) {
                          pages.push(
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => handlePageChange(i)}
                                isActive={currentPage === i}
                                className="cursor-pointer"
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        pages.push(
                          <PaginationItem key="ellipsis1">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                        pages.push(
                          <PaginationItem key={totalPages}>
                            <PaginationLink
                              onClick={() => handlePageChange(totalPages)}
                              className="cursor-pointer"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (currentPage >= totalPages - 3) {
                        // 当前页在后4页
                        pages.push(
                          <PaginationItem key={1}>
                            <PaginationLink
                              onClick={() => handlePageChange(1)}
                              className="cursor-pointer"
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                        );
                        pages.push(
                          <PaginationItem key="ellipsis2">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                        for (let i = totalPages - 4; i <= totalPages; i++) {
                          pages.push(
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => handlePageChange(i)}
                                isActive={currentPage === i}
                                className="cursor-pointer"
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      } else {
                        // 当前页在中间
                        pages.push(
                          <PaginationItem key={1}>
                            <PaginationLink
                              onClick={() => handlePageChange(1)}
                              className="cursor-pointer"
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                        );
                        pages.push(
                          <PaginationItem key="ellipsis3">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                          pages.push(
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => handlePageChange(i)}
                                isActive={currentPage === i}
                                className="cursor-pointer"
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        pages.push(
                          <PaginationItem key="ellipsis4">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                        pages.push(
                          <PaginationItem key={totalPages}>
                            <PaginationLink
                              onClick={() => handlePageChange(totalPages)}
                              className="cursor-pointer"
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                    }
                    
                    return pages;
                  })()}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < Math.ceil(total / pageSize) && handlePageChange(currentPage + 1)}
                      className={currentPage >= Math.ceil(total / pageSize) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}