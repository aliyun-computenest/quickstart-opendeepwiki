import { toast } from "@/components/ui/use-toast"

export const message = {
  success: (content: string) => toast({ title: "成功", description: content }),
  error: (content: string) => toast({ title: "错误", description: content }),
  warning: (content: string) => toast({ title: "警告", description: content }),
  info: (content: string) => toast({ title: "提示", description: content }),
}
