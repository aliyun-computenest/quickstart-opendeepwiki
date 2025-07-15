import { ChatItem } from "@/components/ui/chat-item";
import { GitIssueItem, MessageItem } from "../../../../types/chat";
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CollapsibleCard, Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { toast } from "sonner";
import { Markdown } from "@lobehub/ui";
import { Copy, MoreHorizontal, Trash2, FileText, Brain, Settings, ChevronDown, ChevronRight, Maximize2, ExternalLink, Calendar, User, Loader2 } from "lucide-react";
import { Flexbox } from "react-layout-kit";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getFileContentByLine } from "../../../../services/warehouseService";
import { cn } from "@/lib/utils";

interface AssistantMessageProps {
    messageItem: MessageItem;
    handleDelete: (messageId: string) => void;
    organizationName: string;
    repositoryName: string;
}

export default function AssistantMessage({ messageItem, handleDelete,
    organizationName,
    repositoryName
}: AssistantMessageProps) {
    // 状态管理：跟踪文件内容的展开状态和内容
    const [expandedFiles, setExpandedFiles] = useState<{ [key: string]: boolean }>({});
    const [fileContents, setFileContents] = useState<{ [key: string]: string }>({});
    const [loadingFiles, setLoadingFiles] = useState<{ [key: string]: boolean }>({});

    // 全屏模态框状态
    const [fullScreenFile, setFullScreenFile] = useState<{
        filePath: string;
        content: string;
        language: string;
        startLine: number;
        endLine: number;
    } | null>(null);

    // 根据文件扩展名确定语言类型
    const getLanguageFromFileName = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const languageMap: { [key: string]: string } = {
            'js': 'javascript',
            'jsx': 'jsx',
            'ts': 'typescript',
            'tsx': 'tsx',
            'py': 'python',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cxx': 'cpp',
            'cc': 'cpp',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'kt': 'kotlin',
            'swift': 'swift',
            'scala': 'scala',
            'sh': 'bash',
            'bash': 'bash',
            'zsh': 'zsh',
            'ps1': 'powershell',
            'sql': 'sql',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'toml': 'toml',
            'ini': 'ini',
            'cfg': 'ini',
            'conf': 'ini',
            'md': 'markdown',
            'markdown': 'markdown',
            'vue': 'vue',
            'svelte': 'svelte',
            'dockerfile': 'dockerfile',
            'makefile': 'makefile',
            'r': 'r',
            'matlab': 'matlab',
            'm': 'matlab',
            'tex': 'latex',
            'dart': 'dart',
            'lua': 'lua',
            'perl': 'perl',
            'pl': 'perl'
        };
        return languageMap[extension || ''] || 'text';
    };

    // 处理文件内容的获取和展开
    const handleFileClick = async (item: any) => {
        const fileKey = `${item.FilePath}-${item.StartLine}-${item.EndLine}`;

        if (expandedFiles[fileKey]) {
            // 如果已展开，则收起
            setExpandedFiles(prev => ({ ...prev, [fileKey]: false }));
            return;
        }

        // 如果没有内容，则获取内容
        if (!fileContents[fileKey]) {
            setLoadingFiles(prev => ({ ...prev, [fileKey]: true }));
            try {
                const { data } = await getFileContentByLine(
                    organizationName,
                    repositoryName,
                    item.FilePath
                );
                
                // 获取完整文件内容，用于显示和高亮选择的行数范围
                const fullContent = data.data || '';
                
                setFileContents(prev => ({ ...prev, [fileKey]: fullContent }));
            } catch (error) {
                console.error('获取文件内容失败:', error);
                toast.error('获取文件内容失败');
                setLoadingFiles(prev => ({ ...prev, [fileKey]: false }));
                return;
            }
            setLoadingFiles(prev => ({ ...prev, [fileKey]: false }));
        }

        // 展开文件内容
        setExpandedFiles(prev => ({ ...prev, [fileKey]: true }));
    };

    // 处理全屏显示
    const handleFullScreen = (item: any, content: string) => {
        const language = getLanguageFromFileName(item.FilePath);
        setFullScreenFile({
            filePath: item.FilePath,
            content: content,
            language: language,
            startLine: item.StartLine,
            endLine: item.EndLine,
        });
    };

    // 关闭全屏模态框
    const handleCloseFullScreen = () => {
        setFullScreenFile(null);
    };

    // 解析Markdown内容，提取thinking代码块
    const parseThinkingBlocks = (content: string) => {
        // 检查是否包含```thinking开头
        const hasThinkingStart = content.includes('<thinking>');

        if (!hasThinkingStart) {
            // 没有thinking块，返回正常文本内容
            return [{
                type: 'text',
                content: content
            }];
        }

        // 检查是否有完整的thinking块（包含结束标签）
        const thinkingRegex = /<thinking>\n([\s\S]*?)\n<\/thinking>/g;
        const parts = [];
        let lastIndex = 0;
        let match;
        let hasCompleteThinkingBlock = false;

        // 先检查是否有完整的thinking块
        while ((match = thinkingRegex.exec(content)) !== null) {
            hasCompleteThinkingBlock = true;

            // 添加thinking块之前的内容
            if (match.index > lastIndex) {
                const beforeContent = content.slice(lastIndex, match.index).trim();
                if (beforeContent) {
                    parts.push({
                        type: 'text',
                        content: beforeContent
                    });
                }
            }

            // 添加thinking块
            parts.push({
                type: 'thinking',
                content: match[1].trim()
            });

            lastIndex = match.index + match[0].length;
        }

        // 如果有完整的thinking块
        if (hasCompleteThinkingBlock) {
            // 添加最后剩余的内容
            if (lastIndex < content.length) {
                const remainingContent = content.slice(lastIndex).trim();
                if (remainingContent) {
                    parts.push({
                        type: 'text',
                        content: remainingContent
                    });
                }
            }
            return parts;
        }

        // 如果有```thinking开头但没有完整的闭合标签，说明是正在输出的thinking内容
        // 提取```thinking之后的所有内容作为推理内容
        const thinkingStartIndex = content.indexOf('<thinking>');
        const beforeThinking = content.slice(0, thinkingStartIndex).trim();
        const thinkingContent = content.slice(thinkingStartIndex + '<thinking>'.length).replace(/^\n/, '').trim();

        const result = [];

        // 添加thinking之前的内容
        if (beforeThinking) {
            result.push({
                type: 'text',
                content: beforeThinking
            });
        }

        // 添加正在输出的thinking内容
        if (thinkingContent) {
            result.push({
                type: 'thinking',
                content: thinkingContent
            });
        }

        return result.length > 0 ? result : [{
            type: 'text',
            content: content
        }];
    };

    // 渲染思考组件
    const renderThinkingComponent = (content: string, index: number) => {
        return (
            <CollapsibleCard
                defaultOpen={true}
                variant="accent"
                className="mb-2"
                title={
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Brain size={14} />
                        思考过程
                    </div>
                }
            >
                <div className="max-h-72 overflow-y-auto">
                    <Markdown
                        fontSize={12}
                        children={content}
                        enableMermaid
                        enableImageGallery
                        enableLatex
                        enableCustomFootnotes
                    />
                </div>
            </CollapsibleCard>
        );
    };

    const renderToolCalls = (toolCall: any) => {
        const renderArguments = (type: string) => {
            try {
                const parsedArgs = JSON.parse(toolCall.arguments);
                if (type === 'fileFromLine') {
                    if (parsedArgs.items) {
                        return (
                            <div className="flex flex-col gap-1.5">
                                {parsedArgs.items.map((item: any, index: number) => {
                                    const fileKey = `${item.FilePath}-${item.StartLine}-${item.EndLine}`;
                                    const isExpanded = expandedFiles[fileKey];
                                    const isLoading = loadingFiles[fileKey];
                                    const content = fileContents[fileKey];
                                    const language = getLanguageFromFileName(item.FilePath);

                                    return (
                                        <div key={index} className="border border-border rounded-lg overflow-hidden">
                                            <div
                                                onClick={() => handleFileClick(item)}
                                                className={cn(
                                                    "cursor-pointer flex items-center justify-between p-1.5 px-2 transition-colors",
                                                    isExpanded ? "bg-primary/5" : "bg-muted/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText size={14} className="text-primary" />
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="text-foreground font-medium w-3/4 overflow-hidden text-ellipsis whitespace-nowrap">
                                                                    {item.FilePath}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{item.FilePath}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <span className="text-muted-foreground text-xs">
                                                        {item.StartLine} - {item.EndLine} 行
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {isLoading && <Skeleton className="h-4 w-4 rounded-full" />}
                                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </div>
                                            </div>
                                            {isExpanded && content && (
                                                <div className="relative max-h-[400px] overflow-y-auto text-xs">
                                                    <div className="absolute top-2 right-2 z-10 flex gap-1">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="h-6 w-6 bg-background/80 backdrop-blur-sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleFullScreen(item, content);
                                                                        }}
                                                                    >
                                                                        <Maximize2 size={14} />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>全屏查看</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                    <SyntaxHighlighter
                                                        language={language}
                                                        style={vs}
                                                        showLineNumbers={true}
                                                        startingLineNumber={1}
                                                        wrapLines={true}
                                                        lineProps={(lineNumber) => {
                                                            const actualLineNumber = lineNumber;
                                                            const isInRange = actualLineNumber >= item.StartLine && actualLineNumber <= item.EndLine;
                                                            return {
                                                                style: {
                                                                    backgroundColor: isInRange ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                                                                    borderLeft: isInRange ? '3px solid hsl(var(--primary))' : 'none',
                                                                    paddingLeft: isInRange ? '5px' : '8px',
                                                                    display: 'block',
                                                                    width: '100%',
                                                                }
                                                            };
                                                        }}
                                                        customStyle={{
                                                            margin: 0,
                                                            borderRadius: 0,
                                                            fontSize: '12px',
                                                            lineHeight: '1.4',
                                                        }}
                                                        codeTagProps={{
                                                            style: {
                                                                fontSize: '12px',
                                                                fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                                                            }
                                                        }}
                                                    >
                                                        
                                                        {content}
                                                    </SyntaxHighlighter>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    }
                } else if (type === 'fileInfo') {
                    if (parsedArgs.filePath && Array.isArray(parsedArgs.filePath)) {
                        return (
                            <div className="flex flex-col gap-2">
                                {parsedArgs.filePath.map((path: string, index: number) => (
                                    <div key={index} className="border border-border rounded-lg overflow-hidden">
                                        <div className="p-2 bg-muted/50 flex items-center gap-2 text-xs">
                                            <FileText size={14} className="text-primary" />
                                            <span className="text-foreground font-medium flex-1">
                                                {path}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                文件信息
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    }
                } else if (type === 'ragSearch') {
                    return (
                        <div className="flex flex-col gap-2">
                            <span>RAG搜索</span>
                            <pre className="bg-muted p-2 rounded-md text-xs text-muted-foreground overflow-auto border">
                                {toolCall.arguments}
                            </pre>
                        </div>
                    );
                } else if (type === 'githubSearchIssues' || type === 'giteeSearchIssues') {
                    // 处理GitHub或Gitee Issues搜索结果
                    let parsedArgs: any = null;

                    // 首先尝试从 toolResult 中解析数据
                    if (toolCall.toolResult) {
                        try {
                            const resultData = JSON.parse(toolCall.toolResult);
                            if (resultData.GitIssues) {
                                parsedArgs = { GitIssues: resultData.GitIssues };
                            }
                        } catch (error) {
                            console.error('解析 toolResult 失败:', error);
                        }
                    }

                    // 如果 toolResult 中没有数据，则从 arguments 中解析
                    if (!parsedArgs) {
                        try {
                            parsedArgs = JSON.parse(toolCall.arguments);
                        } catch (error) {
                            console.error('解析 arguments 失败:', error);
                        }
                    }

                    if (parsedArgs && parsedArgs.GitIssues && Array.isArray(parsedArgs.GitIssues)) {
                        return (
                            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto">
                                {parsedArgs.GitIssues.map((issue: GitIssueItem, index: number) => (
                                    <div key={index} className="rounded-lg p-3 bg-muted/30 transition-all duration-200">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4
                                                    onClick={() => window.open(issue.urlHtml, '_blank')}
                                                    className="m-0 text-sm font-semibold text-primary cursor-pointer leading-tight mb-1 hover:underline"
                                                >
                                                    {issue.title}
                                                </h4>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5">
                                                    {issue.number && (
                                                        <span className="font-medium text-muted-foreground">
                                                            #{issue.number}
                                                        </span>
                                                    )}
                                                    {issue.state && (
                                                        <Badge
                                                            variant={issue.state === 'open' ? 'success' : 'secondary'}
                                                            className="text-xs px-2 py-1 rounded-full"
                                                        >
                                                            {issue.state}
                                                        </Badge>
                                                    )}
                                                    {issue.author && (
                                                        <div className="flex items-center gap-1">
                                                            <User size={12} />
                                                            <span>{issue.author}</span>
                                                        </div>
                                                    )}
                                                    {issue.createdAt && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} />
                                                            <span>
                                                                {new Date(issue.createdAt).toLocaleDateString('zh-CN')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {issue.content && (
                                            <div className="text-xs text-muted-foreground leading-relaxed bg-background p-2 rounded border max-h-[120px] overflow-y-auto">
                                                {issue.content.length > 200
                                                    ? `${issue.content.substring(0, 200)}...`
                                                    : issue.content
                                                }
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {parsedArgs.GitIssues.length === 0 && (
                                    <div className="text-center py-5 text-muted-foreground text-xs">
                                        没有找到相关的Issues
                                    </div>
                                )}
                            </div>
                        );
                    }
                    // 如果不是标准格式，回退到原始显示
                    return (
                        <pre className="bg-muted p-2 rounded-md text-xs text-muted-foreground overflow-auto border">
                            {toolCall.arguments}
                        </pre>
                    );
                } else {
                    return (
                        <pre className="bg-muted p-2 rounded-md text-xs text-muted-foreground overflow-auto border">
                            {toolCall.arguments}
                        </pre>
                    );
                }
            } catch (error) {
                return (
                    <div className="flex items-center justify-center p-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="ml-2 text-muted-foreground">处理中...</span>
                    </div>
                );
            }
        };

        const getToolInfo = (functionName: string) => {
            if (functionName === 'FileFunction-FileFromLine') {
                return { label: '读取文件内容', color: 'text-green-600 dark:text-green-400' };
            } else if (functionName === 'FileFunction-FileInfo') {
                return { label: '获取文件信息', color: 'text-blue-600 dark:text-blue-400' };
            }
            else if (functionName === 'RagFunction-RagSearch') {
                return { label: 'RAG搜索', color: 'text-purple-600 dark:text-purple-400' };
            }
            else if (functionName === 'Github-SearchIssues') {
                return { label: 'GitHub Issues搜索', color: 'text-gray-700 dark:text-gray-300' };
            }
            else if (functionName === 'Gitee-SearchIssues') {
                return { label: 'Gitee Issues搜索', color: 'text-red-600 dark:text-red-400' };
            }
            else {
                return { label: functionName, color: 'text-purple-600 dark:text-purple-400' };
            }
        };

        const toolInfo = getToolInfo(toolCall.functionName);

        let functionType;

        if (toolCall.functionName === 'FileFunction-FileFromLine') {
            functionType = 'fileFromLine';
            return renderArguments(functionType);
        } else if (toolCall.functionName === 'FileFunction-FileInfo') {
            functionType = 'fileInfo';
            return renderArguments(functionType);
        } else if (toolCall.functionName === 'RagFunction-RagSearch') {
            functionType = 'ragSearch';
        } else if (toolCall.functionName === 'Github-SearchIssues') {
            functionType = 'githubSearchIssues';
            return renderArguments(functionType);
        } else if (toolCall.functionName === 'Gitee-SearchIssues') {
            functionType = 'giteeSearchIssues';
            return renderArguments(functionType);
        } else {
            functionType = 'other';
        }


        return (
            <CollapsibleCard
                variant="accent"
                className="rounded-lg overflow-hidden"
                title={
                    <div className={cn("flex items-center gap-1 font-medium", toolInfo.color)}>
                        {toolInfo.label}
                    </div>
                }
            >
                <Flexbox className="overflow-auto max-h-44">
                    {renderArguments(functionType)}
                </Flexbox>
            </CollapsibleCard>
        );
    }

    const renderMessage = () => {
        // 从content数组中提取不同类型的内容
        const allContent = messageItem.content as any[];

        return (
            <Flexbox>
                {allContent.map((contentItem, index) => {
                    switch (contentItem.type) {
                        case 'reasoning':
                            return (
                                <CollapsibleCard
                                    key={`reasoning-${index}`}
                                    defaultOpen={true}
                                    variant="accent"
                                    className="bg-primary/5 dark:bg-primary/10 rounded-lg overflow-hidden"
                                    title={
                                        <div className="flex items-center font-medium">
                                            推理内容
                                        </div>
                                    }
                                >
                                    <div className="max-h-72 overflow-y-auto">
                                        <Markdown
                                            fontSize={12}
                                            children={contentItem.content || ''}
                                            enableMermaid
                                            enableImageGallery
                                            enableLatex
                                            enableCustomFootnotes
                                        />
                                    </div>
                                </CollapsibleCard>
                            );

                        case 'tool':
                            return (
                                <div key={`tool-${index}`}>
                                    {renderToolCalls({
                                        id: contentItem.toolId,
                                        functionName: contentItem.toolName || 'Unknown',
                                        arguments: contentItem.toolArgs || '',
                                        toolResult: contentItem.toolResult || '',
                                    })}
                                </div>
                            );

                        case 'text':
                            return (
                                <div key={`text-${index}`}>
                                    {!contentItem.content || contentItem.content === '' ? (
                                        <div className="rounded-lg p-3 min-h-[60px] flex items-center justify-center">
                                            <div className="flex items-center gap-3 text-muted-foreground">
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>正在思考中...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {parseThinkingBlocks(contentItem.content).map((part, partIndex) => {
                                                if (part.type === 'thinking') {
                                                    return renderThinkingComponent(part.content, partIndex);
                                                } else {
                                                    return (
                                                        <Markdown
                                                            key={partIndex}
                                                            fontSize={12}
                                                            children={part.content}
                                                            enableMermaid
                                                            enableImageGallery
                                                            enableCustomFootnotes
                                                            enableLatex
                                                        />
                                                    );
                                                }
                                            })}
                                        </>
                                    )}
                                </div>
                            );

                        case 'image':
                            return contentItem.imageContents && contentItem.imageContents.length > 0 ? (
                                <div key={`image-${index}`} className="flex flex-wrap gap-2 mb-2">
                                    {contentItem.imageContents.map((image: any, imgIndex: number) => (
                                        <div 
                                            key={imgIndex} 
                                            className="relative group cursor-pointer"
                                            onClick={() => window.open(`data:${image.mimeType};base64,${image.data}`, '_blank')}
                                        >
                                            <img
                                                src={`data:${image.mimeType};base64,${image.data}`}
                                                alt="AI生成的图片"
                                                className="max-w-[200px] max-h-[200px] rounded-md border border-border object-contain hover:opacity-90 transition-opacity"
                                            />
                                            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                <span className="text-foreground text-xs">点击查看大图</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null;

                        case 'git_issues':
                            return contentItem.gitIssues && contentItem.gitIssues.length > 0 ? (
                                <CollapsibleCard
                                    key={`git-issues-${index}`}
                                    defaultOpen={true}
                                    variant="accent"
                                    className="bg-primary/5 dark:bg-primary/10 rounded-lg overflow-hidden mb-2"
                                    title={
                                        <div className="flex items-center gap-2 font-medium text-primary">
                                            <ExternalLink size={16} />
                                            Issues 搜索结果 ({contentItem.gitIssues.length} 条)
                                        </div>
                                    }
                                >
                                    <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto px-2 pb-2">
                                        {contentItem.gitIssues.map((issue: any, issueIndex: number) => (
                                            <div key={issueIndex} className="rounded-lg p-3 transition-all duration-200 hover:bg-muted/50">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h4
                                                            onClick={() => window.open(issue.urlHtml, '_blank')}
                                                            className="m-0 text-sm font-semibold text-primary cursor-pointer leading-tight mb-1 hover:underline"
                                                        >
                                                            {issue.title}
                                                        </h4>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1.5">
                                                            {issue.number && (
                                                                <span className="font-medium text-muted-foreground">
                                                                    #{issue.number}
                                                                </span>
                                                            )}
                                                            {issue.state && (
                                                                <Badge
                                                                    variant={issue.state === 'open' ? 'success' : 'secondary'}
                                                                    className="text-xs px-2 py-1 rounded-full"
                                                                >
                                                                    {issue.state}
                                                                </Badge>
                                                            )}
                                                            {issue.author && (
                                                                <div className="flex items-center gap-1">
                                                                    <User size={12} />
                                                                    <span>{issue.author}</span>
                                                                </div>
                                                            )}
                                                            {issue.createdAt && (
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    <span>
                                                                        {new Date(issue.createdAt).toLocaleDateString('zh-CN')}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {issue.content && (
                                                    <div className="text-xs text-muted-foreground leading-relaxed bg-background p-2 rounded border max-h-[120px] overflow-y-auto">
                                                        {issue.content.length > 200
                                                            ? `${issue.content.substring(0, 200)}...`
                                                            : issue.content
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {contentItem.gitIssues.length === 0 && (
                                            <div className="text-center py-5 text-muted-foreground text-xs">
                                                没有找到相关的Issues
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleCard>
                            ) : null;

                        default:
                            return (
                                <div key={`other-${index}`} className="bg-muted rounded-lg p-3 text-muted-foreground text-xs">
                                    <div className="font-medium mb-1">
                                        未知内容类型: {contentItem.type}
                                    </div>
                                    <pre className="m-0 font-inherit">
                                        {JSON.stringify(contentItem, null, 2)}
                                    </pre>
                                </div>
                            );
                    }
                })}
            </Flexbox>
        )
    }

    const handleCopyClick = () => {
        // 提取所有文本和推理内容进行复制
        const allContent = messageItem.content as any[];
        const textContent = allContent
            .filter(item => item.type === 'text' || item.type === 'reasoning')
            .map(item => item.content || '')
            .join('\n\n');
        navigator.clipboard.writeText(textContent);
        toast.success('已复制到剪贴板');
    }

    const renderActions = () => {
        return (
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyClick}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                    <Copy size={14} />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(messageItem.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                    <Trash2 size={14} />
                </Button>
            </div>
        )
    }

    return (
        <>
            <ChatItem
                className="assistant-message"
                actions={renderActions}
                renderMessage={renderMessage}
                key={messageItem.id}
                role="assistant"
            />

            <Dialog open={!!fullScreenFile} onOpenChange={(open) => !open && handleCloseFullScreen()}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-base font-medium">
                            <FileText size={18} className="text-primary" />
                            <span className="flex-1 truncate">{fullScreenFile?.filePath}</span>
                            <span className="text-sm text-muted-foreground font-normal">
                                ({fullScreenFile?.startLine} - {fullScreenFile?.endLine} 行)
                            </span>
                        </DialogTitle>
                    </DialogHeader>
                    {fullScreenFile && (
                        <div className="h-[75vh] overflow-auto">
                            <SyntaxHighlighter
                                language={fullScreenFile.language}
                                style={vs}
                                showLineNumbers={true}
                                startingLineNumber={1}
                                wrapLines={true}
                                lineProps={(lineNumber) => {
                                    const actualLineNumber = lineNumber;
                                    const isInRange = actualLineNumber >= fullScreenFile.startLine && actualLineNumber <= fullScreenFile.endLine;
                                    return {
                                        style: {
                                            backgroundColor: isInRange ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                                            borderLeft: isInRange ? '3px solid hsl(var(--primary))' : 'none',
                                            paddingLeft: isInRange ? '5px' : '8px',
                                            display: 'block',
                                            width: '100%',
                                        }
                                    };
                                }}
                                customStyle={{
                                    margin: 0,
                                    borderRadius: 0,
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    height: '100%',
                                    overflow: 'auto',
                                    backgroundColor: 'transparent',
                                }}
                                codeTagProps={{
                                    style: {
                                        fontSize: '14px',
                                        fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                                    }
                                }}
                            >
                                {fullScreenFile.content}
                            </SyntaxHighlighter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}