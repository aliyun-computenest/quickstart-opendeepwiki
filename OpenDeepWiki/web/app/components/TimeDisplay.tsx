'use client';

import { useTranslation } from '@/app/i18n/client';
import { formatRelativeTime } from '@/app/utils/timeFormat';

interface TimeDisplayProps {
  dateString: string;
  className?: string;
  showPrefix?: boolean;
}

export default function TimeDisplay({
  dateString,
  className = "text-sm text-gray-500",
  showPrefix = true
}: TimeDisplayProps) {
  const { t, i18n } = useTranslation();

  if (!dateString) {
    return (
      <span className={className}>
        {showPrefix && t('repository_layout.header.last_updated', '最近更新: ')}{t('time.unknown', '未知')}
      </span>
    );
  }

  const formattedTime = formatRelativeTime(dateString, i18n.language);
  const prefix = showPrefix ? t('repository_layout.header.last_updated', '最近更新: ') : '';

  return (
    <span className={className}>
      {prefix}{formattedTime}
    </span>
  );
}
