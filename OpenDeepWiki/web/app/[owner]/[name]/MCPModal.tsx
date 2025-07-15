"use client"
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CopyIcon, CheckIcon, InfoIcon } from 'lucide-react';
import { useTranslation } from '@/app/i18n/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const MCPModal = (
  {
    owner,
    name
  }: {
    owner: string;
    name: string;
  }
) => {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);

  const mcpConfigJson = {
    mcpServers: {
      [name.toLowerCase()]: {
        url: `${typeof window !== 'undefined' ? window.location.protocol : 'https:'}//${typeof window !== 'undefined' ? window.location.host : ''}/api/mcp?owner=${owner}&name=${name}`
      }
    }
  };

  const mcpJsonString = JSON.stringify(mcpConfigJson, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mcpJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 定义最小化设计变量
  const minimalistDesign = {
    spacing: {
      sm: 8,
      md: 16,
      lg: 24,
    },
    borderRadius: {
      lg: 8,
    },
    colors: {
      border: 'hsl(var(--border))',
      background: 'hsl(var(--background))',
      backgroundSecondary: 'hsl(var(--muted))',
      primary: 'hsl(var(--primary))',
      text: 'hsl(var(--foreground))',
      success: 'hsl(var(--success))',
    },
    shadows: {
      sm: 'hsl(var(--shadow) / 0.1) 0px 1px 3px 0px',
    },
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm" >
          MCP
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>MCP {t('repository_layout.mcp.config.title')}</DialogTitle>
          <DialogDescription>
            {t('repository_layout.mcp.support_message')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 mt-2">
          <Alert className="border rounded-lg py-2">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <ul className="pl-6 my-1 text-sm">
                <li>{t('repository_layout.mcp.features.single_repo')}</li>
                <li>{t('repository_layout.mcp.features.analysis')}</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Card className="py-3">
            <CardHeader className="pb-2 px-4">
              <CardTitle className="text-base">{t('repository_layout.mcp.config.title')}</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-xs mb-2">
                {t('repository_layout.mcp.config.cursor_usage')}
              </p>

              <div className="relative bg-muted p-3 rounded-lg mb-3 border">
                <pre className="m-0 font-mono whitespace-pre-wrap break-words text-xs max-h-[150px] overflow-y-auto">
                  {mcpJsonString}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={copyToClipboard}
                  title={copied ? t('repository_layout.mcp.config.copied_tooltip') : t('repository_layout.mcp.config.copy_tooltip')}
                >
                  {copied ?
                    <CheckIcon className="h-3 w-3 text-green-500" /> :
                    <CopyIcon className="h-3 w-3" />
                  }
                </Button>
              </div>

              <div className="flex flex-col space-y-1">
                <p className="font-semibold text-sm">{t('repository_layout.mcp.config.description_title')}</p>
                <ul className="pl-4 m-0 text-xs">
                  <li><code className="bg-muted px-1 py-0.5 rounded text-xs">owner</code>: {t('repository_layout.mcp.config.owner_desc')}</li>
                  <li><code className="bg-muted px-1 py-0.5 rounded text-xs">name</code>: {t('repository_layout.mcp.config.name_desc')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3">
            <CardHeader className="pb-2 px-4">
              <CardTitle className="text-base">{t('repository_layout.mcp.test.title')}</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-xs">
                {t('repository_layout.mcp.test.description')}
              </p>
              <p className="font-semibold text-primary my-2 text-sm">
                {t('repository_layout.mcp.test.question')}
              </p>
              <div className="w-full h-auto relative mt-2 rounded-lg overflow-hidden border">
                <img
                  src="/mcp.png"
                  alt={t('repository_layout.mcp.test.image_alt')}
                  className="w-full h-auto block object-contain max-h-[120px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MCPModal; 