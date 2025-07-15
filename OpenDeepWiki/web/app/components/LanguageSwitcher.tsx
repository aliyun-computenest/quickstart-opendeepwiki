'use client';

import { Globe } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslation } from '../i18n/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 语言配置
const LANGUAGES = [
  { code: 'zh-CN', label: '中文(简体)', shortLabel: '中文' },
  { code: 'en-US', label: 'English (US)', shortLabel: 'EN' },
] as const;

type LanguageCode = typeof LANGUAGES[number]['code'];

const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const getCurrentLocale = (): LanguageCode => {
    const locale = searchParams.get('locale') as LanguageCode;
    return locale || 'zh-CN';
  };

  const switchLanguage = (locale: LanguageCode) => {
    const params = new URLSearchParams(searchParams);
    params.set('locale', locale);
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentLocale = getCurrentLocale();
  const currentLanguage = LANGUAGES.find(lang => lang.code === currentLocale);

  return (
    <Select value={currentLocale} onValueChange={switchLanguage}>
      <SelectTrigger 
        className="w-auto h-9 px-3 gap-2 bg-transparent border-0 
                   hover:bg-accent hover:text-accent-foreground 
                   focus:bg-accent focus:text-accent-foreground
                   transition-all duration-200 ease-in-out
                   rounded-md shadow-none"
        aria-label="选择语言"
      >
        <SelectValue 
          placeholder="语言" 
          className="text-sm font-medium"
        />
      </SelectTrigger>
      <SelectContent 
        className="min-w-[140px] animate-in fade-in-0 zoom-in-95 
                   data-[state=open]:animate-in data-[state=closed]:animate-out 
                   data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
                   data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        align="end"
      >
        {LANGUAGES.map((language) => (
          <SelectItem 
            key={language.code}
            value={language.code}
            className="text-sm cursor-pointer
                       focus:bg-accent focus:text-accent-foreground
                       hover:bg-accent/50 transition-colors duration-150"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              {language.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSwitcher; 