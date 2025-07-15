/**
 * GitHub API服务
 * 提供从GitHub获取仓库信息的函数
 */

/**
 * GitHub仓库信息接口
 */
export interface GitHubRepoInfo {
  html_url: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
  owner: {
    avatar_url: string;
    html_url: string;
    login: string;
  };
  license?: {
    name: string;
  };
  default_branch: string;
  topics: string[];
  open_issues_count: number;
  visibility: string;
}

/**
 * 从GitHub获取仓库信息
 * 
 * @param owner 仓库所有者
 * @param name 仓库名称
 * @returns Promise<GitHubRepoInfo | null>
 */
export async function getGitHubRepoInfo(owner: string, name: string): Promise<GitHubRepoInfo | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // 如果有GitHub令牌，可以在这里添加授权头
        // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
      },
      // 添加缓存控制
      next: {
        revalidate: 3600 // 缓存1小时
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch GitHub repo: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub repo info:', error);
    return null;
  }
}

/**
 * 从GitHub获取仓库自述文件内容
 * 
 * @param owner 仓库所有者
 * @param name 仓库名称
 * @param branch 分支名称（默认为master）
 * @returns Promise<string | null>
 */
export async function getGitHubReadme(owner: string, name: string, branch: string = 'master'): Promise<string | null> {
  try {
    // 如果指定了分支，添加ref参数
    const branchParam = branch ? `?ref=${branch}` : '';
    const response = await fetch(`https://api.github.com/repos/${owner}/${name}/readme${branchParam}`, {
      headers: {
        'Accept': 'application/vnd.github.v3.html',
        // 如果有GitHub令牌，可以在这里添加授权头
        // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
      },
      // 添加缓存控制
      next: {
        revalidate: 3600 // 缓存1小时
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch GitHub readme: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching GitHub readme:', error);
    return null;
  }
}

/**
 * 检查GitHub仓库是否存在
 * 
 * @param owner 仓库所有者
 * @param name 仓库名称
 * @returns Promise<boolean>
 */
export async function checkGitHubRepoExists(owner: string, name: string, branch?: string): Promise<boolean> {
  try {
    const branchPath = branch ? `/branches/${branch}` : '';
    const response = await fetch(`https://api.github.com/repos/${owner}/${name}${branchPath}`, {
      method: 'HEAD',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
      next: {
        revalidate: 3600 // 缓存1小时
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error checking GitHub repo existence:', error);
    return false;
  }
} 