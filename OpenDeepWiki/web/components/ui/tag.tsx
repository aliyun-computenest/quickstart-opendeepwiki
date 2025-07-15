import * as React from "react"
import { cn } from "@/lib/utils"

// 基于 shadcn Badge 的极简 Tag 实现
// 仅保留项目当前需要的颜色选项，避免过多配色
export interface TagProps
  extends React.ComponentProps<"span"> {
  /**
   * 颜色风格，对标 Ant Design Tag 的常用场景。
   * - green: 成功/通过
   * - blue: 常规/信息
   * - red: 错误/危险
   * - default: 中性色
   */
  color?: "green" | "blue" | "red" | "default"
}

const colorMap: Record<NonNullable<TagProps["color"]>, string> = {
  green:
    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  red: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  default: "bg-muted text-foreground/80 dark:bg-muted/50",
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ className, color = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="tag"
        className={cn(
          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap border border-transparent",
          colorMap[color],
          className
        )}
        {...props}
      />
    )
  }
)
Tag.displayName = "Tag"
