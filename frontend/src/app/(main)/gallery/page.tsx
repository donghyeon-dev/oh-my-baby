'use client'

import { useAuthStore } from '@/stores/authStore'

export default function GalleryPage() {
  const { user } = useAuthStore()

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">갤러리</h1>
        <p className="text-gray-600 mt-1">소중한 순간을 담은 사진과 동영상</p>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
        <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-pink-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500 text-center mb-2">아직 업로드된 미디어가 없습니다</p>
        {user?.role === 'ADMIN' && (
          <a
            href="/upload"
            className="mt-4 inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            첫 번째 사진 업로드하기
          </a>
        )}
      </div>
    </div>
  )
}
