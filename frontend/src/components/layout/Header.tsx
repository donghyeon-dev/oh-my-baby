'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import authService from '@/services/auth'
import { LogOut, User, Upload, Image, Menu, X, Users } from 'lucide-react'
import { NotificationBell } from '@/components/notification/NotificationBell'

export function Header() {
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (e) {
      // Ignore errors
    } finally {
      logout()
      router.push('/login')
    }
  }

  if (!isAuthenticated) return null

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/gallery" className="text-xl font-bold text-pink-500">
            Oh My Baby
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/gallery"
              className="flex items-center text-gray-600 hover:text-pink-500 transition-colors"
            >
              <Image className="w-5 h-5 mr-1" />
              갤러리
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                href="/upload"
                className="flex items-center text-gray-600 hover:text-pink-500 transition-colors"
              >
                <Upload className="w-5 h-5 mr-1" />
                업로드
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link
                href="/family"
                className="flex items-center text-gray-600 hover:text-pink-500 transition-colors"
              >
                <Users className="w-5 h-5 mr-1" />
                가족
              </Link>
            )}
            <NotificationBell />
            <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-600">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-500 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-100">
            <div className="space-y-3">
              <Link
                href="/gallery"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center px-2 py-2 text-gray-600 hover:bg-pink-50 rounded-lg"
              >
                <Image className="w-5 h-5 mr-3" />
                갤러리
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  href="/upload"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center px-2 py-2 text-gray-600 hover:bg-pink-50 rounded-lg"
                >
                  <Upload className="w-5 h-5 mr-3" />
                  업로드
                </Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link
                  href="/family"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center px-2 py-2 text-gray-600 hover:bg-pink-50 rounded-lg"
                >
                  <Users className="w-5 h-5 mr-3" />
                  가족
                </Link>
              )}
              <div className="px-2 py-2">
                <NotificationBell />
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center">
                    <User className="w-5 h-5 mr-3 text-gray-400" />
                    <span className="text-gray-600">{user?.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-red-500"
                  >
                    <LogOut className="w-5 h-5 mr-1" />
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
