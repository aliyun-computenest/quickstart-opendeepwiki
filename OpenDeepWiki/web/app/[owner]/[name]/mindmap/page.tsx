'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useParams, useSearchParams } from 'next/navigation';
import { getMiniMap } from '../../../services/warehouseService';
import { useTranslation } from '../../../i18n/client';
import { Maximize, Minimize, RotateCcw, Download } from 'lucide-react';

interface MiniMapResult {
    title: string;
    url: string;
    nodes: MiniMapResult[];
}

interface MindElixirNode {
    topic: string;
    id: string;
    url?: string;
    children?: MindElixirNode[];
}

const MindMapPage: React.FC = () => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const params = useParams();
    const searchParams = useSearchParams();
    const containerRef = useRef<HTMLDivElement>(null);
    const mindRef = useRef<any>(null);

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<MiniMapResult | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const owner = params.owner as string;
    const name = params.name as string;
    const branch = searchParams.get('branch') || undefined;

    // 转换为 mind-elixir 数据格式
    const convertToMindElixirData = (miniMapData: MiniMapResult): MindElixirNode => {
        let nodeIdCounter = 0;
        
        const buildMindNode = (node: MiniMapResult): MindElixirNode => {
            const mindNode: MindElixirNode = {
                topic: node.title,
                id: `node_${nodeIdCounter++}`,
                url: node.url,
            };

            if (node.nodes && node.nodes.length > 0) {
                mindNode.children = node.nodes.map(child => buildMindNode(child));
            }

            return mindNode;
        };

        return buildMindNode(miniMapData);
    };

    // 初始化 Mind Elixir
    const initMindElixir = async (mindData: MindElixirNode) => {
        if (!containerRef.current) return;

        // 动态导入 mind-elixir
        const MindElixir = (await import('mind-elixir')).default;

        // 销毁旧实例
        if (mindRef.current) {
            mindRef.current.destroy?.();
        }

        const options = {
            el: containerRef.current,
            direction: MindElixir.SIDE, // 左右布局
            draggable: true,
            contextMenu: true,
            toolBar: false, // 隐藏工具栏，我们用自己的
            nodeMenu: true,
            keypress: true,
            locale: 'en' as const, // 使用支持的locale
            overflowHidden: false,
            mainLinkStyle: 2,
            mouseSelectionButton: 0 as const, // 鼠标左键选择
            allowFreeTransform: true, // 允许自由变换
            mouseMoveThreshold: 5, // 鼠标移动阈值
            primaryLinkStyle: 1, // 主链接样式
            primaryNodeHorizontalGap: 65, // 水平间距
            primaryNodeVerticalGap: 25, // 垂直间距
            theme: {
                name: 'Minimal',
                palette: [
                    '#0f172a', '#475569', '#64748b', '#94a3b8',
                    '#cbd5e1', '#e2e8f0', '#f1f5f9', '#f8fafc',
                    '#0ea5e9', '#06b6d4'
                ],
                cssVar: {
                    '--main-color': '#0f172a',
                    '--main-bgcolor': '#ffffff',
                    '--color': '#1e293b',
                    '--bgcolor': '#f8fafc',
                    '--panel-color': '255, 255, 255',
                    '--panel-bgcolor': '248, 250, 252',
                },
            },
        };

        const mind = new MindElixir(options);
        
        // 构建完整的数据结构
        const mindElixirData = {
            nodeData: mindData,
            linkData: {}
        };
        
        mind.init(mindElixirData);

        // 添加节点点击事件
        mind.bus.addListener('selectNode', (node: any) => {
            if(node.url){
                window.open(node.url, '_blank');
            }
        });

        // 添加操作监听
        mind.bus.addListener('operation', (operation: any) => {
            console.log('Mind map operation:', operation);
        });

        mindRef.current = mind;

        // 响应式调整
        const resizeObserver = new ResizeObserver(() => {
            if (mind && containerRef.current) {
                mind.refresh();
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            if (mind) {
                mind.destroy?.();
            }
        };
    };

    // 获取思维导图数据
    const fetchMindMapData = async () => {
        setLoading(true);
        try {
            const {data} = await getMiniMap(owner, name, branch);
            if (data.data) {
                setData(data.data);
                const mindData = convertToMindElixirData(data.data);
                setTimeout(() => initMindElixir(mindData), 100);
            } else {
                toast({
                    variant: "destructive",
                    title: "错误",
                    description: data.message || '获取思维导图数据失败',
                });
            }
        } catch (error) {
            console.error('Error fetching mind map data:', error);
            toast({
                variant: "destructive",
                title: "错误",
                description: '获取思维导图数据失败',
            });
        } finally {
            setLoading(false);
        }
    };

    // 全屏切换
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        setTimeout(() => {
            if (mindRef.current && containerRef.current) {
                mindRef.current.refresh();
            }
        }, 100);
    };

    // 刷新数据
    const refreshData = () => {
        fetchMindMapData();
    };

    // 导出为图片
    const exportImage = async () => {
        if (!mindRef.current) {
            toast({
                variant: "destructive",
                title: "错误",
                description: '思维导图未初始化',
            });
            return;
        }

        try {
            const blob = await mindRef.current.exportPng();
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${owner}-${name}-mindmap.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast({
                    title: "成功",
                    description: '导出成功',
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "错误",
                    description: '导出失败',
                });
            }
        } catch (error) {
            console.error('Export error:', error);
            toast({
                variant: "destructive",
                title: "错误",
                description: '导出失败',
            });
        }
    };

    useEffect(() => {
        fetchMindMapData();

        return () => {
            if (mindRef.current) {
                mindRef.current.destroy?.();
            }
        };
    }, [owner, name, branch]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Skeleton className="w-32 h-32" />
            </div>
        );
    }

    return (
        <div className="h-full">
            <Card className={`
                ${isFullscreen ? 'h-screen fixed top-0 left-0 w-screen z-[9999]' : 'h-[85vh]'}
                transition-all duration-300 border-border/50 shadow-sm
            `}>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">
                            {data?.title || `${owner}/${name} 思维导图`}
                        </h2>
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={refreshData}
                                        className="h-8 w-8"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>刷新</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={exportImage}
                                        className="h-8 w-8"
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>导出图片</p>
                                </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={toggleFullscreen}
                                        className="h-8 w-8"
                                    >
                                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isFullscreen ? "退出全屏" : "全屏"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className={`
                    ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[calc(85vh-80px)]'}
                    p-0 relative
                `}>
                    <div
                        ref={containerRef}
                        className={`
                            w-full h-full relative select-none
                            bg-gradient-to-br from-slate-50 to-slate-200
                            ${isFullscreen ? 'rounded-none' : 'rounded-lg'}
                        `}
                        style={{
                            touchAction: 'none',
                            WebkitUserSelect: 'none',
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                        }}
                        onMouseDown={(e) => {
                            if (e.button === 2) {
                                e.preventDefault();
                            }
                        }}
                        onTouchStart={(e) => {
                            if (e.touches.length > 1) {
                                e.preventDefault();
                            }
                        }}
                        onTouchMove={(e) => {
                            e.preventDefault();
                        }}
                        onDragStart={(e) => {
                            e.preventDefault();
                        }}
                    />

                    {/* 操作提示 */}
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded text-xs z-[1000]">
                        鼠标左键拖动 • 滚轮缩放 • 双击节点查看详情 • 右键菜单编辑
                    </div>
                </CardContent>
            </Card>

            {/* Mind Elixir CSS */}
            <style jsx global>{`
                .mind-elixir {
                    width: 100%;
                    height: 100%;
                    touch-action: none !important;
                    user-select: none !important;
                    WebkitUserSelect: none !important;
                    MozUserSelect: none !important;
                    MsUserSelect: none !important;
                }

                .mind-elixir .map-container {
                    background: transparent !important;
                    touch-action: none !important;
                    -ms-touch-action: none !important;
                    -webkit-touch-callout: none !important;
                }

                .mind-elixir .node-container {
                    cursor: pointer;
                    touch-action: none !important;
                }

                .mind-elixir .node-container:hover {
                    opacity: 0.9;
                    transform: scale(1.02);
                    transition: all 0.2s ease-in-out;
                }

                .mind-elixir .line {
                    stroke: #475569;
                    stroke-width: 1.5;
                }

                .mind-elixir .node {
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    touch-action: none !important;
                    font-family: inherit;
                }

                .mind-elixir .root {
                    background: linear-gradient(135deg, #0f172a, #1e293b) !important;
                    color: white !important;
                    font-weight: 600;
                    font-size: 16px;
                    border: none !important;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
                }

                .mind-elixir .primary {
                    background: #f8fafc !important;
                    border-color: #cbd5e1 !important;
                    color: #334155 !important;
                    font-weight: 500;
                }

                .mind-elixir .context-menu {
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    border: 1px solid #e2e8f0;
                    z-index: 9999 !important;
                    background: white;
                }

                /* 专门针对Edge浏览器的手势禁用 */
                html {
                    -ms-touch-action: none !important;
                    touch-action: none !important;
                }

                body {
                    -ms-touch-action: manipulation !important;
                    touch-action: manipulation !important;
                }

                /* 禁用Edge的右键手势 */
                * {
                    -webkit-touch-callout: none !important;
                    -webkit-user-select: none !important;
                    -khtml-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                }

                /* 允许输入框和文本区域的选择 */
                input, textarea, [contenteditable] {
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                    user-select: text !important;
                }

                /* 简约风格的滚动条 */
                .mind-elixir ::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }

                .mind-elixir ::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                }

                .mind-elixir ::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }

                .mind-elixir ::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default MindMapPage; 