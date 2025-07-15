'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Search, Edit, Loader2 } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableCaption,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { roleService, Role, UserInfo } from '../../../services/roleService';
import { permissionService, UserRole } from '../../../services/permissionService';
import { getUserList } from '../../../services/userService';

// 日期格式化工具
const formatDate = (dateStr?: string) =>
  dateStr ? new Date(dateStr).toLocaleString() : '';

const UserRolesPage: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // toast
  const { toast } = useToast();

  // 加载用户列表
  const loadUsers = async (page: number = 1, pageSize: number = 10, keyword?: string) => {
    setLoading(true);
    try {
      const response = await getUserList(page, pageSize, keyword);
      
      if (response.code === 200 && response.data) {
        setUsers(response.data.items);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: response.data.total,
        }));
      } else {
        toast({ description: response.message || '加载用户列表失败', variant: 'destructive' });
        setUsers([]);
      }
    } catch (error) {
      toast({ description: '加载用户列表失败', variant: 'destructive' });
      console.error('加载用户列表失败:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // 加载角色列表
  const loadRoles = async () => {
    try {
      const allRoles = await roleService.getAllRoles();
      setRoles(allRoles.items);
    } catch (error) {
      toast({ description: '加载角色列表失败', variant: 'destructive' });
      console.error('加载角色列表失败:', error);
    }
  };

  // 获取用户角色
  const loadUserRoles = async (userId: string) => {
    try {
      const roles = await permissionService.getUserRoles(userId);
      return roles.map(role => role.id);
    } catch (error) {
      console.error('获取用户角色失败:', error);
      return [];
    }
  };

  // 处理编辑用户角色
  const handleEditRoles = async (user: UserInfo) => {
    setSelectedUser(user);
    setModalVisible(true);
    
    // 获取用户当前角色
    const currentRoles = await loadUserRoles(user.id);
    setUserRoles(currentRoles);
  };

  // 保存用户角色分配
  const handleSaveRoles = async () => {
    if (!selectedUser) return;

    setAssigning(true);
    try {
      const userRole: UserRole = {
        userId: selectedUser.id,
        roleIds: userRoles,
      };

      await permissionService.assignUserRoles(userRole);
      toast({ description: '分配用户角色成功' });
      setModalVisible(false);
      setSelectedUser(null);
      setUserRoles([]);
      
      // 重新加载用户列表
      loadUsers(pagination.current, pagination.pageSize, searchKeyword);
    } catch (error) {
      toast({ description: '分配用户角色失败', variant: 'destructive' });
      console.error('分配用户角色失败:', error);
    } finally {
      setAssigning(false);
    }
  };

  // 搜索用户
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    loadUsers(1, pagination.pageSize, value);
  };

  // 处理表格分页变化
  const handleTableChange = (page: number, pageSize?: number) => {
    const newPageSize = pageSize || pagination.pageSize;
    loadUsers(page, newPageSize, searchKeyword);
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // ---------------- 组件渲染 ----------------
  const renderTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>用户</TableHead>
          <TableHead>注册时间</TableHead>
          <TableHead>最后登录</TableHead>
          <TableHead className="w-24">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              <Loader2 className="mx-auto animate-spin" />
            </TableCell>
          </TableRow>
        ) : (
          users.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="font-medium">{record.name}</div>
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <Mail className="size-3" />
                    {record.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>{formatDate(record.createdAt)}</TableCell>
              <TableCell>{record.lastLoginAt ? formatDate(record.lastLoginAt) : '从未登录'}</TableCell>
              <TableCell>
                <Button variant="link" size="sm" onClick={() => handleEditRoles(record)}>
                  <Edit className="size-4 mr-1" /> 分配角色
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
      {users.length === 0 && !loading && (
        <TableCaption>暂无数据</TableCaption>
      )}
    </Table>
  );

  const totalPages = Math.ceil(pagination.total / pagination.pageSize) || 1;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  const renderPagination = () => (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (pagination.current > 1) handleTableChange(pagination.current - 1);
            }}
          />
        </PaginationItem>
        {pageNumbers.map((num) => (
          <PaginationItem key={num}>
            <PaginationLink
              href="#"
              isActive={num === pagination.current}
              onClick={(e) => {
                e.preventDefault();
                handleTableChange(num);
              }}
            >
              {num}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (pagination.current < totalPages) handleTableChange(pagination.current + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle>用户角色管理</CardTitle>
            <CardDescription>为用户分配角色，控制其访问权限</CardDescription>
          </div>
          <div className="w-72">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="搜索用户名或邮箱"
                className="pl-8"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch(searchKeyword);
                  if (e.key === 'Escape' && !searchKeyword) {
                    loadUsers(1, pagination.pageSize);
                  }
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderTable()}
          {renderPagination()}
        </CardContent>
      </Card>

      {/* 角色分配对话框 */}
      <Dialog open={modalVisible} onOpenChange={(open) => {
        setModalVisible(open);
        if (!open) {
          setSelectedUser(null);
          setUserRoles([]);
        }
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>为用户 "{selectedUser?.name}" 分配角色</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="mb-4 flex items-center gap-2">
              <Avatar className="size-6">
                {selectedUser.avatar && (
                  <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                )}
                <AvatarFallback>
                  <User className="size-4" />
                </AvatarFallback>
              </Avatar>
              <span>{selectedUser.name}</span>
              <span className="text-muted-foreground text-xs">({selectedUser.email})</span>
            </div>
          )}

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {roles.map((role: Role) => {
              const checked = userRoles.includes(role.id);
              return (
                <div key={role.id} className="flex items-center gap-2">
                  <Checkbox
                    id={role.id}
                    checked={checked}
                    onCheckedChange={(value) => {
                      setUserRoles((prev) =>
                        value ? [...prev, role.id] : prev.filter((id) => id !== role.id)
                      );
                    }}
                    disabled={!role.isActive}
                  />
                  <label htmlFor={role.id} className="text-sm flex items-center gap-2">
                    <span>{role.name}</span>
                    {role.description && (
                      <span className="text-muted-foreground text-xs">({role.description})</span>
                    )}
                    {!role.isActive && <Badge variant="destructive">禁用</Badge>}
                    {role.isSystemRole && <Badge variant="secondary">系统角色</Badge>}
                  </label>
                </div>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-muted-foreground">提示：用户可以拥有多个角色，最终权限为所有角色权限的并集</p>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button onClick={handleSaveRoles} disabled={assigning}>
              {assigning && <Loader2 className="mr-2 size-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserRolesPage; 