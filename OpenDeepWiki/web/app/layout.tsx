'use client'

import './globals.css'
import { Toaster as UIToaster } from "@/components/ui/toaster"
import { Toaster } from "sonner"
import { RootProvider } from 'fumadocs-ui/provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <RootProvider>
          {children}
        </RootProvider>
        <UIToaster />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}