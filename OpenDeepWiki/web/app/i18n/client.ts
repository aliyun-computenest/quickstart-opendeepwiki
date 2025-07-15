'use client';

import { useEffect } from 'react';
import i18next from 'i18next';
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { languages, getOptions } from './settings';

// 确保i18next只初始化一次
const i18nextInstance = i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend((language: string, namespace: string) => 
    import(`../../public/locales/${language}/${namespace}.json`)));

// 检查i18next是否已经初始化
if (!i18next.isInitialized) {
  // @ts-ignore - i18next类型定义与实际使用有差异
  i18nextInstance.init({
    ...getOptions(),
    detection: {
      order: ['querystring', 'cookie', 'navigator'],
      lookupQuerystring: 'locale',
      caches: ['cookie'],
      cookieExpirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
    },
    react: {
      useSuspense: false, // 禁用Suspense以避免hydration问题
    }
  });
}

export function useTranslation(ns: string | string[] = 'common', options = {}) {
  const ret = useTranslationOrg(ns, options);
  const { i18n } = ret;

  useEffect(() => {
    languages.forEach((lng) => {
      const namespaces = Array.isArray(ns) ? ns : [ns];
      namespaces.forEach((namespace) => {
        i18n.loadNamespaces(namespace);
      });
    });
  }, [i18n, ns]);

  return ret;
} 