'use client'

import React from 'react';
import Link from 'next/link';
import { Github } from 'lucide-react';
import { CollapsibleCard } from '@/components/ui/collapsible';

interface SourceFile {
  documentFileItemId: string;
  address: string;
  name: string;
  documentFileItem: any;
  id: string;
  createdAt: string;
}

interface SourceFilesProps {
  fileSource: SourceFile[];
  git: string;
  branch?: string;
}

const SourceFiles: React.FC<SourceFilesProps> = ({
  fileSource,
  git,
  branch = 'main',
}) => {
  if (!fileSource?.length) return null;

  return (
    <CollapsibleCard
      title={<div className="text-sm font-medium">相关源文件</div>}
      className="w-full mb-4"
    >
      <ul className="space-y-1">
        {fileSource.map((item) => (
          <li key={item.documentFileItemId}>
            <Link
              href={`${git}/blob/${branch}/${item.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Github className="h-4 w-4 shrink-0" />
              <span className="text-sm">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </CollapsibleCard>
  );
};

export default SourceFiles; 