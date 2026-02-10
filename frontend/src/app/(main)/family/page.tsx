'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { userService } from '@/services/user'
import { User } from '@/types'
import { Users, Shield, Eye } from 'lucide-react'

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`
  return `${Math.floor(diffDays / 365)}년 전`
}

export default function FamilyPage() {
  const { user } = useAuthStore()
  const [members, setMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role !== 'PARENT') return

    const fetchMembers = async () => {
      try {
        const users = await userService.getAllUsers()
        setMembers(users)
      } catch (e) {
        setError('가족 목록을 불러오는데 실패했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [user?.role])

  if (user?.role !== 'PARENT') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-gray-700 font-medium mb-2">접근 권한이 없습니다</p>
          <p className="text-gray-500 text-sm">부모님만 가족 목록을 볼 수 있습니다</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-red-500 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-pink-500 hover:text-pink-600 text-sm"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">가족</h1>
        <p className="text-gray-600 mt-1">등록된 가족 구성원 {members.length}명</p>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center">
                <span className="text-pink-500 font-bold text-lg">
                  {member.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{member.name}</span>
                  {member.role === 'PARENT' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
                      <Shield className="w-3 h-3" />
                      부모님
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      <Eye className="w-3 h-3" />
                      가족
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              {member.lastLoginAt ? (
                <span>최근 접속: {formatRelativeTime(member.lastLoginAt)}</span>
              ) : (
                <span>접속 기록 없음</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
