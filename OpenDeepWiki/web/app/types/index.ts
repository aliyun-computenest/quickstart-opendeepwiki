/**
 * 仓库表单值接口定义
 */
export interface RepositoryFormValues {
  address?: string;          // 仓库地址 (Git仓库)
  type?: string;             // 仓库类型
  branch?: string;           // 仓库分支
  enableGitAuth?: boolean;   // 是否启用Git认证
  gitUserName?: string;      // Git用户名 (私有仓库)
  gitPassword?: string;      // Git密码/令牌 (私有仓库)
  submitType?: 'git' | 'upload' | 'custom'; // 提交方式：Git仓库、上传压缩包或自定义
  organization?: string;     // 组织名称 (上传压缩包时)
  repositoryName?: string;   // 仓库名称 (上传压缩包时)
  uploadMethod?: 'file' | 'url'; // 上传方式：文件上传或URL下载
  fileUrl?: string;          // 压缩包URL地址 (URL下载时)
  file?: File;               // 上传的文件对象 (文件上传时)
  email?: string;            // 邮箱地址（可选）
}

/**
 * 仓库信息接口定义
 */
export interface Repository {
  id: string;
  owner?: string;            // 仓库所有者/组织（兼容旧版）
  organizationName: string;  // 仓库所有者/组织
  name: string;              // 仓库名称
  address?: string;          // 仓库地址
  type?: string;             // 仓库类型，如 git
  branch?: string;           // 分支名
  status: string | number;   // 仓库状态
  description?: string;      // 描述
  createdAt: string;         // 创建时间
  updatedAt?: string;        // 更新时间
  isEmbedded?: boolean;      // 是否为嵌入式仓库
  isRecommended?: boolean;   // 是否推荐
  error?: string;            // 错误信息
  prompt?: string;           // 提示信息
  version?: string;          // 版本
} 