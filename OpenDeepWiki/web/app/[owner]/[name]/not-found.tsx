import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-xl font-bold">404</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-4">
            <p>抱歉，您访问的文档不存在。</p>
            <Button asChild>
              <Link href="/">返回首页</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
} 