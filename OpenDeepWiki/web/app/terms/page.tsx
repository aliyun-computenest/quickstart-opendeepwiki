'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { marked } from 'marked';
import { useEffect, useState } from 'react';

const termsContent = `# OpenDeepWiki 服务条款

*最后更新日期: 2025年5月13号

## 1. 接受条款

欢迎使用 OpenDeepWiki（以下简称"我们"、"本平台"）。通过访问或使用我们的服务，您同意受本服务条款的约束。如果您不同意这些条款，请不要使用我们的服务。

## 2. 服务说明

OpenDeepWiki 是一个基于 .NET 9 和 Semantic Kernel 开发的开源知识库平台，提供以下服务：
- 代码仓库分析
- 文档生成
- 知识库管理
- API 文档生成

## 3. 用户责任

### 3.1 账户安全
- 保护您的账户信息和访问凭证
- 对账户下的所有活动负责
- 发现未授权使用时立即通知我们

### 3.2 使用规范
您同意：
- 不进行任何违法或滥用行为
- 不上传恶意代码或有害内容
- 不侵犯他人知识产权
- 不干扰平台正常运行
- 遵守相关法律法规

## 4. 知识产权

### 4.1 平台知识产权
- 平台源代码采用开源协议
- 平台品牌、标识等归我们所有
- 用户不得擅自使用我们的知识产权

### 4.2 用户内容
- 用户保留其上传内容的知识产权
- 授予我们必要的使用权限
- 确保上传内容不侵犯他人权益

## 5. 服务可用性

### 5.1 服务变更
我们保留以下权利：
- 修改或终止服务
- 增加或移除功能
- 调整使用限制
- 变更服务条款

### 5.2 服务中断
- 可能因维护或升级暂时中断
- 不保证服务永久可用
- 对服务中断不承担责任

## 6. 免责声明

### 6.1 服务保证
- 服务"按现状"提供
- 不提供任何明示或暗示的保证
- 不保证满足特定需求

### 6.2 责任限制
我们不对以下情况负责：
- 直接或间接损失
- 数据丢失
- 第三方行为
- 不可抗力因素

## 7. 费用和支付

### 7.1 免费服务
- 基础功能免费使用
- 可能推出付费增值服务
- 收费标准另行公布

### 7.2 退款政策
- 付费服务的退款政策
- 争议解决方式
- 计费周期说明

## 8. 终止服务

### 8.1 用户终止
- 随时停止使用服务
- 删除账户的方式
- 数据处理说明

### 8.2 平台终止
我们可能在以下情况终止服务：
- 违反服务条款
- 滥用平台资源
- 从事违法活动
- 平台停止运营

## 9. 通知和通信

- 通过电子邮件发送通知
- 在网站发布公告
- 其他合理的通信方式

## 10. 法律适用

- 适用中华人民共和国法律
- 争议解决方式
- 管辖权约定

## 11. 条款修改

我们可能随时修改本服务条款。修改后的条款将在网站上公布，继续使用服务即表示同意修改后的条款。

## 12. 联系我们

如有问题或建议，请联系：
- 电子邮件：239573049@qq.com
- GitHub Issues：https://github.com/AIDotNet/OpenDeepWiki/issues

## 13. 其他条款

- 条款可分割性
- 完整协议
- 权利放弃
- 条款解释`;

export default function TermsOfServicePage() {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const processMarkdown = async () => {
      const html = await marked.parse(termsContent);
      setHtmlContent(html);
    }
    processMarkdown();  
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-4xl p-6">
        <Card className="rounded-xl shadow-lg">
          <CardContent className="p-6">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/" className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      首页
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>服务条款</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div
              className="markdown-content prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 