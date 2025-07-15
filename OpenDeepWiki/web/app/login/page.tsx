'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GithubIcon, Loader2 } from 'lucide-react'
import { GoogleIcon } from '@/components/icons/GoogleIcon'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

import { login, getSupportedThirdPartyLogins } from '../services/authService'

interface ThirdPartyLoginProvider {
  name: string;
  icon: string;
  clientId: string;
  redirectUri: string;
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [thirdPartyProviders, setThirdPartyProviders] = useState<ThirdPartyLoginProvider[]>([])

  // 获取支持的第三方登录方式
  useEffect(() => {
    const fetchThirdPartyProviders = async () => {
      try {
        const response = await getSupportedThirdPartyLogins()
        if (response.code === 200 && response.data) {
          setThirdPartyProviders(response.data)
        }
      } catch (error) {
        console.error('获取第三方登录方式失败:', error)
      }
    }

    fetchThirdPartyProviders()
  }, [])

  // 处理登录
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const formData = new FormData(event.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string
    // 如果需要“记住我”功能，可在此处处理

    try {
      setLoading(true)

      // 调用登录API
      const { data } = await login(username, password)
      if (data.success) {
        // 登录成功
        // 保存登录状态
        localStorage.setItem('userToken', data.token)
        localStorage.setItem('refreshToken', data.refreshToken)

        // 保存用户信息
        if (data.user) {
          localStorage.setItem('userInfo', JSON.stringify(data.user))
        }

        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
          // 检查是否有上一个页面的路径（比如从管理页面重定向来的）
          const redirectPath = localStorage.getItem('redirectPath') || '/admin'
          localStorage.removeItem('redirectPath') // 清除重定向路径
          toast.success('登录成功')
          router.push(redirectPath)
        }, 1000)
      } else {
        // 登录失败
        toast.error(data.errorMessage || '用户名或密码错误')
      }
    } catch (error) {
      console.error('登录错误:', error)
      toast.error('登录过程中发生错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理第三方登录
  const handleThirdPartyLogin = (providerName: string) => {
    // 记录登录类型
    localStorage.setItem('oauthProvider', providerName.toLowerCase())
    
    // 根据提供商名称构建OAuth URL
    if (providerName.toLowerCase() === 'github') {
      const provider = thirdPartyProviders.find(p => p.name === 'GitHub')
      if (provider) {
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${provider.clientId}&redirect_uri=${window.location.origin}/auth/callback`
      }
    } else if (providerName.toLowerCase() === 'google') {
      const provider = thirdPartyProviders.find(p => p.name === 'Google')
      if (provider) {
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${provider.clientId}&redirect_uri=${window.location.origin}/auth/callback`
      }
    }
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-6">
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">登录 OpenDeepWiki</CardTitle>
              <CardDescription>
                欢迎回来，请登录您的账户
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                  {thirdPartyProviders.length > 0 && (
                    <div className="flex flex-col gap-4">
                      {thirdPartyProviders.map((provider) => (
                        provider.name.toLowerCase() === 'github' ? (
                          <Button
                            key={provider.name}
                            variant="outline"
                            className="w-full"
                            type="button"
                            onClick={() => handleThirdPartyLogin('github')}
                          >
                            <GithubIcon className="mr-2 h-4 w-4" />
                            使用 GitHub 登录
                          </Button>
                        ) : provider.name.toLowerCase() === 'google' ? (
                          <Button
                            key={provider.name}
                            variant="outline"
                            className="w-full"
                            type="button"
                            onClick={() => handleThirdPartyLogin('google')}
                          >
                            <GoogleIcon className="mr-2 h-4 w-4" />
                            使用 Google 登录
                          </Button>
                        ) : null
                      ))}
                    </div>
                  )}
                  
                  {thirdPartyProviders.length > 0 && (
                    <div className="relative text-center text-sm before:absolute before:inset-0 before:top-1/2 before:z-0 before:flex before:items-center before:border-t before:border-border">
                      <span className="bg-card relative z-10 px-2 text-muted-foreground">
                        或者使用账号密码
                      </span>
                    </div>
                  )}
                  
                  <div className="grid gap-6">
                    <div className="grid gap-3">
                      <Label htmlFor="username">用户名/邮箱</Label>
                      <Input
                        id="username"
                        name="username"
                        placeholder="请输入用户名或邮箱"
                        required
                      />
                    </div>
                    <div className="grid gap-3">
                      <div className="flex items-center">
                        <Label htmlFor="password">密码</Label>
                        <Link
                          href="/forgot-password"
                          className="ml-auto text-sm text-primary hover:underline underline-offset-4"
                        >
                          忘记密码?
                        </Link>
                      </div>
                      <Input 
                        id="password" 
                        name="password" 
                        type="password" 
                        placeholder="请输入密码"
                        required 
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" name="remember" />
                      <Label htmlFor="remember" className="text-sm font-normal">
                        记住我
                      </Label>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {loading ? '登录中...' : '登录'}
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    还没有账户?{" "}
                    <Link href="/register" className="text-primary hover:underline underline-offset-4">
                      立即注册
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 