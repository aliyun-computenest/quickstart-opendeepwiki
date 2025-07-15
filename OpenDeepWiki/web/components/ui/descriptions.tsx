import * as React from "react"
import { cn } from "@/lib/utils"

interface DescriptionsProps extends React.ComponentProps<"div"> {
  /** 每行显示的列数 */
  column?: number
  /** 是否展示边框 */
  bordered?: boolean
}

interface DescriptionsItemProps extends React.ComponentProps<"div"> {
  label: React.ReactNode
  /**
   * 占据多少列（与 Antd 行为一致，指的是 label+content 单元格对的列数）
   */
  span?: number
}

const DescriptionsContext = React.createContext<{ column: number; bordered: boolean }>({
  column: 3,
  bordered: false,
})

function Descriptions({ column = 3, bordered = false, className, children, ...props }: DescriptionsProps) {
  // 将 children 展平到统一数组，方便处理 span
  const items = React.Children.toArray(children) as React.ReactElement<DescriptionsItemProps>[]

  // 生成网格模板：column 表示多少 "label+value" 对，故实际列数是 column * 2
  const totalCols = column * 2

  return (
    <DescriptionsContext.Provider value={{ column, bordered }}>
      <div
        data-slot="descriptions"
        className={cn("grid gap-0.5", bordered ? "border rounded-md overflow-hidden" : undefined, className)}
        style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
        {...props}
      >
        {items}
      </div>
    </DescriptionsContext.Provider>
  )
}

function DescriptionsItem({ label, children, span = 1, className, ...props }: DescriptionsItemProps) {
  const { bordered } = React.useContext(DescriptionsContext)
  const colSpan = span * 2 // label+value 一对

  if (!label) return null

  return (
    <React.Fragment>
      <div
        className={cn(
          "bg-muted/50 px-2 py-1 text-sm font-medium flex items-center",
          bordered ? "border border-border" : undefined
        )}
      >
        {label}
      </div>
      <div
        data-slot="descriptions-item-value"
        className={cn("px-2 py-1 text-sm col-span-1 flex items-center", bordered ? "border border-border" : undefined, className)}
        style={{ gridColumn: `span ${colSpan - 1} / span ${colSpan - 1}` }}
        {...props}
      >
        {children}
      </div>
    </React.Fragment>
  )
}

DescriptionsItem.displayName = "Descriptions.Item"

Descriptions.Item = DescriptionsItem as any // 方便外部使用 <Descriptions.Item>

export { Descriptions }
