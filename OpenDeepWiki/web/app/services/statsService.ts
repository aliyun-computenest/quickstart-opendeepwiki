import { getGitHubRepoInfo } from './githubService';
import { getWarehouse } from './warehouseService';

/**
 * 首页统计数据接口
 */
export interface HomeStats {
  totalRepositories: number;
  totalStars: number;
  totalForks: number;
  openDeepWikiStars: number;
}

/**
 * 获取首页统计数据
 * @returns Promise<HomeStats>
 */
export async function getHomeStats(): Promise<HomeStats> {
  try {
    // 并行获取数据以提高性能
    const [repositoriesResponse, openDeepWikiInfo] = await Promise.all([
      // 获取所有仓库数据（用于统计）
      getWarehouse(1, 1000), // 获取足够多的数据用于统计
      // 获取OpenDeepWiki仓库的Star数量
      getGitHubRepoInfo('AIDotNet', 'OpenDeepWiki')
    ]);

    let totalRepositories = 0;
    let totalStars = 0;
    let totalForks = 0;

    if (repositoriesResponse.success && repositoriesResponse.data) {
      const repositories = repositoriesResponse.data.items;
      totalRepositories = repositoriesResponse.data.total;

      // 获取GitHub仓库的Star和Fork数量（仅限GitHub仓库）
      const githubRepos = repositories.filter(repo => 
        repo.address?.includes('github.com')
      );

      // 批量获取GitHub仓库信息（限制并发数量以避免API限制）
      const batchSize = 10;
      for (let i = 0; i < githubRepos.length; i += batchSize) {
        const batch = githubRepos.slice(i, i + batchSize);
        const batchPromises = batch.map(async (repo) => {
          try {
            // 解析GitHub仓库地址
            const url = new URL(repo.address);
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length >= 2) {
              const owner = pathParts[0];
              const name = pathParts[1].replace('.git', '');
              const repoInfo = await getGitHubRepoInfo(owner, name);
              if (repoInfo) {
                return {
                  stars: repoInfo.stargazers_count || 0,
                  forks: repoInfo.forks_count || 0
                };
              }
            }
          } catch (error) {
            console.warn(`Failed to get GitHub info for ${repo.address}:`, error);
          }
          return { stars: 0, forks: 0 };
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(result => {
          totalStars += result.stars;
          totalForks += result.forks;
        });

        // 添加延迟以避免GitHub API限制
        if (i + batchSize < githubRepos.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    return {
      totalRepositories,
      totalStars,
      totalForks,
      openDeepWikiStars: openDeepWikiInfo?.stargazers_count || 0
    };
  } catch (error) {
    console.error('Error fetching home stats:', error);
    // 返回默认值
    return {
      totalRepositories: 0,
      totalStars: 0,
      totalForks: 0,
      openDeepWikiStars: 0
    };
  }
}

/**
 * 获取简化的统计数据（仅包含基本信息，用于快速加载）
 * @returns Promise<Partial<HomeStats>>
 */
export async function getBasicHomeStats(): Promise<Partial<HomeStats>> {
  try {
    const [repositoriesResponse, openDeepWikiInfo] = await Promise.all([
      getWarehouse(1, 100), // 获取基本仓库信息
      getGitHubRepoInfo('AIDotNet', 'OpenDeepWiki')
    ]);

    let totalRepositories = 0;

    if (repositoriesResponse.success && repositoriesResponse.data) {
      totalRepositories = repositoriesResponse.data.total;
    }

    return {
      totalRepositories,
      openDeepWikiStars: openDeepWikiInfo?.stargazers_count || 0
    };
  } catch (error) {
    console.error('Error fetching basic home stats:', error);
    return {
      totalRepositories: 0,
      openDeepWikiStars: 0
    };
  }
} 