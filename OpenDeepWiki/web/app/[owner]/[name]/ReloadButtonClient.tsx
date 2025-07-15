'use client';

import { useTranslation } from '@/app/i18n/client';

export default function ReloadButtonClient() {
  const { t } = useTranslation('common');
  
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
    >
      {t('page.error.reload')}
    </button>
  );
} 