/**
 * KoalaWiki AI Chat Widget
 * 第三方网站引用的聊天悬浮球脚本
 *
 * 使用方式:
 * <script src="https://your-domain.com/koala-chat-widget.js"></script>
 * <script>
 *   KoalaChatWidget.init({
 *     appId: 'your-app-id',  // 必填：应用ID，用于验证域名
 *     apiUrl: 'https://opendeep.wiki',  // 必填：API服务器地址
 *
 *     // 以下参数都是可选的
 *     title: '我的 AI 助手',         // 可选：标题（可能被验证接口返回的配置覆盖）
 *     theme: 'light',                 // 可选：主题 'light'|'dark'
 *
 *     // UI自定义
 *     expandIcon: null, // 可选：展开图标
 *     closeIcon: null,  // 可选：关闭图标
 *   });
 * </script>
 */

import { KoalaChatWidget } from "./widget";

// 创建全局实例
const chatWidget = new KoalaChatWidget();

// 暴露全局 API
window.KoalaChatWidget = {
  init: chatWidget.init.bind(chatWidget),
  destroy: chatWidget.destroy.bind(chatWidget),
  open: chatWidget.open.bind(chatWidget),
  close: chatWidget.close.bind(chatWidget),
  toggle: chatWidget.toggle.bind(chatWidget),
  version: chatWidget.version,
};
