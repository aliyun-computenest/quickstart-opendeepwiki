'use client';

import React, { useState, useEffect } from 'react';
import { 
  getAppConfigs, 
  createAppConfig, 
  updateAppConfig, 
  deleteAppConfig, 
  toggleAppConfigEnabled, 
  generateAppId, 
  type AppConfigInput, 
  type AppConfigOutput 
} from '../services/appConfigService';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";

import {
  Plus,
  Pencil,
  Trash,
  Copy,
  Eye,
  Power,
  Globe,
  Code,
} from "lucide-react";

interface AppManagementProps {
  className?: string;
}

const AppManagement: React.FC<AppManagementProps> = ({ className }) => {
  // 状态管理
  const [apps, setApps] = useState<AppConfigOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingApp, setEditingApp] = useState<AppConfigOutput | null>(null);
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppConfigOutput | null>(null);
  const [confirmDeleteApp, setConfirmDeleteApp] = useState<AppConfigOutput | null>(null);
  
  // 表单状态
  const [formValues, setFormValues] = useState<{
    appId: string;
    name: string;
    organizationName: string;
    repositoryName: string;
    description: string;
    enableDomainValidation: boolean;
    allowedDomains: string[];
    prompt?: string;
    introduction?: string;
    model?: string;
    recommendedQuestions?: string[];
    mcps?: { url: string; headers: Record<string, string> }[];
  }>({
    appId: '',
    name: '',
    organizationName: '',
    repositoryName: '',
    description: '',
    enableDomainValidation: false,
    allowedDomains: [],
    prompt: '',
    introduction: '',
    model: '',
    recommendedQuestions: [],
    mcps: [],
  });

  // 加载应用列表
  const loadApps = async () => {
    try {
      setLoading(true);
      const response = await getAppConfigs();
      if (response.code === 200) {
        setApps(response.data);
      } else {
        toast({
          title: "加载失败",
          description: response.message || '加载应用列表失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('加载应用列表失败:', error);
      toast({
        title: "加载失败",
        description: '加载应用列表失败',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadApps();
  }, []);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const appData: AppConfigInput = {
        appId: formValues.appId,
        name: formValues.name,
        organizationName: formValues.organizationName,
        repositoryName: formValues.repositoryName,
        allowedDomains: formValues.allowedDomains || [],
        enableDomainValidation: formValues.enableDomainValidation || false,
        description: formValues.description || '',
        prompt: formValues.prompt,
        introduction: formValues.introduction,
        model: formValues.model,
        recommendedQuestions: formValues.recommendedQuestions,
        mcps: formValues.mcps
      };

      let response;
      if (editingApp) {
        response = await updateAppConfig(editingApp.appId, appData);
      } else {
        response = await createAppConfig(appData);
      }

      if (response.code === 200) {
        toast({
          title: editingApp ? "更新成功" : "创建成功",
          description: editingApp ? '应用更新成功' : '应用创建成功',
        });
        setModalVisible(false);
        setEditingApp(null);
        resetForm();
        loadApps();
      } else {
        toast({
          title: "操作失败",
          description: response.message || '操作失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('操作失败:', error);
      toast({
        title: "操作失败",
        description: '操作失败',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 删除应用
  const handleDelete = async (appId: string) => {
    try {
      setLoading(true);
      const response = await deleteAppConfig(appId);
      if (response.code === 200) {
        toast({
          title: "删除成功",
          description: '应用删除成功',
        });
        loadApps();
      } else {
        toast({
          title: "删除失败",
          description: response.message || '删除失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast({
        title: "删除失败",
        description: '删除失败',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setConfirmDeleteApp(null);
    }
  };

  // 切换应用状态
  const handleToggleEnabled = async (appId: string) => {
    try {
      setLoading(true);
      const response = await toggleAppConfigEnabled(appId);
      if (response.code === 200) {
        toast({
          title: "状态更新",
          description: '应用状态更新成功',
        });
        loadApps();
      } else {
        toast({
          title: "状态更新失败",
          description: response.message || '状态更新失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('状态更新失败:', error);
      toast({
        title: "状态更新失败",
        description: '状态更新失败',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 打开编辑模态框
  const handleEdit = (app: AppConfigOutput) => {
    setEditingApp(app);
    setFormValues({
      appId: app.appId,
      name: app.name,
      organizationName: app.organizationName,
      repositoryName: app.repositoryName,
      allowedDomains: app.allowedDomains || [],
      enableDomainValidation: app.enableDomainValidation || false,
      description: app.description || '',
      prompt: app.prompt || '',
      introduction: app.introduction || '',
      model: app.model || '',
      recommendedQuestions: app.recommendedQuestions || [],
      mcps: app.mcps || [],
    });
    setModalVisible(true);
  };

  // 创建新应用
  const handleCreate = () => {
    setEditingApp(null);
    resetForm();
    setFormValues(prev => ({
      ...prev,
      appId: generateAppId(),
    }));
    setModalVisible(true);
  };

  // 重置表单
  const resetForm = () => {
    setFormValues({
      appId: '',
      name: '',
      organizationName: '',
      repositoryName: '',
      description: '',
      enableDomainValidation: false,
      allowedDomains: [],
      prompt: '',
      introduction: '',
      model: '',
      recommendedQuestions: [],
      mcps: [],
    });
  };

  // 显示使用说明
  const showUsage = (app: AppConfigOutput) => {
    setSelectedApp(app);
    setUsageModalVisible(true);
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "已复制",
      description: '已复制到剪贴板',
    });
  };

  // 生成使用代码
  const generateUsageCode = (app: AppConfigOutput) => {
    return `<!-- 引入聊天组件脚本 -->
<script src="${window.location.origin}/koala-chat-widget.js"></script>
<script>
KoalaChatWidget.init({
  appId: '${app.appId}',
  title: '${app.name}',
  theme: 'light', // 或 'dark'
  // 其他可选配置...
  onError: (error) => {
    console.error('Chat widget error:', error);
  },
  onValidationFailed: (domain) => {
    console.error('Domain validation failed:', domain);
  }
});
</script>`;
  };

  // 处理域名输入
  const handleDomainInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newDomain = e.currentTarget.value.trim();
      if (!formValues.allowedDomains.includes(newDomain)) {
        setFormValues(prev => ({
          ...prev,
          allowedDomains: [...prev.allowedDomains, newDomain]
        }));
      }
      e.currentTarget.value = '';
    }
  };

  // 删除域名
  const removeDomain = (domain: string) => {
    setFormValues(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter(d => d !== domain)
    }));
  };

  // 处理推荐问题输入
  const handleQuestionInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newQuestion = e.currentTarget.value.trim();
      const currentQuestions = formValues.recommendedQuestions || [];
      if (!currentQuestions.includes(newQuestion)) {
        setFormValues(prev => ({
          ...prev,
          recommendedQuestions: [...currentQuestions, newQuestion]
        }));
      }
      e.currentTarget.value = '';
    }
  };

  // 删除推荐问题
  const removeQuestion = (index: number) => {
    setFormValues(prev => ({
      ...prev,
      recommendedQuestions: (prev.recommendedQuestions || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className={`${className} space-y-6`}>
      {/* 头部卡片 */}
      <Card className="border-none shadow-md bg-gradient-to-r from-primary/10 to-primary/5">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Globe className="h-5 w-5" />
                应用管理
              </CardTitle>
              <CardDescription>
                创建和管理您的 AI 聊天应用，配置域名验证和访问权限
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1" />
              创建应用
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 应用卡片列表 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="text-lg font-medium mb-1">加载中...</h3>
          <p className="text-muted-foreground">正在获取应用列表</p>
        </div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg">
          <div className="text-4xl mb-4">📱</div>
          <h3 className="text-lg font-medium mb-1">暂无应用</h3>
          <p className="text-muted-foreground mb-6">创建您的第一个 AI 聊天应用</p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            创建第一个应用
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {apps.map((app) => (
            <Card key={app.appId} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{app.name}</CardTitle>
                  <Badge variant={app.isEnabled !== false ? "default" : "outline"}>
                    {app.isEnabled !== false ? '启用' : '禁用'}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  ID: {app.appId}
                </CardDescription>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Globe className="h-3 w-3 mr-1" />
                  {app.organizationName}/{app.repositoryName}
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                {app.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {app.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">域名验证</span>
                    <Badge variant={app.enableDomainValidation ? "secondary" : "outline"} className="text-xs">
                      {app.enableDomainValidation ? '已启用' : '未启用'}
                    </Badge>
                  </div>
                  
                  {app.enableDomainValidation && app.allowedDomains.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {app.allowedDomains.slice(0, 2).map(domain => (
                        <Badge key={domain} variant="outline" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                      {app.allowedDomains.length > 2 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs">
                                +{app.allowedDomains.length - 2}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {app.allowedDomains.slice(2).join(', ')}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 border-t">
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs text-muted-foreground">
                    创建于 {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => showUsage(app)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>查看使用说明</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(app)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => handleToggleEnabled(app.appId)}
                          >
                            <Power className={`h-4 w-4 ${app.isEnabled !== false ? "text-green-500" : "text-muted-foreground"}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{app.isEnabled !== false ? '禁用' : '启用'}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive" 
                            onClick={() => setConfirmDeleteApp(app)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>删除</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 创建/编辑模态框 */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingApp ? '编辑应用' : '创建应用'}</DialogTitle>
            <DialogDescription>
              {editingApp ? '修改应用信息和配置' : '创建一个新的 AI 聊天应用'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="appId">应用 ID</Label>
                <Input
                  id="appId"
                  value={formValues.appId}
                  onChange={(e) => setFormValues({...formValues, appId: e.target.value})}
                  disabled={!!editingApp}
                  placeholder="应用的唯一标识符"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="name">应用名称</Label>
                <Input
                  id="name"
                  value={formValues.name}
                  onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                  placeholder="应用的显示名称"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="organizationName">组织名称</Label>
                  <Input
                    id="organizationName"
                    value={formValues.organizationName}
                    onChange={(e) => setFormValues({...formValues, organizationName: e.target.value})}
                    placeholder="组织或用户名"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="repositoryName">仓库名称</Label>
                  <Input
                    id="repositoryName"
                    value={formValues.repositoryName}
                    onChange={(e) => setFormValues({...formValues, repositoryName: e.target.value})}
                    placeholder="仓库名称"
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">应用描述</Label>
                <Textarea
                  id="description"
                  value={formValues.description}
                  onChange={(e) => setFormValues({...formValues, description: e.target.value})}
                  placeholder="应用的详细描述（可选）"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="prompt">默认提示词</Label>
                <Textarea
                  id="prompt"
                  value={formValues.prompt || ''}
                  onChange={(e) => setFormValues({...formValues, prompt: e.target.value})}
                  placeholder="设置AI助手的默认提示词（可选）"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="introduction">开场白</Label>
                <Textarea
                  id="introduction"
                  value={formValues.introduction || ''}
                  onChange={(e) => setFormValues({...formValues, introduction: e.target.value})}
                  placeholder="设置AI助手的开场白（可选）"
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">选择模型</Label>
                <Input
                  id="model"
                  value={formValues.model || ''}
                  onChange={(e) => setFormValues({...formValues, model: e.target.value})}
                  placeholder="指定使用的AI模型（可选）"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="recommendedQuestions">推荐问题</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(formValues.recommendedQuestions || []).map((question, index) => (
                    <Badge key={index} variant="secondary" className="flex gap-1 items-center">
                      {question}
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="rounded-full h-4 w-4 inline-flex items-center justify-center hover:bg-secondary-foreground/20"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  id="recommendedQuestions"
                  placeholder="输入推荐问题，按回车添加"
                  onKeyDown={handleQuestionInput}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableDomainValidation"
                  checked={formValues.enableDomainValidation}
                  onCheckedChange={(checked) => setFormValues({...formValues, enableDomainValidation: checked})}
                />
                <Label htmlFor="enableDomainValidation">启用域名验证</Label>
              </div>
              
              {formValues.enableDomainValidation && (
                <div className="grid gap-2">
                  <Label htmlFor="allowedDomains">允许的域名</Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formValues.allowedDomains.map(domain => (
                      <Badge key={domain} variant="secondary" className="flex gap-1 items-center">
                        {domain}
                        <button 
                          type="button" 
                          onClick={() => removeDomain(domain)}
                          className="rounded-full h-4 w-4 inline-flex items-center justify-center hover:bg-secondary-foreground/20"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    id="allowedDomains"
                    placeholder="输入域名，按回车添加"
                    onKeyDown={handleDomainInput}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '处理中...' : editingApp ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!confirmDeleteApp} onOpenChange={(open) => !open && setConfirmDeleteApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这个应用吗？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后将无法恢复，请谨慎操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeleteApp && handleDelete(confirmDeleteApp.appId)}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 使用说明模态框 */}
      <Dialog open={usageModalVisible} onOpenChange={setUsageModalVisible}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              使用说明 - {selectedApp?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6">
              <div className="bg-primary/5 p-4 rounded-md border border-primary/10 flex items-start gap-3">
                <div className="text-xl mt-0.5">💡</div>
                <div>
                  <h4 className="font-medium text-sm">集成说明</h4>
                  <p className="text-sm text-muted-foreground">
                    将以下代码添加到您的网站页面中，即可启用 AI 聊天功能。
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">HTML 集成代码</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => copyToClipboard(generateUsageCode(selectedApp))}
                    className="h-8"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    复制全部
                  </Button>
                </div>
                <div className="relative bg-muted p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm font-mono">{generateUsageCode(selectedApp)}</pre>
                  <div className="absolute top-0 left-0 px-2 py-1 text-xs text-muted-foreground bg-muted rounded-br-md">
                    HTML
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-md p-4 space-y-4">
                <h4 className="font-medium border-b pb-2">配置信息</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">应用 ID</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{selectedApp.appId}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => copyToClipboard(selectedApp.appId)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">应用名称</p>
                    <span className="text-sm">{selectedApp.name}</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">组织/仓库</p>
                    <span className="text-sm flex items-center">
                      <Globe className="h-3 w-3 mr-1" />
                      {selectedApp.organizationName}/{selectedApp.repositoryName}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">域名验证</p>
                    <Badge variant={selectedApp.enableDomainValidation ? "secondary" : "outline"}>
                      {selectedApp.enableDomainValidation ? '已启用' : '未启用'}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedApp.enableDomainValidation && selectedApp.allowedDomains.length > 0 && (
                <div className="bg-muted/50 rounded-md p-4 space-y-4">
                  <h4 className="font-medium border-b pb-2">允许的域名</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedApp.allowedDomains.map(domain => (
                      <Badge key={domain} variant="outline">{domain}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppManagement; 