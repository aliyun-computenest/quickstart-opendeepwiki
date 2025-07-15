export interface ResponsesMessage {
    role: 'user' | 'assistant' | 'system';
    content: MessageContentItem[] | MessageContentToolItem[] | MessageContentImageItem[] | MessageContentCodeItem[] | MessageContentTableItem[] | MessageContentLinkItem[] | MessageContentFileItem[] | MessageContentAudioItem[];
}

export interface ResponsesInput {
    organizationName: string;
    name: string;
    messages: ResponsesMessage[];
}

export interface StreamEvent {
    type: 'reasoning_start' | 'reasoning_content' | 'reasoning_end' | 'tool_call' | 'message_start' | 'message_content' | 'message_end' | 'done' | 'git_issues';
    content?: string;
    tool_call_id?: string;
    function_name?: string;
    function_arguments?: string;
    git_issues?: GitIssueItem[];
}


export interface MessageItem {
    id: string;
    content: MessageContentItem[] | MessageContentToolItem[] | MessageContentImageItem[] | MessageContentCodeItem[] | MessageContentTableItem[] | MessageContentLinkItem[] | MessageContentFileItem[] | MessageContentAudioItem[] | MessageContentReasoningItem[] | MessageContentGitIssuesItem[];
    role: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum MessageContentType {
    Text = 'text',
    Tool = 'tool',
    Image = 'image',
    Code = 'code',
    Table = 'table',
    Link = 'link',
    File = 'file',
    Audio = 'audio',
    Video = 'video',
    Reasoning = 'reasoning',
    GitIssues = 'git_issues',
}

export interface MessageContentItem {
}

export interface MessageContentTextItem extends MessageContentItem {
    type: MessageContentType.Text;
    content: string;
}

export interface MessageContentToolItem extends MessageContentItem {
    type: MessageContentType.Tool;
    toolId: string;
    toolResult: string;
    toolArgs: string;
    toolName: string;
}

export interface MessageContentImageItem extends MessageContentItem {
    type: MessageContentType.Image;
    imageContents: Base64Content[];
}

export interface MessageContentCodeItem extends MessageContentItem {
    type: MessageContentType.Code;
}

export interface MessageContentTableItem extends MessageContentItem {
    type: MessageContentType.Table;
    table: string;
}

export interface MessageContentLinkItem extends MessageContentItem {
    type: MessageContentType.Link;
    link: string;
}

export interface MessageContentFileItem extends MessageContentItem {
    type: MessageContentType.File;
    file: string;
}

export interface MessageContentAudioItem extends MessageContentItem {
    type: MessageContentType.Audio;
    audio: string;
}

export interface MessageContentReasoningItem extends MessageContentItem {
    type: MessageContentType.Reasoning;
    content: string;
}

export interface MessageContentGitIssuesItem extends MessageContentItem {
    type: MessageContentType.GitIssues;
    gitIssues: GitIssueItem[];
}

export interface GitIssueItem {
    title: string;
    url: string;
    content: string;
    createdAt?: string;
    author: string;
    urlHtml: string;
    state: string;
    number: string;
}

export interface Base64Content {
    data: string;
    mimeType: string;
}