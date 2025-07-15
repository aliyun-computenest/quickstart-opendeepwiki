'use client'
import { useState } from 'react';
import {
  Save,
  Globe,
  Mail,
  Shield,
  Cloud,
  Upload,
  Settings as SettingsIcon
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');

  // 表单数据状态
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'OpenDeepWiki',
    siteDescription: '开源的知识库平台',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    homePage: 'dashboard',
    enableRegistration: true,
    requireEmailVerification: true
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: '',
    fromName: ''
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPassword: true,
    enableTwoFactor: false,
    allowedDomains: ''
  });

  const [storageSettings, setStorageSettings] = useState({
    storageType: 'local',
    maxFileSize: 10,
    allowedFileTypes: 'pdf,doc,docx,txt,md',
    s3Bucket: '',
    s3Region: '',
    s3AccessKey: '',
    s3SecretKey: ''
  });

  // 处理表单提交
  const handleFormSubmit = (formType: string) => {
    toast({
      title: "成功",
      description: "设置已保存",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-3">
          <SettingsIcon className="h-6 w-6" />
          系统设置
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          配置系统的基本设置和参数
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            常规设置
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            邮件设置
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            安全设置
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            存储设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>常规设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  这些设置将影响整个系统的基本行为
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="siteName">网站名称</Label>
                  <Input
                    id="siteName"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                    placeholder="网站名称"
                  />
                </div>

                <div>
                  <Label htmlFor="siteDescription">网站描述</Label>
                  <Input
                    id="siteDescription"
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({...generalSettings, siteDescription: e.target.value})}
                    placeholder="网站描述"
                  />
                </div>

                <div>
                  <Label htmlFor="language">默认语言</Label>
                  <Select value={generalSettings.language} onValueChange={(value) => setGeneralSettings({...generalSettings, language: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择默认语言" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="en-US">英文</SelectItem>
                      <SelectItem value="zh-TW">繁体中文</SelectItem>
                      <SelectItem value="ja">日文</SelectItem>
                      <SelectItem value="ko">韩文</SelectItem>
                      <SelectItem value="fr">法文</SelectItem>
                      <SelectItem value="de">德文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">时区</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings({...generalSettings, timezone: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择时区" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableRegistration"
                    checked={generalSettings.enableRegistration}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, enableRegistration: checked})}
                  />
                  <Label htmlFor="enableRegistration">允许用户注册</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requireEmailVerification"
                    checked={generalSettings.requireEmailVerification}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, requireEmailVerification: checked})}
                  />
                  <Label htmlFor="requireEmailVerification">需要邮箱验证</Label>
                </div>
              </div>

              <Button onClick={() => handleFormSubmit('general')} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                保存设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>邮件设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  配置SMTP服务器以发送系统邮件
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP服务器</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                    placeholder="smtp.example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="smtpPort">端口</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: parseInt(e.target.value)})}
                    placeholder="587"
                  />
                </div>

                <div>
                  <Label htmlFor="smtpUser">用户名</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                    placeholder="用户名"
                  />
                </div>

                <div>
                  <Label htmlFor="smtpPassword">密码</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                    placeholder="密码"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="smtpSecure"
                  checked={emailSettings.smtpSecure}
                  onCheckedChange={(checked) => setEmailSettings({...emailSettings, smtpSecure: checked})}
                />
                <Label htmlFor="smtpSecure">启用SSL/TLS</Label>
              </div>

              <Button onClick={() => handleFormSubmit('email')} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                保存设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>安全设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  配置系统安全策略和访问控制
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionTimeout">会话超时（分钟）</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                    placeholder="30"
                  />
                </div>

                <div>
                  <Label htmlFor="maxLoginAttempts">最大登录尝试次数</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requireStrongPassword"
                  checked={securitySettings.requireStrongPassword}
                  onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireStrongPassword: checked})}
                />
                <Label htmlFor="requireStrongPassword">要求强密码</Label>
              </div>

              <Button onClick={() => handleFormSubmit('security')} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                保存设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>存储设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  配置文件存储和上传设置
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="storageType">存储类型</Label>
                <Select value={storageSettings.storageType} onValueChange={(value) => setStorageSettings({...storageSettings, storageType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择存储类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">本地存储</SelectItem>
                    <SelectItem value="s3">Amazon S3</SelectItem>
                    <SelectItem value="oss">阿里云OSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maxFileSize">最大文件大小（MB）</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={storageSettings.maxFileSize}
                  onChange={(e) => setStorageSettings({...storageSettings, maxFileSize: parseInt(e.target.value)})}
                  placeholder="10"
                />
              </div>

              <Button onClick={() => handleFormSubmit('storage')} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                保存设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
