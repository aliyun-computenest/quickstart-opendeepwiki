import type { KoalaChatWidgetConfig, ValidationResponse } from "./types";
import { getApiUrl } from "./utils";

/**
 * 域名验证服务
 */
export class ValidationService {
  private config: KoalaChatWidgetConfig;

  constructor(config: KoalaChatWidgetConfig) {
    this.config = config;
  }

  /**
   * 验证域名
   */
  async validateDomain(): Promise<ValidationResponse> {
    if (!this.config.appId) {
      return { isValid: false, reason: "AppId is required" };
    }

    try {
      const apiUrl = getApiUrl(this.config);
      const currentDomain = window.location.hostname;

      const response = await fetch(`${apiUrl}/api/AppConfig/validatedomain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appId: this.config.appId,
          domain: currentDomain,
        }),
      });

      if (!response.ok) {
        console.error("Domain validation request failed:", response.status);
        return { isValid: false, reason: "ValidationRequestFailed" };
      }

      const { data } = await response.json();
      return {
        isValid: data.isValid,
        reason: data.reason,
        appConfig: data.appConfig,
      };
    } catch (error) {
      console.error("Domain validation error:", error);
      return { isValid: false, reason: "NetworkError" };
    }
  }

  /**
   * 执行域名验证并更新配置
   */
  async validateAndUpdateConfig(): Promise<boolean> {
    const validation = await this.validateDomain();
    if (!validation.isValid) {
      console.error(
        "KoalaChatWidget: Domain validation failed -",
        validation.reason
      );
      if (typeof this.config.onValidationFailed === "function") {
        this.config.onValidationFailed(window.location.hostname);
      }
      return false;
    }

    // 更新配置（如果从验证结果中获取到了应用配置）
    if (validation.appConfig) {
      this.config.organizationName = validation.appConfig.organizationName;
      this.config.repositoryName = validation.appConfig.repositoryName;
      this.config.title = validation.appConfig.name || this.config.title;
    }

    return true;
  }
}
