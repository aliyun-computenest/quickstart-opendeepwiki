import * as React from "react"
import { FolderIcon, FileIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TreeNode {
  title: React.ReactNode
  key: string | number
  children?: TreeNode[]
  isLeaf?: boolean
  [key: string]: any // 允许附加数据
}

export interface DirectoryTreeProps {
  treeData: TreeNode[]
  onSelect?: (selectedKeys: React.Key[], info: { node: TreeNode }) => void
  defaultExpandAll?: boolean
  showIcon?: boolean
  className?: string
}

function useInitialExpanded(tree: TreeNode[], defaultExpandAll?: boolean) {
  const expandMap = React.useMemo(() => {
    const map = new Set<string | number>()
    if (defaultExpandAll) {
      const walk = (nodes: TreeNode[]) => {
        nodes.forEach((n) => {
          if (!n.isLeaf && n.children?.length) {
            map.add(n.key)
            walk(n.children)
          }
        })
      }
      walk(tree)
    }
    return map
  }, [tree, defaultExpandAll])
  return expandMap
}

export const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  treeData,
  onSelect,
  defaultExpandAll,
  showIcon = true,
  className,
}) => {
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string | number>>(
    () => useInitialExpanded(treeData, defaultExpandAll)
  )

  const handleToggle = (key: string | number) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const renderNodes = (nodes: TreeNode[]) => (
    <ul className="pl-2 space-y-1" role="tree">
      {nodes.map((node) => {
        const isLeaf = node.isLeaf || !node.children || node.children.length === 0
        const expanded = expandedKeys.has(node.key)
        return (
          <li key={node.key} role="treeitem" aria-expanded={expanded}>
            <div
              className={cn(
                "flex items-center gap-1 cursor-pointer select-none rounded-xs py-0.5 px-1 hover:bg-accent/40",
                !isLeaf && "font-medium"
              )}
              onClick={() => {
                // 点击 leaf 直接触发选择；点击文件夹先展开
                if (isLeaf) {
                  onSelect?.([node.key], { node })
                } else {
                  handleToggle(node.key)
                }
              }}
              onDoubleClick={() => {
                if (!isLeaf) return
                onSelect?.([node.key], { node })
              }}
            >
              {showIcon && (
                <span className="shrink-0 flex items-center justify-center">
                  {isLeaf ? (
                    <FileIcon className="size-3.5 text-muted-foreground" />
                  ) : expanded ? (
                    <ChevronDownIcon className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRightIcon className="size-3.5 text-muted-foreground" />
                  )}
                </span>
              )}
              <span className="truncate" onClick={() => onSelect?.([node.key], { node })}>
                {node.title}
              </span>
            </div>
            {!isLeaf && expanded && node.children && renderNodes(node.children)}
          </li>
        )
      })}
    </ul>
  )

  return <div className={cn("text-sm", className)}>{renderNodes(treeData)}</div>
}
