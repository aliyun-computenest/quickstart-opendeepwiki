export interface Repository {
  id: string | null;
  name: string;
  description: string;
  address: string;
  type: string;
  branch: string;
  /**
   * Repository status:
   * 0 = Pending (待处理)
   * 1 = Processing (处理中)
   * 2 = Completed (已完成)
   * 3 = Canceled (已取消)
   * 4 = Unauthorized (未授权)
   * 99 = Failed (已失败)
   */
  status: number;
  prompt: string;
  version: string;
  isRecommended: boolean;
  createdAt: string;
  updatedAt?: string;
  error?:string;
  organizationName: string;
  success: boolean;
  stars: number;
  forks: number;
  avatarUrl: string;
  ownerUrl: string;
  repoUrl: string;
  language?: string;
  license?: string;
}

export interface RepositoryFormValues {
  address: string;
  type: string;
  branch: string;
  submitType:string;
  enableGitAuth:boolean;
  uploadMethod:string;
  repositoryName?:string;
  organization?:string;
  gitPassword?:string;
  gitUserName?:string;
  file?:any;
  fileUrl?:string;
} 