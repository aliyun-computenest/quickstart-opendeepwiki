/**
 * KoalaChatWidget配置选项
 */
export interface KoalaChatWidgetConfig {
  appId: string;
  organizationName: string;
  repositoryName: string;
  title?: string;
  expandIcon?: string;
  closeIcon?: string;
  apiUrl: string;
  theme?: 'light' | 'dark';
  enableTooltip?: boolean;
  tooltipText?: string;
  tooltipDelay?: number;
  tooltipDuration?: number;
  tooltipRepeatDelay?: number;
  onError?: (errorMessage: string) => void;
  onValidationFailed?: (domain: string) => void;
}

/**
 * KoalaChatWidget API接口
 */
export interface KoalaChatWidgetAPI {
  version: string;
  init(options: KoalaChatWidgetConfig): Promise<void>;
  destroy(): void;
  open(): void;
  close(): void;
  toggle(): void;
}

export interface ValidationResponse {
  isValid: boolean;
  reason?: string;
  appConfig?: {
    appId: string;
    name?: string;
    isEnabled: boolean;
    organizationName: string;
    repositoryName: string;
    allowedDomains: string[];
    enableDomainValidation: boolean;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

// 声明全局Window接口扩展
declare global {
  interface Window {
    KoalaChatWidget: {
      init: (options: KoalaChatWidgetConfig) => Promise<void>;
      destroy: () => void;
      open: () => void;
      close: () => void;
      toggle: () => void;
      version: string;
    };
  }
}
