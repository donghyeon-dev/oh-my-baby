'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

interface AuthGuardProps {
  children: React.ReactNode
  requireParent?: boolean
}

export function AuthGuard({ children, requireParent = false }: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Don't check auth until hydrated from localStorage
    if (!_hasHydrated) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (requireParent && user?.role !== 'PARENT') {
      router.replace('/gallery')
      return
    }

    setIsChecking(false)
  }, [_hasHydrated, isAuthenticated, user, requireParent, router])

  if (!_hasHydrated || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
