// IndexedDB 工具类，用于存储聊天记录
import { Base64Content } from '../../types/chat';

const DB_NAME = 'koala_chat_db';
const DB_VERSION = 2;
const CONVERSATIONS_STORE = 'conversations';
const MESSAGES_STORE = 'messages';

export interface ChatMessage {
  id: string;
  type: 'message_content' | 'reasoning_content' | 'tool_call';
  content: Array<{
    type: string;
    content?: string;
    toolId?: string;
    toolResult?: string;
    toolArgs?: string;
    [key: string]: any;
  }>;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
  conversationId: string;
  metadata?: {
    imageContents?: Base64Content[];
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  organizationName: string;
  repositoryName: string;
  lastMessage?: string;
}

class ChatDatabase {
  private db: IDBDatabase | null = null;
  private dbInitPromise: Promise<IDBDatabase> | null = null;

  // 初始化数据库
  async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.dbInitPromise) {
      return this.dbInitPromise;
    }

    this.dbInitPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('浏览器不支持 IndexedDB'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('打开数据库失败:', event);
        reject(new Error('打开数据库失败'));
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 创建会话存储
        if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
          const conversationStore = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
          conversationStore.createIndex('by_org_repo', ['organizationName', 'repositoryName'], { unique: false });
          conversationStore.createIndex('by_updated', 'updatedAt', { unique: false });
        }

        // 创建消息存储
        if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
          const messageStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
          messageStore.createIndex('by_conversation', 'conversationId', { unique: false });
          messageStore.createIndex('by_timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
    });

    return this.dbInitPromise;
  }

  // 获取会话列表
  async getConversations(organizationName: string, repositoryName: string): Promise<Conversation[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CONVERSATIONS_STORE, 'readonly');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      const index = store.index('by_org_repo');
      const request = index.getAll([organizationName, repositoryName]);

      request.onsuccess = () => {
        const conversations = request.result as Conversation[];
        // 按更新时间降序排序
        conversations.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(conversations);
      };

      request.onerror = (event) => {
        console.error('获取会话失败:', event);
        reject(new Error('获取会话失败'));
      };
    });
  }

  // 保存会话
  async saveConversation(conversation: Conversation): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CONVERSATIONS_STORE, 'readwrite');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      const request = store.put(conversation);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('保存会话失败:', event);
        reject(new Error('保存会话失败'));
      };
    });
  }

  // 更新会话
  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(CONVERSATIONS_STORE, 'readwrite');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      const request = store.get(conversationId);

      request.onsuccess = () => {
        const conversation = request.result as Conversation;
        if (!conversation) {
          reject(new Error('会话不存在'));
          return;
        }

        const updatedConversation = {
          ...conversation,
          ...updates,
          updatedAt: Date.now(),
        };

        const updateRequest = store.put(updatedConversation);
        updateRequest.onsuccess = () => {
          resolve();
        };
        updateRequest.onerror = (event) => {
          console.error('更新会话失败:', event);
          reject(new Error('更新会话失败'));
        };
      };

      request.onerror = (event) => {
        console.error('获取会话失败:', event);
        reject(new Error('获取会话失败'));
      };
    });
  }

  // 删除会话
  async deleteConversation(conversationId: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([CONVERSATIONS_STORE, MESSAGES_STORE], 'readwrite');
      
      // 删除会话
      const conversationStore = transaction.objectStore(CONVERSATIONS_STORE);
      const conversationRequest = conversationStore.delete(conversationId);
      
      // 删除相关消息
      const messageStore = transaction.objectStore(MESSAGES_STORE);
      const messageIndex = messageStore.index('by_conversation');
      const messageRequest = messageIndex.openCursor(IDBKeyRange.only(conversationId));
      
      messageRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        console.error('删除会话失败:', event);
        reject(new Error('删除会话失败'));
      };
    });
  }

  // 获取消息列表
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MESSAGES_STORE, 'readonly');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('by_conversation');
      const request = index.getAll(conversationId);

      request.onsuccess = () => {
        const messages = request.result as ChatMessage[];
        // 按时间戳升序排序
        messages.sort((a, b) => a.timestamp - b.timestamp);
        resolve(messages);
      };

      request.onerror = (event) => {
        console.error('获取消息失败:', event);
        reject(new Error('获取消息失败'));
      };
    });
  }

  // 保存消息
  async saveMessage(message: ChatMessage): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MESSAGES_STORE, 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);
      const request = store.put(message);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('保存消息失败:', event);
        reject(new Error('保存消息失败'));
      };
    });
  }

  // 清空消息
  async clearMessages(conversationId: string): Promise<void> {
    // 删除workspaceId === conversationId 的消息,先获取所有消息
    const messages = await this.getMessages(conversationId);
    // 删除所有消息
    messages.forEach(async (message) => {
      await this.deleteMessage(message.id);
    });
  }
  

  // 删除消息
  async deleteMessage(messageId: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MESSAGES_STORE, 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);
      const request = store.delete(messageId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('删除消息失败:', event);
        reject(new Error('删除消息失败'));
      };
    });
  }

  // 删除消息及其后的所有消息
  async deleteMessageAndFollowing(conversationId: string, messageTimestamp: number): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(MESSAGES_STORE, 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('by_conversation');
      const request = index.openCursor(IDBKeyRange.only(conversationId));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const message = cursor.value as ChatMessage;
          if (message.timestamp >= messageTimestamp) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = (event) => {
        console.error('删除消息失败:', event);
        reject(new Error('删除消息失败'));
      };
    });
  }
}

export const chatDB = new ChatDatabase(); 