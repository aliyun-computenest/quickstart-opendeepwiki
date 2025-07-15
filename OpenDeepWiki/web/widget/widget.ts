import type { KoalaChatWidgetConfig, KoalaChatWidgetAPI } from "./types";
import { ValidationService } from "./validation";
import { UIComponents } from "./ui";
import { TooltipManager } from "./tooltip";
import { createStyles } from "./styles";

/**
 * KoalaWiki AI Chat Widget 主类
 */
export class KoalaChatWidget implements KoalaChatWidgetAPI {
  version = "1.0.0";

  private config: KoalaChatWidgetConfig = {
    appId: "",
    organizationName: "default",
    repositoryName: "default",
    title: "AI 助手",
    expandIcon: "",
    closeIcon: "",
    apiUrl: "",
    theme: "light",
    enableTooltip: true,
    tooltipText: "点击我询问您想知道的！",
    tooltipDelay: 5000,
    tooltipDuration: 3000,
    tooltipRepeatDelay: 30000,
  };

  private validationService!: ValidationService;
  private uiComponents!: UIComponents;
  private tooltipManager!: TooltipManager;

  private floatingButton: HTMLButtonElement | null = null;
  private chatContainer: HTMLDivElement | null = null;
  private isExpanded: boolean = false;
  private isMinimized: boolean = false;
  private isMaximized: boolean = false;
  private isValidated: boolean = false;

  /**
   * 初始化聊天组件
   */
  async init(options: KoalaChatWidgetConfig): Promise<void> {
    try {
      // 合并配置
      this.config = { ...this.config, ...options };

      // 验证必要参数
      if (!this.config.appId) {
        console.error("KoalaChatWidget: appId is required");
        return;
      }

      // 初始化服务
      this.validationService = new ValidationService(this.config);
      this.uiComponents = new UIComponents(this.config);
      this.tooltipManager = new TooltipManager(this.config);

      // 验证域名并获取应用配置
      const success = await this.validationService.validateAndUpdateConfig();
      if (!success) {
        return;
      }

      // 标记为已验证
      this.isValidated = true;

      // 等待 DOM 加载完成
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          setTimeout(() => this.initWidget(), 100);
        });
      } else {
        setTimeout(() => this.initWidget(), 100);
      }
    } catch (error) {
      console.error("KoalaChatWidget initialization failed:", error);
      if (typeof this.config.onError === "function") {
        this.config.onError(
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  /**
   * 初始化组件
   */
  private initWidget(): void {
    try {
      // 创建样式
      createStyles();

      // 创建悬浮球按钮
      this.floatingButton = this.uiComponents.createFloatingButton(() =>
        this.toggle()
      );
      document.body.appendChild(this.floatingButton);

      // 设置提示管理器
      this.tooltipManager.setFloatingButton(this.floatingButton);
      this.tooltipManager.initActivityListeners(() => this.toggle());

      // 启动提示计时器
      if (this.config.enableTooltip) {
        this.tooltipManager.startTooltipTimer();
      }

      console.log("KoalaChatWidget initialized successfully");
    } catch (error) {
      console.error("KoalaChatWidget initialization failed:", error);
      if (typeof this.config.onError === "function") {
        this.config.onError(
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  /**
   * 打开聊天窗口
   */
  async open(): Promise<void> {
    // 如果尚未验证，先进行验证
    if (!this.isValidated) {
      const success = await this.validationService.validateAndUpdateConfig();
      if (!success) {
        return;
      }
      this.isValidated = true;
    }

    // 隐藏提示
    this.tooltipManager.hideTooltip();

    if (!this.chatContainer) {
      this.chatContainer = this.uiComponents.createChatContainer(
        () => this.minimizeChat(),
        () => this.toggleMaximize(),
        () => this.close()
      );
      document.body.appendChild(this.chatContainer);

      const contentElement = this.chatContainer.querySelector(
        ".koala-chat-content"
      );
      if (contentElement) {
        this.uiComponents.loadChatInterface(contentElement as HTMLElement);
      }
    }

    this.chatContainer.classList.add("visible");
    if (this.floatingButton) {
      this.floatingButton.style.display = "none";
    }
    this.isExpanded = true;
    this.isMinimized = false;
    this.tooltipManager.setExpanded(true);
  }

  /**
   * 关闭聊天窗口
   */
  close(): void {
    if (this.chatContainer) {
      this.chatContainer.classList.remove("visible");
      this.chatContainer.classList.remove("minimized");
      this.chatContainer.classList.remove("maximized");
    }
    if (this.floatingButton) {
      this.floatingButton.style.display = "flex";
    }
    this.isExpanded = false;
    this.isMinimized = false;
    this.isMaximized = false;
    this.tooltipManager.setExpanded(false);

    // 重新开始提示计时器
    if (this.config.enableTooltip) {
      this.tooltipManager.startTooltipTimer();
    }
  }

  /**
   * 切换聊天窗口状态
   */
  async toggle(): Promise<void> {
    if (this.isExpanded) {
      this.close();
    } else {
      await this.open();
    }
  }

  /**
   * 最小化聊天窗口
   */
  private minimizeChat(): void {
    if (this.chatContainer) {
      this.chatContainer.classList.add("minimized");
      this.isMinimized = true;
    }
  }

  /**
   * 切换最大化
   */
  private toggleMaximize(): void {
    if (this.chatContainer) {
      if (this.isMaximized) {
        this.chatContainer.classList.remove("maximized");
        this.isMaximized = false;
      } else {
        this.chatContainer.classList.add("maximized");
        this.isMaximized = true;
      }
    }
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    // 移除元素
    if (this.floatingButton) {
      this.floatingButton.remove();
      this.floatingButton = null;
    }
    if (this.chatContainer) {
      this.chatContainer.remove();
      this.chatContainer = null;
    }

    // 销毁提示管理器
    this.tooltipManager?.destroy();

    // 重置状态
    this.isExpanded = false;
    this.isMinimized = false;
    this.isMaximized = false;
    this.isValidated = false;
  }
}
