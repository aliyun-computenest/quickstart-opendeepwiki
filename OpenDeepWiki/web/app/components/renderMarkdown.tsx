import { compileMDX } from "@fumadocs/mdx-remote";
import remarkGfm from "remark-gfm";
import { rehypeCode } from 'fumadocs-core/mdx-plugins';
import { remarkImage } from 'fumadocs-core/mdx-plugins';
import { getMDXComponents } from '@/components/mdx-components';
import { TOCItemType } from "fumadocs-core/server";
import { Markdown, ThemeProvider } from "@lobehub/ui";


interface RenderMarkdownResult {
    body: any;
    toc: TOCItemType[]
}

// 手动解析markdown，提取标题作为TOC
function extractTOC(markdown: string): TOCItemType[] {
    const toc: TOCItemType[] = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;

    let match;
    while ((match = headingRegex.exec(markdown)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const slug = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');

        toc.push({
            title: text,
            url: `#${slug}`,
            depth: level
        });
    }

    return toc;
}

export default async function RenderMarkdown(props: { markdown: string }): Promise<RenderMarkdownResult> {
    if (!props.markdown) return null;

    try {

        try {
            const compiled = await compileMDX({
                source: props.markdown.replace(/```mermaid\s*(\n?)([\s\S]*?)```/g, (match, p1, p2) => {
                    return `<Mermaid chart={\`${p2}\`}/>`;
                }),
                mdxOptions: {
                    remarkPlugins: [
                        remarkGfm,
                        remarkImage,
                    ],
                    rehypePlugins: [rehypeCode],
                    rehypeCodeOptions: {
                        onError: (error) => {

                        },
                        themes: {

                        }
                    },
                    development: true,
                },
            });
            const MdxContent = compiled.body;
            return {
                body: <>
                    <MdxContent
                        components={getMDXComponents({
                        })}
                    />
                </>,
                toc: compiled.toc,
            };
        } catch (mdxError) {
            // 手动解析props.markdown，得到toc
            console.warn("MDX编译失败，使用备选解析方法:", mdxError);
            const toc = extractTOC(props.markdown);
            return {
                body: <ThemeProvider
                    themeMode='auto'
                >
                    <Markdown
                        enableCustomFootnotes={true}
                    >
                        {props.markdown}
                    </Markdown>
                </ThemeProvider>,
                toc: toc
            };
        }
    } catch (error) {
        console.error("Markdown处理错误:", error);
        // 如果整个处理过程出错，至少显示原始文本
        return {
            body: <></>,
            toc: []
        };
    }
}