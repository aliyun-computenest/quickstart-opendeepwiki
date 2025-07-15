import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"

export interface ModalProps {
  open: boolean
  title?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  onCancel?: () => void
  /** Tailwind 的宽度，如 800px 可用 style */
  width?: number | string
  /** 额外传递给 DialogContent 的样式 */
  bodyStyle?: React.CSSProperties
  style?: React.CSSProperties
}

export function Modal({
  open,
  title,
  children,
  footer,
  onCancel,
  width,
  bodyStyle,
  style,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel?.()}>
      <DialogContent style={{ width, ...style, ...bodyStyle }}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

// 一个极简 confirm 实现，使用浏览器原生 confirm。
// 注：此实现阻塞且简陋，仅用于兼容现有代码。
Modal.confirm = function ({
  title,
  content,
  okText = "确定",
  cancelText = "取消",
  onOk,
  onCancel,
}: {
  title?: string
  content?: string
  okText?: string
  cancelText?: string
  onOk?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
}) {
  const result = window.confirm(`${title ? title + "\n" : ""}${content ?? ""}`)
  if (result) {
    onOk?.()
  } else {
    onCancel?.()
  }
}
