export const fallbackLng = 'zh-CN';
export const defaultNS = 'common';

export const languages = [
  'zh-CN',   // 中文(简体)
  'en-US',   // 英文(美国)
];

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    supportedLngs: languages,
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns
  };
} 