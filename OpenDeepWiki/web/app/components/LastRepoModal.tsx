import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search,
  Github,
  GitBranch,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Lock,
  HelpCircle,
  Link,
  Copy,
  ExternalLink
} from 'lucide-react';
import { getLastWarehouse } from '../services/warehouseService';
import { Repository } from '../types';
import { useTranslation } from '../i18n/client';

interface LastRepoModalProps {
  open: boolean;
  onCancel: () => void;
}

const LastRepoModal: React.FC<LastRepoModalProps> = ({ open, onCancel }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [repository, setRepository] = useState<Repository | null>(null);
  const [searched, setSearched] = useState(false);
  const [addressError, setAddressError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) {
      setAddress('');
      setRepository(null);
      setSearched(false);
      setAddressError('');
    }
  }, [open]);

  const handleSearch = async () => {
    if (!address.trim()) {
      setAddressError(t('repository.last_repo.address_required', '请输入仓库地址'));
      return;
    }

    setAddressError('');
    setLoading(true);
    setSearched(false);
    
    try {
      const response = await getLastWarehouse(address);
      if (response.success && response.data) {
        setRepository(response.data);
        setSearched(true);
      } else {
        setRepository(null);
        setSearched(true);
      }
    } catch (error) {
      console.error('查询仓库出错:', error);
      setRepository(null);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAddress('');
    setRepository(null);
    setSearched(false);
    setAddressError('');
    onCancel();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusConfig = (status: number) => {
    const configs = {
      0: { 
        label: t('repository.status.pending', '待处理'), 
        icon: Clock, 
        variant: 'outline' as const 
      },
      1: { 
        label: t('repository.status.processing', '处理中'), 
        icon: Clock, 
        variant: 'default' as const 
      },
      2: { 
        label: t('repository.status.completed', '已完成'), 
        icon: CheckCircle, 
        variant: 'default' as const 
      },
      3: { 
        label: t('repository.status.cancelled', '已取消'), 
        icon: X, 
        variant: 'secondary' as const 
      },
      4: { 
        label: t('repository.status.unauthorized', '未授权'), 
        icon: Lock, 
        variant: 'outline' as const 
      },
      99: { 
        label: t('repository.status.failed', '已失败'), 
        icon: AlertCircle, 
        variant: 'destructive' as const 
      },
    };
    return configs[status as keyof typeof configs] || { 
      label: t('repository.status.unknown', '未知状态'), 
      icon: HelpCircle, 
      variant: 'outline' as const 
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4 py-6">
          <div className="text-center">
            <Skeleton className="h-8 w-8 mx-auto mb-3 rounded-full" />
            <p className="text-sm text-muted-foreground">
              {t('repository.last_repo.searching', '正在查询仓库信息...')}
            </p>
          </div>
        </div>
      );
    }

    if (searched && !repository) {
      return (
        <div className="py-8 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">
              {t('repository.last_repo.not_found_title', '未找到仓库信息')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('repository.last_repo.check_address', '请检查输入的仓库地址是否正确')}
            </p>
          </div>
        </div>
      );
    }

    if (searched && repository) {
      const statusConfig = getStatusConfig(repository.status);
      const StatusIcon = statusConfig.icon;
      
      return (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {t('repository.last_repo.result', '查询结果')}
              </CardTitle>
              <Badge variant={statusConfig.variant} className="gap-1">
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('repository.last_repo.repo_name', '仓库名称')}
                </label>
                <p className="font-medium">{repository.name}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('repository.last_repo.repo_address', '仓库地址')}
                </label>
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-sm font-mono bg-muted px-2 py-1 rounded text-muted-foreground truncate">
                    {repository.address}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(repository.address)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('repository.last_repo.repo_info', '仓库信息')}
                </label>
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Github className="w-3 h-3" />
                    {repository.type}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <GitBranch className="w-3 h-3" />
                    {repository.branch}
                  </Badge>
                </div>
              </div>
              
              {repository.error && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-destructive">
                    {t('repository.last_repo.error_info', '错误信息')}
                  </label>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <p className="text-sm text-destructive">{repository.error}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t('repository.last_repo.title', '查询仓库')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('repository.last_repo.address_label', '仓库地址')}
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('repository.last_repo.address_placeholder', '请输入您之前提交过的仓库地址')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            {addressError && (
              <p className="text-sm text-destructive">{addressError}</p>
            )}
          </div>
          
          {renderContent()}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('repository.form.cancel', '取消')}
          </Button>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                {t('repository.last_repo.searching', '查询中...')}
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                {t('repository.last_repo.search', '查询')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LastRepoModal;