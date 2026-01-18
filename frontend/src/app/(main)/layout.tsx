'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { Header } from '@/components/layout/Header'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
