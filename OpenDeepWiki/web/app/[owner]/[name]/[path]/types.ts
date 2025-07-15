// 文档数据类型
export interface DocumentData {
  id: string;
  title: string;
  content: string;
  description?: string;
  fileSource?: SourceFile[];
  branch: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
  lastUpdate?: any;
}

// 文件源类型 - 匹配SourceFiles组件的接口
export interface SourceFile {
  documentFileItemId: string;
  address: string;
  name: string;
  documentFileItem: any;
  id: string;
  createdAt: string;
}

// 标题类型
export interface Heading {
  key: string;
  title: string;
  level: number;
  id: string;
}

// 锚点项类型
export interface AnchorItem {
  key: string;
  href: string;
  title: string;
  children: AnchorItem[];
}

// API响应类型
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  isSuccess?: boolean;
  message?: string;
}

// 文档页面属性类型
export interface DocumentPageProps {
  params: {
    owner: string;
    name: string;
    path: string;
  };
  searchParams: {
    branch?: string;
  };
}

// 客户端组件属性类型
export interface DocumentPageClientProps {
  document: DocumentData | null;
  error: string | null;
  headings: Heading[];
  anchorItems: AnchorItem[];
  owner: string;
  name: string;
  path: string;
  branch?: string;
} 