import type { KoalaChatWidgetConfig } from "./types";
import { getApiUrl } from "./utils";

/**
 * UI 组件管理类
 */
export class UIComponents {
  private config: KoalaChatWidgetConfig;

  constructor(config: KoalaChatWidgetConfig) {
    this.config = config;
  }

  /**
   * 创建悬浮球按钮
   */
  createFloatingButton(onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "koala-floating-button";
    // 使用配置中的title，如果没有则使用默认值
    button.title = `打开 ${this.config.title || "AI 助手"}`;

    if (this.config.expandIcon) {
      button.style.backgroundImage = `url(data:image/png;base64,${this.config.expandIcon})`;
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
    } else {
      const baseUrl = getApiUrl(this.config);
      button.innerHTML = `<img src="${baseUrl}/logo.png" alt="${this.config.title || "AI 助手"}" style="width: 64px; height: 64px;">`;
    }

    // 添加拖动功能
    this.addDragFunctionality(button);

    button.addEventListener("click", onClick);
    return button;
  }

  /**
   * 为悬浮球添加拖动功能
   */
  private addDragFunctionality(button: HTMLButtonElement): void {
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let buttonStartX = 0;
    let buttonStartY = 0;
    let hasMoved = false;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      hasMoved = false;
      dragStartX = e.clientX;
      dragStartY = e.clientY;

      const rect = button.getBoundingClientRect();
      buttonStartX = rect.left;
      buttonStartY = rect.top;

      button.style.transition = 'none';
      button.classList.add('dragging');
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      // 如果移动距离超过5px，认为是拖动而不是点击
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        hasMoved = true;
      }

      const newX = buttonStartX + deltaX;
      const newY = buttonStartY + deltaY;

