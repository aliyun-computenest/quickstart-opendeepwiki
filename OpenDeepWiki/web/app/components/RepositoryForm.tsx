'use client'

import React, { useState, } from 'react';
import { RepositoryFormValues } from '../types';
import { submitWarehouse, UploadAndSubmitWarehouse, getBranchList, Customsubmitwarehouse } from '../services';
import { useTranslation } from '../i18n/client';
import { toast } from 'sonner';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Github, 
  GitBranch, 
  RefreshCw, 
  Link, 
  Upload, 
  Settings,
  User,
  Lock,
  File,
  Info
} from 'lucide-react';

interface RepositoryFormProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: RepositoryFormValues) => void;
  initialValues?: Partial<RepositoryFormValues>;
  disabledFields?: string[];
}

const RepositoryForm: React.FC<RepositoryFormProps> = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  disabledFields = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RepositoryFormValues>({
    address: '',
    type: 'git',
    branch: 'main',
    enableGitAuth: false,
    submitType: 'git',
    uploadMethod: 'url',
    ...initialValues,
  });
  const [branches, setBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [lastAddress, setLastAddress] = useState<string>('');
  const { t } = useTranslation();

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (formData.submitType === 'git') {
        // Git仓库提交
        if (!formData.address) {
          toast.error(t('repository.form.address_required', '请输入仓库地址'));
          return;
        }
        if (!formData.branch) {
          toast.error(t('repository.form.branch_required', '请选择分支'));
          return;
        }

        const response = await submitWarehouse(formData) as any;
        if (response.data.code === 200) {
          toast.success(t('repository.form.success_message', '仓库添加成功'));
          onSubmit(formData);
          resetForm();
        } else {
          toast.error(response.data.message || t('repository.form.error_message', '添加失败，请重试'));
        }
      } else if (formData.submitType === 'custom') {
        // 自定义仓库提交
        if (!formData.organization || !formData.repositoryName || !formData.address) {
          toast.error('请填写完整的仓库信息');
          return;
        }

        const response = await Customsubmitwarehouse(formData) as any;
        if (response.data.code === 200) {
          toast.success(t('repository.form.success_message', '仓库添加成功'));
          onSubmit(formData);
          resetForm();
        } else {
          toast.error(response.data.message || t('repository.form.error_message', '添加失败，请重试'));
        }
      } else {
        // 压缩包上传
        if (!formData.organization || !formData.repositoryName) {
          toast.error('请填写完整的仓库信息');
          return;
        }

        if (formData.uploadMethod === 'file') {
          // 文件上传方式
          if (!formData.file) {
            toast.error('请选择要上传的压缩包文件');
            return;
          }

          const formDataObj = new FormData();
          formDataObj.append('file', formData.file);
          formDataObj.append('organization', formData.organization);
          formDataObj.append('repositoryName', formData.repositoryName);

          const { data } = await UploadAndSubmitWarehouse(formDataObj) as any;
          if (data && data.code === 200) {
            toast.success('文件上传成功');
            onSubmit(formData);
            resetForm();
          } else {
            toast.error(data?.message || '文件上传失败，请重试');
          }
        } else {
          // URL下载方式
          if (!formData.fileUrl) {
            toast.error('请输入压缩包URL地址');
            return;
          }

          const formDataObj = new FormData();
          formDataObj.append('fileUrl', formData.fileUrl);
          formDataObj.append('organization', formData.organization);
          formDataObj.append('repositoryName', formData.repositoryName);

          const { data } = await UploadAndSubmitWarehouse(formDataObj) as any;
          if (data && data.code === 200) {
            toast.success(t('repository.form.url_download_success', '从URL下载压缩包成功'));
            onSubmit(formData);
            resetForm();
          } else {
            toast.error(data?.message || t('repository.form.url_download_failed', '从URL下载失败，请重试'));
          }
        }
      }
    } catch (error) {
      console.error('Form submission failed:', error);
      toast.error('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      address: '',
      type: 'git',
      branch: 'main',
      enableGitAuth: false,
      submitType: 'git',
      uploadMethod: 'url',
      ...initialValues,
    });
    setBranches([]);
  };

  const fetchBranches = async (address?: string) => {
    const targetAddress = address || formData.address;
    if (!targetAddress) {
      toast.error(t('repository.form.address_required', '请先输入仓库地址'));
      return;
    }

    setLoadingBranches(true);
    try {
      let username = undefined;
      let password = undefined;
      
      if (formData.enableGitAuth) {
        username = formData.gitUserName;
        password = formData.gitPassword;
        
        if (!username || !password) {
          toast.error(t('repository.form.auth_required', '已启用认证，请先输入用户名和密码/令牌'));
          return;
        }
      }

      const response = await getBranchList(targetAddress, username, password);
      
      if (response.success && response.data && response.data.length > 0) {
        setBranches(response.data);
        
        if (response.defaultBranch && response.data.includes(response.defaultBranch)) {
          setFormData(prev => ({ ...prev, branch: response.defaultBranch }));
        } else {
          setFormData(prev => ({ ...prev, branch: response.data[0] }));
        }
        toast.success(`已加载 ${response.data.length} 个分支`);
      } else {
        setBranches([]);
        toast.warning('未能获取分支信息，可以手动输入分支名');
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      toast.error('获取分支失败');
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleAddressChange = (value: string) => {
    setFormData(prev => ({ ...prev, address: value }));
    
    if (value && value !== lastAddress && value.includes('/')) {
      if (
        (value.includes('github.com/') || value.includes('gitee.com/')) &&
        value.split('/').filter(Boolean).length >= 2
      ) {
        setLastAddress(value);
        fetchBranches(value);
      }
    }
  };

  const getIcon = () => {
    switch (formData.submitType) {
      case 'git':
        return <Github className="h-4 w-4" />;
      case 'custom':
        return <Settings className="h-4 w-4" />;
      case 'upload':
        return <File className="h-4 w-4" />;
      default:
        return <Github className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (formData.submitType) {
      case 'git':
        return t('repository.form.git_repo');
      case 'custom':
        return t('repository.form.custom_repo');
      case 'upload':
        return t('repository.form.upload_zip');
      default:
        return t('repository.form.title');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 提交类型选择 */}
          <div className="space-y-2">
            <Label>{t('repository.form.submit_type')}</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={formData.submitType === 'git' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, submitType: 'git' }))}
                className="justify-start"
              >
                <Github className="h-4 w-4 mr-1" />
                Git
              </Button>
              <Button
                variant={formData.submitType === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, submitType: 'custom' }))}
                className="justify-start"
              >
                <Settings className="h-4 w-4 mr-1" />
                {t('repository.form.custom_repo', '自定义')}
              </Button>
              <Button
                variant={formData.submitType === 'upload' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, submitType: 'upload' }))}
                className="justify-start"
              >
                <Upload className="h-4 w-4 mr-1" />
                {t('repository.form.upload_zip', '上传')}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Git仓库表单 */}
          {formData.submitType === 'git' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">{t('repository.form.repo_address')}</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder={t('repository.form.repo_address_placeholder')}
                    value={formData.address || ''}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    className="pl-10"
                    disabled={disabledFields.includes('address')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="branch">{t('repository.form.branch')}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchBranches()}
                    disabled={loadingBranches || !formData.address}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loadingBranches ? 'animate-spin' : ''}`} />
                    {t('repository.form.load_branches', '加载分支')}
                  </Button>
                </div>
                
                {branches.length > 0 ? (
                  <Select 
                    value={formData.branch} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('repository.form.branch_placeholder', '选择分支')} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative">
                    <GitBranch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="branch"
                      placeholder={t('repository.form.branch_input_placeholder', '请输入分支名称')}
                      value={formData.branch || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                      className="pl-10"
                      disabled={disabledFields.includes('branch')}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enableGitAuth"
                  checked={formData.enableGitAuth}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableGitAuth: checked }))}
                />
                <Label htmlFor="enableGitAuth" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t('repository.form.enable_auth')}
                </Label>
              </div>

              {formData.enableGitAuth && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="gitUserName">{t('repository.form.git_username')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="gitUserName"
                          placeholder={t('repository.form.git_username_placeholder')}
                          value={formData.gitUserName || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, gitUserName: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gitPassword">{t('repository.form.git_password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="gitPassword"
                          type="password"
                          placeholder={t('repository.form.git_password_placeholder')}
                          value={formData.gitPassword || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, gitPassword: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('repository.form.git_token_tip')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 自定义仓库表单 */}
          {formData.submitType === 'custom' && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  请填写自定义仓库的详细信息，包括组织名、仓库名、Git地址等。
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="organization">组织名称</Label>
                <Input
                  id="organization"
                  placeholder="请输入组织名称"
                  value={formData.organization || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repositoryName">仓库名称</Label>
                <Input
                  id="repositoryName"
                  placeholder="请输入仓库名称"
                  value={formData.repositoryName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, repositoryName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customAddress">仓库地址</Label>
                <div className="relative">
                  <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customAddress"
                    placeholder="https://github.com/user/repo.git"
                    value={formData.address || ''}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customBranch">分支</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchBranches()}
                    disabled={loadingBranches || !formData.address}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loadingBranches ? 'animate-spin' : ''}`} />
                    加载分支
                  </Button>
                </div>
                
                {branches.length > 0 ? (
                  <Select 
                    value={formData.branch} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分支" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="relative">
                    <GitBranch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customBranch"
                      placeholder="请输入分支名称"
                      value={formData.branch || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="customUserName">Git用户名（可选）</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customUserName"
                      placeholder="Git用户名"
                      value={formData.gitUserName || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, gitUserName: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">私有仓库需要提供用户名</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customPassword">Git密码/令牌（可选）</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customPassword"
                      type="password"
                      placeholder="Git密码或访问令牌"
                      value={formData.gitPassword || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, gitPassword: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">私有仓库需要提供密码或访问令牌</p>
                </div>
              </div>
            </div>
          )}

          {/* 压缩包上传表单 */}
          {formData.submitType === 'upload' && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {t('repository.form.upload_info')} 支持格式：zip、gz、tar、br
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="uploadOrg">{t('repository.form.org_name')}</Label>
                <Input
                  id="uploadOrg"
                  placeholder={t('repository.form.org_name_placeholder')}
                  value={formData.organization || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uploadRepo">{t('repository.form.repo_name')}</Label>
                <Input
                  id="uploadRepo"
                  placeholder={t('repository.form.repo_name_placeholder')}
                  value={formData.repositoryName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, repositoryName: e.target.value }))}
                />
              </div>

              {/* 上传方式选择 */}
              <div className="space-y-2">
                <Label>上传方式</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={formData.uploadMethod === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, uploadMethod: 'file' }))}
                    className="justify-start"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    选择文件
                  </Button>
                  <Button
                    variant={formData.uploadMethod === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, uploadMethod: 'url' }))}
                    className="justify-start"
                  >
                    <Link className="h-4 w-4 mr-1" />
                    从URL下载
                  </Button>
                </div>
              </div>

              {/* 文件上传 */}
              {formData.uploadMethod === 'file' && (
                <div className="space-y-2">
                  <Label htmlFor="fileUpload">选择压缩包文件</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    accept=".zip,.gz,.tar,.br,.7z,.rar"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData(prev => ({ ...prev, file }));
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    支持的文件格式：zip、gz、tar、br、7z、rar，最大100MB
                  </p>
                </div>
              )}

              {/* URL下载 */}
              {formData.uploadMethod === 'url' && (
                <div className="space-y-2">
                  <Label htmlFor="fileUrl">{t('repository.form.zip_url', '压缩包URL')}</Label>
                  <div className="relative">
                    <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fileUrl"
                      placeholder={t('repository.form.zip_url_placeholder', 'https://github.com/user/repo/archive/refs/heads/main.zip')}
                      value={formData.fileUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, fileUrl: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('repository.form.url_tip', '支持的压缩包格式：zip、gz、tar、br')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {t('repository.form.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {getIcon()}
            <span className="ml-2">{t('repository.form.submit')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RepositoryForm;