'use client'

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ChatInput from "../components/ChatInput";
import Message from "./message";
import { chatService } from "../services/chatService";
import { chatDB, ChatMessage, Conversation } from "../utils/indexedDB";
import { MessageContentType, MessageItem, MessageContentReasoningItem, MessageContentTextItem, MessageContentToolItem, MessageContentGitIssuesItem, Base64Content, MessageContentImageItem } from "../../types/chat";

interface WorkspaceProps {
    organizationName: string;
    name: string;
    appId?: string;
}


export default function Workspace({ organizationName, name, appId }: WorkspaceProps) {
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [conversationId, setConversationId] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [deepResearch, setDeepResearch] = useState<boolean>(false);
    const abortControllerRef = useRef<AbortController>(
        new AbortController()
    );
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 初始化会话
    useEffect(() => {
        initializeConversation();
    }, [organizationName, name]);

    const initializeConversation = async () => {
        try {
            // 获取现有会话
            const conversations = await chatDB.getConversations(organizationName, name);

            if (conversations.length > 0) {
                // 使用最新的会话
                const latestConversation = conversations[0];
                setConversationId(latestConversation.id);

                // 加载该会话的历史消息
                await loadHistoryMessages(latestConversation.id);
            } else {
                // 创建新会话
                const newConversationId = uuidv4();
                const conversation: Conversation = {
                    id: newConversationId,
                    title: `${organizationName}/${name} 的对话`,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    organizationName: organizationName,
                    repositoryName: name,
                };

                await chatDB.saveConversation(conversation);
                setConversationId(newConversationId);
            }
        } catch (error) {
            console.error('初始化会话失败:', error);
        }
    };

    const loadHistoryMessages = async (convId: string) => {
        try {
            const chatMessages = await chatDB.getMessages(convId);
            const messageItems: MessageItem[] = chatMessages.map(msg => ({
                id: msg.id,
                content: msg.content as any,
                role: msg.role,
                createdAt: new Date(msg.timestamp),
                updatedAt: new Date(msg.timestamp),
            }));

            setMessages(messageItems);
        } catch (error) {
            console.error('加载历史消息失败:', error);
        }
    };

    const uuidv4 = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    const handleSendMessage = async (message: string, imageContents?: Base64Content[]) => {
        if (isLoading) {
            return;
        }

        setIsLoading(true);

        try {
            // 创建用户消息内容
            const userMessageContent: (MessageContentTextItem | MessageContentImageItem)[] = [
                {
                    type: MessageContentType.Text,
                    content: message
                } as MessageContentTextItem
            ];

            // 如果有图片，添加到content中
            if (imageContents && imageContents.length > 0) {
                userMessageContent.push({
                    type: MessageContentType.Image,
                    imageContents: imageContents
                } as MessageContentImageItem);
            }

            const userMessage = {
                id: uuidv4(),
                content: userMessageContent,
                role: "user",
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            messages.push(userMessage);
            const aiMessage: MessageItem = {
                id: uuidv4(),
                content: [
                    {
                        type: MessageContentType.Text,
                        content: ''
                    }
                ],
                role: "assistant",
                createdAt: new Date(Date.now() + 1000),  // 时间+1秒
                updatedAt: new Date(Date.now() + 1000),  // 时间+1秒
            }

            messages.push(aiMessage);

            setMessages([...messages]);

            // 保存用户消息到IndexedDB
            if (conversationId) {
                try {
                    const userChatMessage: ChatMessage = {
                        id: userMessage.id,
                        type: 'message_content',
                        content: userMessage.content as any,
                        role: 'user',
                        timestamp: userMessage.createdAt.getTime(),
                        conversationId: conversationId,
                    };
                    await chatDB.saveMessage(userChatMessage);

                    // 更新会话的最后消息
                    await chatDB.updateConversation(conversationId, {
                        // 提取第一条text内容
                        lastMessage: (userMessage.content as any[]).find(item => item.type === MessageContentType.Text)?.content || '',
                        updatedAt: Date.now(),
                    });
                } catch (error) {
                    console.error('保存用户消息失败:', error);
                }
            }

            const requestData = {
                messages: messages.map(x => {
                    return {
                        role: x.role as "user" | "assistant" | "system",
                        content: x.content,
                    }
                }),
                organizationName: organizationName,
                name: name,
                deepResearch: deepResearch,
                appId: appId,
                abortController: abortControllerRef.current,
            }

            let currentToolCalls: any[] = [];
            let currentContentType: MessageContentType | null = null;
            let isFirstContent = true;

            for await (const event of chatService.sendMessage(requestData)) {
                if (abortControllerRef.current?.signal.aborted) {
                    break;
                }

                switch (event.type) {
                    case 'reasoning_content':
                        // 推理内容流式更新
                        if (currentContentType !== MessageContentType.Reasoning) {
                            // 如果当前类型不是推理类型，新增一个推理内容项
                            const reasoningItem: MessageContentReasoningItem = {
                                type: MessageContentType.Reasoning,
                                content: ''
                            };
                            (aiMessage.content as any[]).push(reasoningItem);
                            currentContentType = MessageContentType.Reasoning;
                        }

                        // 更新最后一个推理内容项
                        const allContent = aiMessage.content as any[];
                        const lastReasoningItem = allContent.filter(item => item.type === MessageContentType.Reasoning).pop();
                        if (lastReasoningItem) {
                            lastReasoningItem.content += event.content || '';
                        }

                        setMessages([...messages]);
                        break;

                    case 'git_issues':
                        // Git Issues 搜索结果
                        if (event.content && event.content.length > 0) {
                            // 检查上一个内容项是否是相关的工具调用
                            const allContent = aiMessage.content as any[];
                            const lastToolItem = allContent
                                .filter(item => item.type === MessageContentType.Tool)
                                .pop();

                            if (lastToolItem &&
                                (lastToolItem.toolName === 'Github-SearchIssues' ||
                                    lastToolItem.toolName === 'Gitee-SearchIssues')) {
                                // 将Issues数据存储到工具调用的结果中
                                lastToolItem.toolResult = JSON.stringify({
                                    GitIssues: event.content
                                });
                            } else {
                                // 如果不是相关工具调用，则创建独立的GitIssues内容项
                                const gitIssuesItem: MessageContentGitIssuesItem = {
                                    type: MessageContentType.GitIssues,
                                    gitIssues: JSON.parse(event.content)
                                };
                                (aiMessage.content as any[]).push(gitIssuesItem);
                            }

                            currentContentType = MessageContentType.GitIssues;
                            setMessages([...messages]);
                        }
                        break;

                    case 'tool_call':
                        // 工具调用
                        if (event.tool_call_id && event.function_name) {
                            // 新的工具调用开始，添加到content数组
                            if (currentContentType !== MessageContentType.Tool) {
                                currentContentType = MessageContentType.Tool;
                            }

                            const toolItem: MessageContentToolItem = {
                                type: MessageContentType.Tool,
                                toolId: event.tool_call_id,
                                toolResult: '',
                                toolArgs: event.function_arguments || '',
                                toolName: event.function_name || ''
                            };
                            (aiMessage.content as any[]).push(toolItem);

                            currentToolCalls.push({
                                id: event.tool_call_id,
                                functionName: event.function_name,
                                arguments: event.function_arguments || '',
                            });
                        } else if (currentToolCalls.length > 0) {
                            // 更新最后一个工具调用的参数
                            const lastToolCall = currentToolCalls[currentToolCalls.length - 1];
                            lastToolCall.arguments += event.function_arguments || '';

                            // 同时更新content数组中的工具项
                            const allContent = aiMessage.content as any[];
                            const lastToolItem = allContent.filter(item => item.type === MessageContentType.Tool).pop();
                            if (lastToolItem) {
                                lastToolItem.toolArgs += event.function_arguments || '';
                            }
                        }

                        setMessages([...messages]);
                        break;

                    case 'message_content':
                        // 消息内容流式更新
                        if (isFirstContent) {
                            // 第一次内容，更新默认的第一个text内容项
                            const allContent = aiMessage.content as any[];
                            const firstTextItem = allContent.find(item => item.type === MessageContentType.Text);
                            if (firstTextItem) {
                                firstTextItem.content += event.content || '';
                            }
                            currentContentType = MessageContentType.Text;
                            isFirstContent = false;
                        } else {
                            // 后续内容，检查是否需要新增内容项
                            if (currentContentType !== MessageContentType.Text) {
                                // 当前类型不是text，新增一个text内容项
                                const textItem: MessageContentTextItem = {
                                    type: MessageContentType.Text,
                                    content: ''
                                };
                                (aiMessage.content as any[]).push(textItem);
                                currentContentType = MessageContentType.Text;
                            }

                            // 更新最后一个text内容项
                            const allContent = aiMessage.content as any[];
                            const lastTextItem = allContent.filter(item => item.type === MessageContentType.Text).pop();
                            if (lastTextItem) {
                                lastTextItem.content += event.content || '';
                            }
                        }

                        setMessages([...messages]);
                        break;

                    case 'message_start':
                        break;

                    case 'done':
                        setMessages([...messages]);

                        // 保存AI消息到IndexedDB
                        if (conversationId) {
                            try {
                                const aiChatMessage: ChatMessage = {
                                    id: aiMessage.id,
                                    type: 'message_content',
                                    content: aiMessage.content as any,
                                    role: 'assistant',
                                    timestamp: aiMessage.createdAt.getTime(),
                                    conversationId: conversationId,
                                    metadata: {}
                                };
                                await chatDB.saveMessage(aiChatMessage);

                                // 更新会话的最后消息
                                const allContent = aiMessage.content as any[];
                                const lastMessageContent = allContent
                                    .find(item => item.type === MessageContentType.Text);
                                const lastMessage = lastMessageContent?.content || '';

                                await chatDB.updateConversation(conversationId, {
                                    lastMessage: lastMessage.substring(0, 100) + (lastMessage.length > 100 ? '...' : ''),
                                    updatedAt: Date.now(),
                                });
                            } catch (error) {
                                console.error('保存AI消息失败:', error);
                            }
                        }

                        break;
                }
            }
        } finally {
            setIsLoading(false);
        }
    }

    const handleStopGeneration = () => {
        abortControllerRef.current?.abort();
        setIsLoading(false);
    }


    const handleDelete = (messageId: string) => {
        setMessages(messages.filter(x => x.id !== messageId));

        // 删除IndexedDB
        chatDB.deleteMessage(messageId);
    }

    const handleClear = () => {
        setMessages([]);
        // 清空IndexedDB
        chatDB.clearMessages(conversationId);
    }

    return (
        <div className="workspace-container">
            <div className="flex flex-col gap-6 h-full">
                <div className="messages-container flex-1 overflow-y-auto min-h-0 overflow-x-hidden px-1">

                    {
                        messages.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-content">
                                    <div className="empty-state-icon">
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor" fillOpacity="0.1" />
                                            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="18" cy="6" r="2" fill="currentColor" fillOpacity="0.2" />
                                            <circle cx="6" cy="18" r="2" fill="currentColor" fillOpacity="0.2" />
                                        </svg>
                                    </div>
                                    <h3 className="empty-state-title">欢迎使用 AI 智能助手</h3>
                                    <p className="empty-state-description">
                                        OpenDeepWiki 基于先进的 AI 技术，为您的项目提供智能代码分析和问答服务。
                                        <br />
                                        开始对话，探索更多可能性！
                                    </p>
                                    <div className="empty-state-actions">
                                        <a
                                            href="https://github.com/AIDotNet/OpenDeepWiki"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="learn-more-link"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2C6.48 2 2 6.48 2 12C2 16.42 4.87 20.17 8.84 21.5C9.34 21.58 9.5 21.27 9.5 21C9.5 20.77 9.5 20.14 9.5 19.31C6.73 19.91 6.14 17.97 6.14 17.97C5.68 16.81 5.03 16.5 5.03 16.5C4.12 15.88 5.1 15.9 5.1 15.9C6.1 15.97 6.63 16.93 6.63 16.93C7.5 18.45 8.97 18 9.54 17.76C9.63 17.11 9.89 16.67 10.17 16.42C7.95 16.17 5.62 15.31 5.62 11.5C5.62 10.39 6 9.5 6.65 8.79C6.55 8.54 6.2 7.5 6.75 6.15C6.75 6.15 7.59 5.88 9.5 7.17C10.29 6.95 11.15 6.84 12 6.84C12.85 6.84 13.71 6.95 14.5 7.17C16.41 5.88 17.25 6.15 17.25 6.15C17.8 7.5 17.45 8.54 17.35 8.79C18 9.5 18.38 10.39 18.38 11.5C18.38 15.32 16.04 16.16 13.81 16.41C14.17 16.72 14.5 17.33 14.5 18.26C14.5 19.6 14.5 20.68 14.5 21C14.5 21.27 14.66 21.59 15.17 21.5C19.14 20.16 22 16.42 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor" />
                                            </svg>
                                            了解更多
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    {messages.map((message) => (
                        <Message
                            organizationName={organizationName}
                            repositoryName={name}
                            key={message.id}
                            messageItem={message}
                            handleDelete={handleDelete}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-container">
                    <ChatInput
                        loading={isLoading}
                        onClear={handleClear}
                        onSend={handleSendMessage}
                        onStop={handleStopGeneration}
                        onDeepResearch={() => setDeepResearch(!deepResearch)}
                        deepResearch={deepResearch}
                    />
                </div>
            </div>

            <style jsx>{`
                .workspace-container {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .messages-container::-webkit-scrollbar {
                    width: 6px;
                }

                .messages-container::-webkit-scrollbar-track {
                    background: transparent;
                }

                .messages-container::-webkit-scrollbar-thumb {
                    background: hsl(var(--border));
                    border-radius: 3px;
                }

                .messages-container::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--border) / 0.8);
                }

                .empty-state {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 400px;
                    padding: 48px 24px;
                }

                .empty-state-content {
                    text-align: center;
                    max-width: 480px;
                    padding: 48px 32px;
                }

                .empty-state-icon {
                    color: hsl(var(--primary));
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: center;
                }

                .empty-state-title {
                    font-size: 20px;
                    font-weight: 600;
                    color: hsl(var(--foreground));
                    margin: 0 0 12px 0;
                }

                .empty-state-description {
                    font-size: 14px;
                    color: hsl(var(--muted-foreground));
                    line-height: 1.6;
                    margin: 0 0 24px 0;
                }

                .empty-state-actions {
                    display: flex;
                    justify-content: center;
                }

                .learn-more-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: hsl(var(--muted));
                    color: hsl(var(--muted-foreground));
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .learn-more-link:hover {
                    background: hsl(var(--muted) / 0.8);
                    color: hsl(var(--foreground));
                }

                .chat-input-container {
                    padding: 16px;
                    border-top: 1px solid hsl(var(--border));
                    background: hsl(var(--background));
                }
            `}</style>
        </div>
    )
}