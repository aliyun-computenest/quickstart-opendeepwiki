import { Repository } from '../types';
import RepositoryCard from './RepositoryCard';
import { useTranslation } from '../i18n/client';
import { FileX } from 'lucide-react';

interface RepositoryListProps {
  repositories: Repository[];
}

// 简约的空状态组件
const EmptyState: React.FC<{ description: string }> = ({ description }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <FileX className="h-12 w-12 text-muted-foreground mb-4" />
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const RepositoryList: React.FC<RepositoryListProps> = ({ repositories }) => {
  const { t } = useTranslation();

  if (!repositories.length) {
    return <EmptyState description={t('home.repo_list.empty')} />;
  }

  return (
    <div className="repository-grid">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {repositories.map((repository) => (
          <div key={repository.id}>
            <RepositoryCard repository={repository} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepositoryList; 