"use client"

import { Card } from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import Link from "next/link"
import { marked } from "marked"
import { useEffect, useState } from "react"

const privacyContent = `# OpenDeepWiki 隐私政策

*最后更新日期: 2025年5月13号*

## 1. 引言

欢迎使用 OpenDeepWiki（以下简称"我们"、"本平台"）。我们非常重视您的隐私保护，并致力于维护您对我们的信任。本隐私政策旨在帮助您了解我们如何收集、使用和保护您的个人信息。

## 2. 信息收集

### 2.1 我们收集的信息
- **账户信息**: 当您使用 GitHub 账户登录时，我们会收集您的 GitHub 用户名和公开信息
- **仓库信息**: 您添加到平台的代码仓库地址、描述等信息
- **使用数据**: 包括访问日志、IP地址、浏览器类型、设备信息等
- **Cookie 数据**: 用于改善用户体验和网站功能

### 2.2 信息收集方式
- 您主动提供的信息
- 自动收集的技术数据
- 通过 GitHub API 获取的公开信息

## 3. 信息使用

我们收集的信息将用于：
- 提供和维护平台服务
- 处理您的仓库分析请求
- 改善用户体验
- 发送服务相关通知
- 防止滥用和非法使用
- 进行数据分析和研究

## 4. 信息共享

我们承诺：
- 不会出售您的个人信息
- 仅在必要情况下与第三方服务提供商共享信息（如托管服务）
- 可能根据法律要求披露信息

## 5. 信息安全

我们采取以下措施保护您的信息：
- 使用加密技术保护数据传输
- 实施访问控制机制
- 定期安全审查
- 数据备份和恢复机制

## 6. 您的权利

您拥有以下权利：
- 访问您的个人信息
- 更正不准确的信息
- 删除您的账户和相关数据
- 选择退出某些数据收集
- 导出您的数据

## 7. Cookie 使用

我们使用 Cookie 来：
- 维持您的登录状态
- 记住您的偏好设置
- 收集使用统计数据
- 提供个性化体验

## 8. 第三方服务

本平台使用以下第三方服务：
- GitHub API
- 百度统计
- Azure OpenAI 服务

## 9. 未成年人保护

我们不会故意收集未满 14 周岁未成年人的个人信息。如果发现误收集了此类信息，我们会及时删除。

## 10. 隐私政策更新

我们可能会不时更新本隐私政策。更新后的政策将在本页面上发布，重大变更将通过适当方式通知您。

## 11. 联系我们

如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：
- 电子邮件：239573049@qq.com
- GitHub Issues：https://github.com/AIDotNet/OpenDeepWiki/issues

## 12. 法律声明

本隐私政策受中华人民共和国法律管辖。在法律允许的范围内，我们保留对本政策进行解释和修改的权利。`;

export default function PrivacyPolicyPage() {
  const [htmlContent, setHtmlContent] = useState("")

  useEffect(() => {
    const processMarkdown = async () => {
      const html = await marked.parse(privacyContent)
      setHtmlContent(html)
    }
    processMarkdown()
  }, [])

  return (
    <div className="bg-background min-h-screen py-6">
      <div className="container mx-auto max-w-4xl space-y-6 px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="inline-flex items-center gap-1">
                  <Home className="h-4 w-4" /> 首页
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>隐私政策</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card className="p-6">
          <div
            className="prose max-w-none text-sm leading-7"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </Card>
      </div>
    </div>
  )
} 