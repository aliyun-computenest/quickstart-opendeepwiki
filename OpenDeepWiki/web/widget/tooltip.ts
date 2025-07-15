import type { KoalaChatWidgetConfig } from "./types";
import { clearTimer } from "./utils";

/**
 * 提示功能管理类
 */
export class TooltipManager {
  private config: KoalaChatWidgetConfig;
  private tooltipElement: HTMLElement | null = null;
  private tooltipTimer: NodeJS.Timeout | null = null;
  private tooltipHideTimer: NodeJS.Timeout | null = null;
  private lastTooltipHideTime: number = 0;
  private lastActivity: number = Date.now();
  private floatingButton: HTMLElement | null = null;
  private isExpanded: boolean = false;

  constructor(config: KoalaChatWidgetConfig) {
    this.config = config;
  }

  /**
   * 设置悬浮球引用
   */
  setFloatingButton(button: HTMLElement): void {
    this.floatingButton = button;
  }

  /**
   * 设置展开状态
   */
  setExpanded(expanded: boolean): void {
    this.isExpanded = expanded;
  }

  /**
   * 初始化活动监听器
   */
  initActivityListeners(onToggleChat: () => void): void {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const updateUserActivity = () => {
      const now = Date.now();

      // 如果距离上次活动时间太短，避免频繁重置
      if (now - this.lastActivity < 1000) {
        return;
      }

      this.lastActivity = now;
      this.hideTooltip();

      // 重新开始计时
      if (
        this.config.enableTooltip &&
        this.floatingButton &&
        !this.isExpanded
      ) {
        this.startTooltipTimer();
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, updateUserActivity, {
        passive: true,
        capture: true,
      });
    });

    // 设置点击提示打开聊天的回调
    this.onToggleChat = onToggleChat;
  }

  private onToggleChat: (() => void) | null = null;

  /**
   * 开始提示计时器
   */
  startTooltipTimer(): void {
    this.tooltipTimer = clearTimer(this.tooltipTimer);
    this.tooltipHideTimer = clearTimer(this.tooltipHideTimer);

    // 检查是否需要等待更长时间（如果提示之前显示过）
    const now = Date.now();
    let delay = this.config.tooltipDelay || 5000;

    if (this.lastTooltipHideTime > 0) {
      const timeSinceHide = now - this.lastTooltipHideTime;
      const repeatDelay = this.config.tooltipRepeatDelay || 30000;
      if (timeSinceHide < repeatDelay) {
        delay = repeatDelay - timeSinceHide;
      }
    }

    this.tooltipTimer = setTimeout(() => {
      if (!this.isExpanded && this.floatingButton) {
        this.showTooltip();
      }
    }, delay);
  }

  /**
   * 显示提示
   */
  private showTooltip(): void {
    if (
      !this.config.enableTooltip ||
      !this.config.tooltipText ||
      this.isExpanded
    ) {
      return;
    }

    if (!this.tooltipElement) {
      this.createTooltip();
    }

    if (this.tooltipElement) {
      this.tooltipElement.textContent = this.config.tooltipText;
      this.tooltipElement.classList.add("visible");

      // 设置自动隐藏计时器
      const duration = this.config.tooltipDuration || 3000;
      if (duration > 0) {
        this.tooltipHideTimer = setTimeout(() => {
          this.hideTooltip();
        }, duration);
      }
    }
  }

  /**
   * 隐藏提示
   */
  hideTooltip(): void {
    if (this.tooltipElement) {
      this.tooltipElement.classList.remove("visible");
    }
    this.tooltipHideTimer = clearTimer(this.tooltipHideTimer);
    this.lastTooltipHideTime = Date.now();
  }

  /**
   * 创建提示元素
   */
  private createTooltip(): void {
    this.tooltipElement = document.createElement("div");
    this.tooltipElement.className = "koala-tooltip";
    document.body.appendChild(this.tooltipElement);

    // 动态计算位置，确保提示出现在悬浮球上方
    const updateTooltipPosition = () => {
      if (this.floatingButton && this.tooltipElement) {
        const buttonRect = this.floatingButton.getBoundingClientRect();
        const tooltipRect = this.tooltipElement.getBoundingClientRect();

        // 计算提示位置：悬浮球上方，水平居中
        const tooltipBottom = window.innerHeight - buttonRect.top + 12; // 12px间距
        const tooltipRight =
          window.innerWidth -
          buttonRect.left -
          buttonRect.width / 2 -
          tooltipRect.width / 2;

        this.tooltipElement.style.bottom = tooltipBottom + "px";
        this.tooltipElement.style.right = Math.max(12, tooltipRight) + "px";
      }
    };

    // 点击提示时也打开聊天
    this.tooltipElement.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.onToggleChat) {
        this.onToggleChat();
      }
    });

    // 监听窗口大小变化
    window.addEventListener("resize", updateTooltipPosition);

    // 初始位置更新
    requestAnimationFrame(updateTooltipPosition);
  }

  /**
   * 销毁提示管理器
   */
  destroy(): void {
    this.tooltipTimer = clearTimer(this.tooltipTimer);
    this.tooltipHideTimer = clearTimer(this.tooltipHideTimer);

    if (this.tooltipElement) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
    }

    this.lastActivity = Date.now();
    this.lastTooltipHideTime = 0;
  }
}
