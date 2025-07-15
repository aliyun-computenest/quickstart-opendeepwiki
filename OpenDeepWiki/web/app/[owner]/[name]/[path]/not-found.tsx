import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground mb-6">抱歉，您访问的文档不存在。</p>
        <Button asChild>
          <Link href="/">返回首页</Link>
        </Button>
      </div>
    </div>
  );
} 