# OpenDeepWiki 前端

<div align="center">

![OpenDeepWiki Logo](https://opendeep.wiki/logo.png)

**AI驱动的代码知识库前端应用**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.24.8-blue?style=flat-square&logo=ant-design)](https://ant.design/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.7-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

[在线体验](https://opendeep.wiki) · [文档](https://github.com/AIDotNet/OpenDeepWiki) · [问题反馈](https://github.com/AIDotNet/OpenDeepWiki/issues)

</div>

## 📖 项目简介

OpenDeepWiki 前端是一个基于 Next.js 15 和 React 19 构建的现代化 Web 应用，为 OpenDeepWiki AI 驱动的代码知识库提供用户界面。该项目参考 DeepWiki 作为灵感，旨在帮助开发者更好地理解和使用代码库，提供代码分析、文档生成等功能。

## ✨ 核心特性

### 🚀 技术特性
- **现代化技术栈**: 基于 Next.js 15 + React 19 + TypeScript
- **服务端渲染**: 支持 SSR/SSG，优化 SEO 和首屏加载
- **国际化支持**: 支持 18 种语言，覆盖全球主要地区
- **响应式设计**: 完美适配桌面端和移动端
- **组件化架构**: 基于 shadcn/ui 构建的现代化 UI

### 🎯 功能特性
- **快速转换**: 几分钟内将任何代码仓库转换为智能知识库
- **多语言支持**: 支持所有主流编程语言的代码分析
- **代码结构图**: 自动生成 Mermaid 图表，直观理解代码架构
- **AI 智能分析**: 基于 AI 的代码分析和关系理解
- **实时搜索**: 智能搜索功能，快速定位所需内容
- **文档编辑**: 支持 Markdown 编辑和实时预览
- **MCP 协议**: 支持 Model Context Protocol 集成

### 🌍 国际化支持
支持以下 18 种语言：
- 🇨🇳 中文（简体/繁体）
- 🇺🇸 英语（美国）
- 🇯🇵 日语
- 🇰🇷 韩语
- 🇩🇪 德语
- 🇫🇷 法语
- 🇪🇸 西班牙语
- 🇮🇹 意大利语
- 🇵🇹 葡萄牙语
- 🇷🇺 俄语
- 🇸🇦 阿拉伯语
- 🇮🇳 印地语
- 🇳🇱 荷兰语
- 🇹🇷 土耳其语
- 🇻🇳 越南语
- 🇮🇩 印尼语
- 🇹🇭 泰语

## 🛠️ 技术栈

### 核心框架
- **[Next.js 15.3.1](https://nextjs.org/)** - React 全栈框架
- **[React 19.1.0](https://reactjs.org/)** - 用户界面库
- **[TypeScript 5.8.3](https://www.typescriptlang.org/)** - 类型安全的 JavaScript

### UI 组件库
- **[shadcn/ui](https://ui.shadcn.com/)** - 现代化组件库
- **[Tailwind CSS 4.1.7](https://tailwindcss.com/)** - 原子化 CSS 框架
- **[Framer Motion 11.18.2](https://www.framer.com/motion/)** - 动画库
- **[Lucide React 0.511.0](https://lucide.dev/)** - 图标库

### 文档处理
- **[React Markdown 9.1.0](https://github.com/remarkjs/react-markdown)** - Markdown 渲染
- **[MD Editor RT 5.6.0](https://github.com/imzbf/md-editor-rt)** - Markdown 编辑器
- **[Mermaid 11.6.0](https://mermaid.js.org/)** - 图表生成
- **[React Syntax Highlighter 15.6.1](https://github.com/react-syntax-highlighter/react-syntax-highlighter)** - 代码高亮

### 国际化
- **[i18next 25.2.0](https://www.i18next.com/)** - 国际化框架
- **[react-i18next 15.5.1](https://react.i18next.com/)** - React 国际化
- **[next-i18next 15.4.2](https://github.com/i18next/next-i18next)** - Next.js 国际化

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm、yarn、pnpm 或 bun 包管理器

### 安装依赖

```bash
# 使用 npm
npm install

# 使用 yarn
yarn install

# 使用 pnpm
pnpm install

# 使用 bun
bun install
```

### 环境配置

创建 `.env.local` 文件并配置环境变量：

```env
# API 基础地址
API_BASE_URL=http://localhost:5085
NEXT_PUBLIC_API_URL=http://localhost:5085

# 网站配置
NEXT_PUBLIC_SITE_URL=https://opendeep.wiki

# 百度统计（可选）
NEXT_PUBLIC_BAIDU_ANALYTICS_ID=your_baidu_analytics_id
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 或使用其他包管理器
yarn dev
pnpm dev
bun dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 📁 项目结构

```
web/
├── app/                          # Next.js App Router
│   ├── [owner]/                  # 动态路由 - 仓库所有者
│   │   └── [name]/               # 动态路由 - 仓库名称
│   │       ├── [path]/           # 动态路由 - 文档路径
│   │       └── changelog/        # 更新日志页面
│   ├── admin/                    # 管理后台
│   │   ├── components/           # 管理组件
│   │   ├── repositories/         # 仓库管理
│   │   ├── settings/             # 系统设置
│   │   └── users/                # 用户管理
│   ├── components/               # 全局组件
│   │   ├── document/             # 文档相关组件
│   │   ├── HomeClient.tsx        # 首页客户端组件
│   │   ├── RepositoryCard.tsx    # 仓库卡片组件
│   │   ├── LanguageSwitcher.tsx  # 语言切换组件
│   │   └── ...                   # 其他组件
│   ├── i18n/                     # 国际化配置
│   │   ├── locales/              # 语言文件
│   │   ├── settings.ts           # i18n 设置
│   │   └── server.ts             # 服务端 i18n
│   ├── services/                 # API 服务
│   ├── types/                    # TypeScript 类型定义
│   ├── login/                    # 登录页面
│   ├── register/                 # 注册页面
│   ├── search/                   # 搜索页面
│   ├── settings/                 # 用户设置
│   ├── privacy/                  # 隐私政策
│   ├── terms/                    # 服务条款
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 首页
│   └── globals.css               # 全局样式
├── public/                       # 静态资源
│   ├── locales/                  # 国际化语言包
│   │   ├── zh-CN/                # 简体中文
│   │   ├── en-US/                # 英语
│   │   ├── zh-TW/                # 繁体中文
│   │   └── ...                   # 其他语言
│   └── ...                       # 其他静态文件
├── components/                   # 共享组件（如果有）
├── styles/                       # 样式文件
├── next.config.js                # Next.js 配置
├── tailwind.config.js            # Tailwind CSS 配置
├── tsconfig.json                 # TypeScript 配置
├── package.json                  # 项目依赖
└── README.md                     # 项目文档
```

## 🎨 主要组件

### 核心页面组件
- **HomeClient**: 首页主要内容，包含仓库列表和搜索功能
- **RepositoryCard**: 仓库信息卡片，展示仓库基本信息和状态
- **DocumentToc**: 文档目录组件，提供文档导航
- **LanguageSwitcher**: 语言切换组件，支持 18 种语言

### 功能组件
- **MarkdownEditor**: Markdown 编辑器，支持实时预览
- **DirectoryTree**: 目录树组件，展示文档结构
- **RepositoryForm**: 仓库添加/编辑表单

## 🌐 国际化

项目使用 i18next 实现国际化，支持以下功能：

- **自动语言检测**: 根据浏览器语言自动选择
- **动态语言切换**: 无需刷新页面即可切换语言
- **SEO 优化**: 支持多语言 SEO 元数据
- **RTL 支持**: 支持阿拉伯语等从右到左的语言

### 添加新语言

1. 在 `public/locales/` 目录下创建新的语言文件夹
2. 复制现有语言文件并翻译内容
3. 在 `app/i18n/settings.ts` 中添加新语言代码
4. 在 `app/layout.tsx` 中添加对应的 Ant Design 语言包

## 🐳 Docker 部署

项目提供了完整的 Docker 支持：

```bash
# 构建 Docker 镜像
docker build -t opendeepwiki-web .

# 运行容器
docker run -p 3000:3000 opendeepwiki-web
```

### Docker Compose

```yaml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_BASE_URL=http://api:5085
      - NEXT_PUBLIC_API_URL=http://localhost:5085
    depends_on:
      - api
```

## 🔧 配置说明

### Next.js 配置

```javascript
// next.config.js
const nextConfig = {
  output: 'standalone',           // 独立输出模式
  reactStrictMode: true,          // React 严格模式
  transpilePackages: [            // 需要转译的包
    'fumadocs-ui'
  ],
  async rewrites() {              // API 代理配置
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL}/api/:path*`,
      },
    ];
  },
};
```

### Tailwind CSS 配置

项目使用自定义的 Tailwind 配置，包含：
- 自定义颜色主题
- 响应式断点
- 组件样式扩展

## 📊 性能优化

### 构建优化
- **代码分割**: 自动按路由分割代码
- **图片优化**: 使用 Next.js Image 组件
- **字体优化**: 自动优化 Google Fonts
- **Bundle 分析**: 支持 bundle 大小分析

### 运行时优化
- **服务端渲染**: 提升首屏加载速度
- **静态生成**: 预生成静态页面
- **缓存策略**: 合理的缓存配置
- **懒加载**: 组件和图片懒加载

## 🧪 开发指南

### 代码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 使用 Prettier 格式化代码
- 组件采用函数式组件 + Hooks

### 提交规范
```bash
# 功能开发
git commit -m "feat: 添加新功能"

# 问题修复
git commit -m "fix: 修复某个问题"

# 文档更新
git commit -m "docs: 更新文档"

# 样式调整
git commit -m "style: 调整样式"
```

### 测试
```bash
# 运行 ESLint 检查
npm run lint

# 类型检查
npx tsc --noEmit

# 构建测试
npm run build
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 贡献类型
- 🐛 Bug 修复
- ✨ 新功能开发
- 📝 文档改进
- 🌍 国际化翻译
- 🎨 UI/UX 改进
- ⚡ 性能优化

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

### 赞助商
- **[AntSK](https://antsk.cn/)** - 大模型企业 AI 解决方案
- **[302.AI](https://302.ai/)** - AI 应用开发平台

### 开源项目
- [Next.js](https://nextjs.org/) - React 全栈框架
- [Ant Design](https://ant.design/) - 企业级 UI 设计语言
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架
- [i18next](https://www.i18next.com/) - 国际化框架

## 📞 联系我们

- **项目主页**: [https://opendeep.wiki](https://opendeep.wiki)
- **GitHub**: [https://github.com/AIDotNet/OpenDeepWiki](https://github.com/AIDotNet/OpenDeepWiki)
- **问题反馈**: [GitHub Issues](https://github.com/AIDotNet/OpenDeepWiki/issues)
- **邮箱**: 239573049@qq.com

## 管理后台角色权限控制

管理后台现在支持基于用户角色的菜单权限控制。

### 使用方法

1. 在localStorage中存储用户信息：
```javascript
// 管理员用户
localStorage.setItem('userInfo', JSON.stringify({
  role: 'admin',
  name: '管理员',
  // 其他用户信息...
}));

// 普通用户
localStorage.setItem('userInfo', JSON.stringify({
  role: 'user',
  name: '普通用户',
  // 其他用户信息...
}));
```

2. 权限说明：
- **admin角色**：可以访问所有菜单项
  - 数据统计
  - 用户管理
  - 仓库管理
  - 微调数据
  - 系统管理

- **其他角色**：只能访问受限菜单
  - 数据统计
  - 微调数据

### 测试

可以在浏览器控制台中运行以下代码来测试不同角色：

```javascript
// 设置为管理员
localStorage.setItem('userInfo', JSON.stringify({ role: 'admin' }));
location.reload();

// 设置为普通用户
localStorage.setItem('userInfo', JSON.stringify({ role: 'user' }));
location.reload();
```

---

<div align="center">

**如果这个项目对你有帮助，请给我们一个 ⭐️**

Made with ❤️ by OpenDeepWiki Team

</div>
