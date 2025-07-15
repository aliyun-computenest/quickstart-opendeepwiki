'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Database,
  Folder,
  Save,
  RefreshCw,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { roleService, Role } from '../../../services/roleService';
import {
  permissionService,
  WarehousePermissionTree,
  RolePermission,
  WarehousePermission,
} from '../../../services/permissionService';

// 类型定义
interface PermissionNode {
  key: string;
  title: string;
  children?: PermissionNode[];
  permission?: WarehousePermission;
  type: 'organization' | 'warehouse';
  isSelected: boolean;
  expanded?: boolean;
}

interface NodePermissions {
  [nodeId: string]: {
    isReadOnly: boolean;
    isWrite: boolean;
    isDelete: boolean;
  };
}

const RolePermissionsPage: React.FC = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [nodePermissions, setNodePermissions] = useState<NodePermissions>({});
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 加载角色列表
  const loadRoles = async () => {
    try {
      const allRoles = await roleService.getAllRoles();
      setRoles(allRoles.items.filter((role: Role) => !role.isSystemRole)); // 过滤系统角色
    } catch (error) {
      toast({ description: '加载角色列表失败', variant: 'destructive' });
      console.error('加载角色列表失败:', error);
    }
  };

  // 加载权限树
  const loadPermissionTree = async (roleId?: string) => {
    setLoading(true);
    try {
      const tree = await permissionService.getWarehousePermissionTree(roleId);
      const treeData = convertToTreeData(tree);
      setPermissionTree(treeData);
      
      // 设置已选中的节点
      const selected = tree.filter(node => isNodeSelected(node)).map(node => node.id);
      setCheckedKeys(selected);
      
      // 设置节点权限
      const permissions: NodePermissions = {};
      const buildNodePermissions = (nodes: WarehousePermissionTree[]) => {
        nodes.forEach(node => {
          if (node.type === 'warehouse' && node.permission) {
            permissions[node.id] = {
              isReadOnly: node.permission.isReadOnly,
              isWrite: node.permission.isWrite,
              isDelete: node.permission.isDelete,
            };
          } else if (node.type === 'warehouse') {
            permissions[node.id] = {
              isReadOnly: true,
              isWrite: false,
              isDelete: false,
            };
          }
          if (node.children) {
            buildNodePermissions(node.children);
          }
        });
      };
      buildNodePermissions(tree);
      setNodePermissions(permissions);
    } catch (error) {
      toast({ description: '加载权限树失败', variant: 'destructive' });
      console.error('加载权限树失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 递归检查节点是否被选中
  const isNodeSelected = (node: WarehousePermissionTree): boolean => {
    if (node.isSelected) return true;
    return node.children.some(child => isNodeSelected(child));
  };

  // 转换权限树数据格式
  const convertToTreeData = (tree: WarehousePermissionTree[]): PermissionNode[] => {
    return tree.map(node => ({
      key: node.id,
      title: node.name,
      children: node.children ? convertToTreeData(node.children) : undefined,
      permission: node.permission,
      type: node.type,
      isSelected: node.isSelected,
      expanded: expandedKeys.includes(node.id),
    }));
  };

  // 切换节点展开状态
  const toggleExpanded = (nodeKey: string) => {
    setExpandedKeys(prev =>
      prev.includes(nodeKey)
        ? prev.filter(key => key !== nodeKey)
        : [...prev, nodeKey]
    );
  };

  // 切换节点选中状态
  const toggleChecked = (nodeKey: string) => {
    setCheckedKeys(prev => {
      const newCheckedKeys = prev.includes(nodeKey)
        ? prev.filter(key => key !== nodeKey)
        : [...prev, nodeKey];

      // 为新选中的仓库节点设置默认权限
      if (!prev.includes(nodeKey)) {
        const node = findNodeByKey(permissionTree, nodeKey);
        if (node && node.type === 'warehouse' && !nodePermissions[nodeKey]) {
          setNodePermissions(prevPermissions => ({
            ...prevPermissions,
            [nodeKey]: {
              isReadOnly: true,
              isWrite: false,
              isDelete: false,
            }
          }));
        }
      }

      return newCheckedKeys;
    });
  };

  // 处理权限变更
  const handlePermissionChange = (nodeId: string, permissionType: 'isReadOnly' | 'isWrite' | 'isDelete', checked: boolean) => {
    setNodePermissions(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [permissionType]: checked,
      }
    }));
  };

  // 渲染自定义树节点
  const renderTreeNode = (node: PermissionNode, level: number = 0): React.ReactNode => {
    const isChecked = checkedKeys.includes(node.key);
    const isExpanded = expandedKeys.includes(node.key);
    const hasChildren = node.children && node.children.length > 0;
    const icon = node.type === 'organization' ? <Folder className="size-4" /> : <Database className="size-4" />;

    const currentPermissions = nodePermissions[node.key] || {
      isReadOnly: node.permission?.isReadOnly || true,
      isWrite: node.permission?.isWrite || false,
      isDelete: node.permission?.isDelete || false,
    };

    return (
      <div key={node.key} className="select-none">
        <div
          className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => toggleExpanded(node.key)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
            {!hasChildren && <div className="w-4" />}

            <Checkbox
              checked={isChecked}
              onCheckedChange={() => toggleChecked(node.key)}
            />

            {icon}
            <span className="text-sm">{node.title}</span>
            {node.isSelected && <Badge variant="default">已授权</Badge>}
          </div>

          {node.type === 'warehouse' && isChecked && (
            <div className="flex items-center gap-1">
              <Checkbox
                checked={currentPermissions.isReadOnly}
                onCheckedChange={(checked) =>
                  handlePermissionChange(node.key, 'isReadOnly', checked === true)
                }
              />
              <Badge variant="secondary">读</Badge>
              <Checkbox
                checked={currentPermissions.isWrite}
                onCheckedChange={(checked) =>
                  handlePermissionChange(node.key, 'isWrite', checked === true)
                }
              />
              <Badge variant="secondary">写</Badge>
              <Checkbox
                checked={currentPermissions.isDelete}
                onCheckedChange={(checked) =>
                  handlePermissionChange(node.key, 'isDelete', checked === true)
                }
              />
              <Badge variant="destructive">删</Badge>
            </div>
          )}

          {node.type === 'warehouse' && !isChecked && node.permission && (
            <div className="flex items-center gap-1">
              {node.permission.isReadOnly && <Badge variant="secondary">读</Badge>}
              {node.permission.isWrite && <Badge variant="secondary">写</Badge>}
              {node.permission.isDelete && <Badge variant="destructive">删</Badge>}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };



  // 处理角色选择变化
  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    loadPermissionTree(roleId);
  };



  // 查找节点
  const findNodeByKey = (nodes: PermissionNode[], key: string): PermissionNode | null => {
    for (const node of nodes) {
      if (node.key === key) {
        return node;
      }
      if (node.children) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  // 保存权限配置
  const handleSave = async () => {
    if (!selectedRoleId) {
      toast({ description: '请先选择角色' });
      return;
    }

    setSaving(true);
    try {
      // 获取选中的仓库权限
      const warehousePermissions: WarehousePermission[] = [];
      
      const getWarehousePermissions = (nodes: PermissionNode[], selectedKeys: string[]) => {
        nodes.forEach(node => {
          if (node.type === 'warehouse' && selectedKeys.includes(node.key)) {
            const permissions = nodePermissions[node.key] || {
              isReadOnly: true,
              isWrite: false,
              isDelete: false,
            };
            
            warehousePermissions.push({
              warehouseId: node.key,
              isReadOnly: permissions.isReadOnly,
              isWrite: permissions.isWrite,
              isDelete: permissions.isDelete,
            });
          }
          if (node.children) {
            getWarehousePermissions(node.children, selectedKeys);
          }
        });
      };

      getWarehousePermissions(permissionTree, checkedKeys);

      const rolePermission: RolePermission = {
        roleId: selectedRoleId,
        warehousePermissions,
      };

      await permissionService.setRolePermissions(rolePermission);
      toast({ description: '保存权限配置成功' });
      
      // 重新加载权限树以显示最新状态
      loadPermissionTree(selectedRoleId);
    } catch (error) {
      toast({ description: '保存权限配置失败', variant: 'destructive' });
      console.error('保存权限配置失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 刷新权限树
  const handleRefresh = () => {
    if (selectedRoleId) {
      loadPermissionTree(selectedRoleId);
    } else {
      loadPermissionTree();
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissionTree();
    // 默认展开所有组织节点
    const expandAllOrganizations = (nodes: PermissionNode[]): string[] => {
      const keys: string[] = [];
      nodes.forEach(node => {
        if (node.type === 'organization') {
          keys.push(node.key);
        }
        if (node.children) {
          keys.push(...expandAllOrganizations(node.children));
        }
      });
      return keys;
    };

    if (permissionTree.length > 0) {
      setExpandedKeys(expandAllOrganizations(permissionTree));
    }
  }, [permissionTree]);

  return (
    <div className="p-6 space-y-6">
      {/* 角色选择卡片 */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>角色权限配置</CardTitle>
          <CardDescription>先选择角色，再配置其仓库权限</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 w-64">
            <span className="text-sm whitespace-nowrap">选择角色：</span>
            <Select value={selectedRoleId} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择角色" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id} disabled={!role.isActive}>
                    <span className="flex items-center gap-2">
                      {role.name}
                      {!role.isActive && <Badge variant="destructive">禁用</Badge>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={!selectedRoleId || saving}>
              <Save className="size-4 mr-1" /> 保存配置
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className="size-4 mr-1" /> 刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 权限树卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>仓库权限树</CardTitle>
          {selectedRoleId && (
            <Badge>已选择: {roles.find((r) => r.id === selectedRoleId)?.name}</Badge>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-20">
              <Skeleton className="w-32 h-32" />
            </div>
          ) : (
            <>
              <div className="mb-4 text-xs text-muted-foreground flex items-center gap-2">
                <Badge>说明</Badge>
                <span>
                  选择组织将自动选择该组织下的所有仓库。选中仓库后，可以在右侧配置具体的读、写、删除权限。
                </span>
              </div>

              <div className="border rounded-md p-4 max-h-[500px] overflow-y-auto">
                {permissionTree.map(node => renderTreeNode(node))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RolePermissionsPage; 