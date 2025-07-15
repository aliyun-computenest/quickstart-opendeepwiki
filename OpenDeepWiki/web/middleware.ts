import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(request: NextRequest) {
  // 创建响应对象
  const response = NextResponse.next()
  
  // 从cookie中获取token（常见的cookie名称有token、auth-token、access_token等）
  const token = request.cookies.get('token')?.value || 
                request.cookies.get('auth-token')?.value ||
                request.cookies.get('access_token')?.value ||
                request.cookies.get('accessToken')?.value

  // 如果找到token，将其添加到Authorization header中
  if (token) {
    // 创建新的请求头
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('Authorization', `Bearer ${token}`)
    
    // 创建带有新headers的响应
    const newResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
    // 保留原有的响应头
    response.headers.forEach((value, key) => {
      newResponse.headers.set(key, value)
    })
    
    return newResponse
  }

  return response
}

// 配置中间件匹配的路径
export const config = {
  // 匹配所有路径，但排除静态文件和Next.js内部路径
  matcher: [
    /*
     * 匹配所有请求路径，除了以下开头的路径：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 