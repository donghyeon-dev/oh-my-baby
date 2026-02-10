'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { FileUploader, UploadProgressList } from '@/components/media/FileUploader'
import { mediaService } from '@/services/media'
import { UploadProgress } from '@/types'
import { useAuthStore } from '@/stores/authStore'

export default function UploadPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleFilesSelected = useCallback((files: File[]) => {
    setSelectedFiles((prev) => {
      const newFiles = files.filter(
        (file) => !prev.some((existing) => existing.name === file.name && existing.size === file.size)
      )
      return [...prev, ...newFiles]
    })

    setUploads((prev) => {
      const newUploads = files
        .filter(
          (file) => !prev.some((existing) => existing.fileName === file.name)
        )
        .map((file) => ({
          fileName: file.name,
          progress: 0,
          status: 'pending' as const,
        }))
      return [...prev, ...newUploads]
    })
  }, [])

  const handleRemoveFile = useCallback((fileName: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.name !== fileName))
    setUploads((prev) => prev.filter((upload) => upload.fileName !== fileName))
  }, [])

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0 || isUploading) return

    setIsUploading(true)
    const successCount = { value: 0 }
    const failCount = { value: 0 }

    for (const file of selectedFiles) {
      setUploads((prev) =>
        prev.map((u) => (u.fileName === file.name ? { ...u, status: 'uploading' as const, progress: 0 } : u))
      )

      try {
        await mediaService.uploadFile(file, (progress) => {
          setUploads((prev) =>
            prev.map((u) => (u.fileName === file.name ? { ...u, progress } : u))
          )
        })

        setUploads((prev) =>
          prev.map((u) =>
            u.fileName === file.name ? { ...u, status: 'success' as const, progress: 100 } : u
          )
        )
        successCount.value++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '업로드 실패'
        setUploads((prev) =>
          prev.map((u) =>
            u.fileName === file.name ? { ...u, status: 'error' as const, error: errorMessage } : u
          )
        )
        failCount.value++
      }
    }

    setIsUploading(false)
    setSelectedFiles([])

    // Navigate to gallery if any files were uploaded successfully
    if (successCount.value > 0) {
      setTimeout(() => {
        router.push('/gallery')
      }, 1500)
    }
  }, [selectedFiles, isUploading, router])

  const pendingCount = uploads.filter((u) => u.status === 'pending' || u.status === 'uploading').length
  const successCount = uploads.filter((u) => u.status === 'success').length
  const errorCount = uploads.filter((u) => u.status === 'error').length

  // Check if user has parent role
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
          <p className="text-gray-700 font-medium mb-2">업로드 권한이 없습니다</p>
          <p className="text-gray-500 text-sm">부모님만 파일을 업로드할 수 있습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">업로드</h1>
        <p className="text-gray-600 mt-1">사진과 동영상을 업로드하세요</p>
      </div>

      <div className="space-y-6">
        <FileUploader onFilesSelected={handleFilesSelected} disabled={isUploading} />

        {uploads.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-gray-800">
                업로드 목록 ({selectedFiles.length}개)
              </h2>
              {(successCount > 0 || errorCount > 0) && (
                <div className="flex gap-2 text-sm">
                  {successCount > 0 && (
                    <span className="text-green-600">{successCount}개 완료</span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-600">{errorCount}개 실패</span>
                  )}
                </div>
              )}
            </div>

            <UploadProgressList uploads={uploads} onRemove={isUploading ? undefined : handleRemoveFile} />

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFiles([])
                  setUploads([])
                }}
                disabled={isUploading}
                className="flex-1"
              >
                전체 취소
              </Button>
              <Button
                onClick={handleUpload}
                disabled={pendingCount === 0}
                isLoading={isUploading}
                className="flex-1"
              >
                {isUploading ? `업로드 중... (${successCount + errorCount}/${uploads.length})` : '업로드 시작'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
