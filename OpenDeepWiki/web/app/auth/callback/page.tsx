'use client'

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { githubLogin } from '../../services/authService';
import { useToast } from '@/components/ui/use-toast';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // 获取URL参数
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');
        const idToken = searchParams.get('id_token'); // Google可能返回id_token
        const accessToken = searchParams.get('access_token'); // Google也可能返回access_token

        // 检查是否有错误
        if (error) {
          throw new Error(`OAuth授权失败: ${error}`);
        }

        // 获取之前保存的登录类型 - 添加客户端检查
        const oauthProvider = typeof window !== 'undefined' ? localStorage.getItem('oauthProvider') : null;
        
        if (!oauthProvider) {
          throw new Error('未找到OAuth提供商信息，请重新登录');
        }

        // 根据登录类型调用不同的API
        if (oauthProvider === 'github') {
          if (!code) {
            throw new Error('GitHub授权码缺失');
          }
          const {data
          } = await githubLogin(code) as any;

          const {
            errorMessage,
            refreshToken,
            success,
            token,
            user
          } = data;
          // 登录成功 - 添加客户端检查
          if (typeof window !== 'undefined') {
            localStorage.setItem('userToken', token);
            localStorage.setItem('refreshToken', refreshToken);
            
            if (user) {
              localStorage.setItem('userInfo', JSON.stringify(user));
            }

            // 清除OAuth提供商信息
            localStorage.removeItem('oauthProvider');
          }

          setStatus('success');
          toast({
            title: "登录成功！",
            description: "正在跳转到主页面...",
          });

          // 延迟跳转
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              const redirectPath = localStorage.getItem('redirectPath') || '/admin';
              localStorage.removeItem('redirectPath');
              router.push(redirectPath);
            }
          }, 1500);

        } 

      } catch (error) {
        console.error('OAuth回调处理错误:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : '未知错误');
        toast({
          title: "登录失败",
          description: error instanceof Error ? error.message : '未知错误',
          variant: "destructive",
        });
      }
    };

    handleOAuthCallback();
  }, [searchParams, router]);

  const handleRetry = () => {
    // 清除OAuth提供商信息并返回登录页 - 添加客户端检查
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oauthProvider');
    }
    router.push('/login');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">正在处理登录</h3>
              <p className="text-sm text-muted-foreground">
                请稍候，正在验证您的身份...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">登录成功！</h3>
                <p className="text-sm text-muted-foreground">
                  正在跳转到主页面...
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/admin')}
              className="w-full"
            >
              立即跳转
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">登录失败</h3>
                <p className="text-sm text-muted-foreground">
                  {errorMessage || '登录过程中发生错误，请重试'}
                </p>
              </div>
            </div>
            <div className="flex flex-col w-full space-y-3">
              <Button onClick={handleRetry} className="w-full">
                重新登录
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

// 加载中的回退组件
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">正在加载</h3>
            <p className="text-sm text-muted-foreground">
              请稍候...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OAuthCallbackContent />
    </Suspense>
  );
} 