      // 限制在视窗范围内
      const maxX = window.innerWidth - button.offsetWidth;
      const maxY = window.innerHeight - button.offsetHeight;

      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));

      button.style.left = `${clampedX}px`;
      button.style.top = `${clampedY}px`;
      button.style.right = 'auto';
      button.style.bottom = 'auto';
    };

    const handleMouseUp = () => {
      isDragging = false;
      button.style.transition = 'transform 0.2s ease';
      button.classList.remove('dragging');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // 如果没有移动，则阻止点击事件的触发
      if (hasMoved) {
        // 延迟一点时间再允许点击，避免拖动结束时误触发点击
        setTimeout(() => {
          hasMoved = false;
        }, 100);
      }
    };

    // 触摸事件支持（移动端）
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      isDragging = true;
      hasMoved = false;
      dragStartX = touch.clientX;
      dragStartY = touch.clientY;

      const rect = button.getBoundingClientRect();
      buttonStartX = rect.left;
      buttonStartY = rect.top;

      button.style.transition = 'none';
      button.classList.add('dragging');
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      e.preventDefault();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartX;
      const deltaY = touch.clientY - dragStartY;

      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        hasMoved = true;
      }

      const newX = buttonStartX + deltaX;
      const newY = buttonStartY + deltaY;

      const maxX = window.innerWidth - button.offsetWidth;
      const maxY = window.innerHeight - button.offsetHeight;

      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));

      button.style.left = `${clampedX}px`;
      button.style.top = `${clampedY}px`;
      button.style.right = 'auto';
      button.style.bottom = 'auto';

      e.preventDefault();
    };

    const handleTouchEnd = () => {
      isDragging = false;
      button.style.transition = 'transform 0.2s ease';
      button.classList.remove('dragging');
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);

      if (hasMoved) {
        setTimeout(() => {
          hasMoved = false;
        }, 100);
      }
    };

    // 修改点击事件处理，如果刚刚拖动过则不触发
    const originalClick = button.onclick;
    button.onclick = (e) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (originalClick) {
        return originalClick.call(button, e);
      }
    };

    button.addEventListener('mousedown', handleMouseDown);
    button.addEventListener('touchstart', handleTouchStart, { passive: false });
  }

  /**
   * 创建聊天容器
   */
  createChatContainer(
    onMinimize: () => void,
    onMaximize: () => void,
    onClose: () => void
  ): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "koala-chat-container";

    // 创建头部
    const header = this.createHeader(onMinimize, onMaximize, onClose);

    // 创建内容区域
    const content = document.createElement("div");
    content.className = "koala-chat-content";
    this.showLoading(content);

    container.appendChild(header);
    container.appendChild(content);

    return container;
  }

  /**
   * 创建头部
   */
  private createHeader(
    onMinimize: () => void,
    onMaximize: () => void,
    onClose: () => void
  ): HTMLDivElement {
    const header = document.createElement("div");
    header.className = "koala-chat-header";

    const title = document.createElement("div");
    title.className = "koala-header-title";
    title.innerHTML = `${this.config.title || "AI 助手"}`;

    const actions = document.createElement("div");
    actions.className = "koala-header-actions";

    // 最小化按钮
    const minimizeBtn = this.createHeaderButton("−", "最小化", onMinimize);

    // 最大化按钮
    const maximizeBtn = this.createHeaderButton("⛶", "最大化", onMaximize);

    // 关闭按钮
    const closeBtn = this.createCloseButton(onClose);

    actions.appendChild(minimizeBtn);
    actions.appendChild(maximizeBtn);
    actions.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(actions);

    return header;
  }

  /**
   * 创建头部按钮
   */
  private createHeaderButton(
    content: string,
    title: string,
    onClick: () => void
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "koala-header-btn";
    button.innerHTML = content;
    button.title = title;
    button.addEventListener("click", onClick);
    return button;
  }

  /**
   * 创建关闭按钮
   */
  private createCloseButton(onClick: () => void): HTMLButtonElement {
    const closeBtn = document.createElement("button");
    closeBtn.className = "koala-header-btn";
    closeBtn.title = "关闭";

    if (this.config.closeIcon) {
      const img = document.createElement("img");
      img.src = `data:image/png;base64,${this.config.closeIcon}`;
      img.alt = "关闭";
      img.style.width = "14px";
      img.style.height = "14px";
      closeBtn.appendChild(img);
    } else {
      closeBtn.innerHTML = "×";
    }

    closeBtn.addEventListener("click", onClick);
    return closeBtn;
  }

  /**
   * 显示加载状态
   */
  showLoading(container: HTMLElement): void {
    container.innerHTML = `
      <div class="koala-loading">
        <div>正在加载 AI 助手...</div>
      </div>
    `;
  }

  /**
   * 显示错误状态
   */
  showError(container: HTMLElement, message: string): void {
    container.innerHTML = `
      <div class="koala-error">
        <div class="koala-error-title">加载失败</div>
        <div class="koala-error-description">${message}</div>
      </div>
    `;
  }

  /**
   * 加载聊天界面
   */
  loadChatInterface(container: HTMLElement): void {
    // 检查必要配置
    if (!this.config.organizationName || !this.config.repositoryName) {
      this.showError(container, "应用配置缺失，无法加载聊天界面");
      return;
    }

    // 获取API URL用于构建聊天界面URL
    const baseUrl = getApiUrl(this.config);

    // 构建聊天界面 URL
    const params = new URLSearchParams({
      appId: this.config.appId,
      organizationName: this.config.organizationName,
      repositoryName: this.config.repositoryName,
      title: this.config.title || "AI 助手",
      theme: this.config.theme || "light",
      embedded: "true",
    });

    if (this.config.expandIcon) {
      params.set("expandIcon", this.config.expandIcon);
    }
    if (this.config.closeIcon) {
      params.set("closeIcon", this.config.closeIcon);
    }

    const chatUrl = `${baseUrl}/chat/embedded?${params.toString()}`;

    // 创建 iframe
    const iframe = document.createElement("iframe");
    iframe.src = chatUrl;
    iframe.className = "koala-iframe-container";
    iframe.frameBorder = "0";
    iframe.setAttribute("allowtransparency", "true");

    // 直接插入iframe到容器中
    container.innerHTML = "";
    container.appendChild(iframe);
  }
}
