/**
 * 创建聊天组件的样式
 */
export function createStyles(): void {
  const styles = `
    .koala-chat-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      direction: ltr;
    }

    .koala-floating-button {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #1677ff;
      border: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      transition: transform 0.2s ease;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      touch-action: none;
    }

    .koala-floating-button:hover {
      transform: scale(1.05);
    }

    .koala-floating-button:active {
      transform: scale(0.95);
    }

    /* 拖动时的样式 */
    .koala-floating-button.dragging {
      cursor: grabbing;
      cursor: -webkit-grabbing;
      transform: scale(1.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
    }

    .koala-chat-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 550px;
      height: 700px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      z-index: 10001;
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #d9d9d9;
    }

    .koala-chat-container.visible {
      display: flex;
    }

    .koala-chat-container.minimized {
      height: 56px;
    }

    .koala-chat-container.maximized {
      width: 550px;
      height: 100vh;
      bottom: 0;
      right: 0;
      top: 0;
    }

    .koala-chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #d9d9d9;
      background: white;
      min-height: 56px;
    }

    .koala-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      color: #262626;
    }

    .koala-header-actions {
      display: flex;
      gap: 4px;
    }

    .koala-header-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #8c8c8c;
      transition: background-color 0.2s;
    }

    .koala-header-btn:hover {
      background-color: #f5f5f5;
      color: #595959;
    }

    .koala-chat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .koala-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #8c8c8c;
    }

    .koala-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #ff4d4f;
      text-align: center;
    }

    .koala-error-title {
      font-weight: 500;
      margin-bottom: 8px;
    }

    .koala-error-description {
      font-size: 14px;
      color: #8c8c8c;
    }

    .koala-iframe-container {
      flex: 1;
      border: none;
      width: 100%;
      height: 100%;
    }

    .koala-tooltip {
      position: fixed;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 14px;
      white-space: nowrap;
      z-index: 998;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
    }

    .koala-tooltip.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .koala-tooltip::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 6px solid transparent;
      border-top-color: rgba(0, 0, 0, 0.8);
    }

    @media (max-width: 768px) {
      .koala-chat-container {
        bottom: 0;
        right: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 0;
      }

      .koala-chat-container.maximized {
        width: 100%;
        height: 100%;
      }

      .koala-floating-button {
        bottom: 20px;
        right: 20px;
      }

      .koala-tooltip {
        bottom: 84px;
        right: 20px;
        max-width: calc(100vw - 40px);
        white-space: pre-wrap;
      }
    }
  `;

  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
