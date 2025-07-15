'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Send, Loader2 } from 'lucide-react';
import { createChatShareMessage } from '../services/chatShareMessageServce';
import { useIsMobile } from '@/hooks/use-mobile';

interface AIInputBarProps {
    owner: string;
    name: string;
    branch?: string;
    className?: string;
}

// OpenAI Logo SVG组件
const OpenAILogo: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <svg
        fill="currentColor" height="34" viewBox="0 0 24 24" width="64"
        xmlns="http://www.w3.org/2000/svg"
        style={{
            display: 'flex',
            lineHeight: '1',
        }}>
        <title>OpenAI</title>
        <path d="M21.55 10.004a5.416 5.416 0 00-.478-4.501c-1.217-2.09-3.662-3.166-6.05-2.66A5.59 5.59 0 0010.831 1C8.39.995 6.224 2.546 5.473 4.838A5.553 5.553 0 001.76 7.496a5.487 5.487 0 00.691 6.5 5.416 5.416 0 00.477 4.502c1.217 2.09 3.662 3.165 6.05 2.66A5.586 5.586 0 0013.168 23c2.443.006 4.61-1.546 5.361-3.84a5.553 5.553 0 003.715-2.66 5.488 5.488 0 00-.693-6.497v.001zm-8.381 11.558a4.199 4.199 0 01-2.675-.954c.034-.018.093-.05.132-.074l4.44-2.53a.71.71 0 00.364-.623v-6.176l1.877 1.069c.02.01.033.029.036.05v5.115c-.003 2.274-1.87 4.118-4.174 4.123zM4.192 17.78a4.059 4.059 0 01-.498-2.763c.032.02.09.055.131.078l4.44 2.53c.225.13.504.13.73 0l5.42-3.088v2.138a.068.068 0 01-.027.057L9.9 19.288c-1.999 1.136-4.552.46-5.707-1.51h-.001zM3.023 8.216A4.15 4.15 0 015.198 6.41l-.002.151v5.06a.711.711 0 00.364.624l5.42 3.087-1.876 1.07a.067.067 0 01-.063.005l-4.489-2.559c-1.995-1.14-2.679-3.658-1.53-5.63h.001zm15.417 3.54l-5.42-3.088L14.896 7.6a.067.067 0 01.063-.006l4.489 2.557c1.998 1.14 2.683 3.662 1.529 5.633a4.163 4.163 0 01-2.174 1.807V12.38a.71.71 0 00-.363-.623zm1.867-2.773a6.04 6.04 0 00-.132-.078l-4.44-2.53a.731.731 0 00-.729 0l-5.42 3.088V7.325a.068.068 0 01.027-.057L14.1 4.713c2-1.137 4.555-.46 5.707 1.513.487.833.664 1.809.499 2.757h.001zm-11.741 3.81l-1.877-1.068a.065.065 0 01-.036-.051V6.559c.001-2.277 1.873-4.122 4.181-4.12.976 0 1.92.338 2.671.954-.034.018-.092.05-.131.073l-4.44 2.53a.71.71 0 00-.365.623l-.003 6.173v.002zm1.02-2.168L12 9.25l2.414 1.375v2.75L12 14.75l-2.415-1.375v-2.75z"></path></svg>
);

const AIInputBar: React.FC<AIInputBarProps> = ({ owner, name, branch, className }) => {
    const isMobile = useIsMobile();
    const [isLoading, setIsLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [deepResearch, setDeepResearch] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = async () => {
        if (inputValue.trim() && !isLoading) {
            setIsLoading(true);

            const warehouseId = await createChatShareMessage({
                isDeep: deepResearch,
                owner: owner,
                name: name,
                message: inputValue,
                branch: branch,
            });

            window.open(`/search/${warehouseId.data.data}`)

            setInputValue('');
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 深入推理开关的标签
    const researchLabel = !isMobile ? '深入推理' : '';

    return (
        <TooltipProvider>
            <div className={`fixed right-5 bottom-20 z-50 ${className || ''}`}>
                <div className="bg-background border rounded-lg shadow-lg p-4 min-w-[320px] max-w-[400px]">
                    <div className="flex flex-col space-y-4">
                        <Textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="输入问题..."
                            disabled={isLoading}
                            className="min-h-[40px] max-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0"
                            rows={1}
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={deepResearch}
                                    onCheckedChange={setDeepResearch}
                                    disabled={isLoading}
                                />
                                {researchLabel && (
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                        {researchLabel}
                                    </span>
                                )}
                            </div>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={handleSend}
                                        disabled={isLoading || !inputValue.trim()}
                                        size="icon"
                                        className="rounded-full"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>发送消息</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
};

export default AIInputBar; 