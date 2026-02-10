'use client'

import { useState, useCallback, useRef } from 'react'
import { MediaGrid } from '@/components/media/MediaGrid'
import { MediaViewer } from '@/components/media/MediaViewer'
import { Media, MediaFilters } from '@/types'
import { mediaService } from '@/services/media'

type TabType = 'ALL' | 'PHOTO' | 'VIDEO'

export default function GalleryPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('ALL')

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerMedia, setViewerMedia] = useState<Media[]>([])

  // Download state
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })

  // Reference to all media for batch download
  const allMediaRef = useRef<Media[]>([])

  // Build filters based on active tab
  const filters: MediaFilters | undefined = activeTab === 'ALL'
    ? undefined
    : { type: activeTab }

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    // Clear selection when changing tabs
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  // Handle media click (open viewer)
  const handleMediaClick = useCallback((media: Media, index: number, allMedia: Media[]) => {
    allMediaRef.current = allMedia
    setViewerMedia(allMedia)
    setViewerIndex(index)
    setViewerOpen(true)
  }, [])

  // Handle selection change
  const handleSelectionChange = useCallback((newSelectedIds: Set<string>) => {
    setSelectedIds(newSelectedIds)
  }, [])

  // Toggle selection mode
  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Exiting selection mode - clear selections
      setSelectedIds(new Set())
    }
    setSelectionMode(!selectionMode)
  }

  // Handle batch download
  const handleBatchDownload = async () => {
    if (selectedIds.size === 0) return

    setDownloading(true)
    setDownloadProgress({ current: 0, total: selectedIds.size })

    const ids = Array.from(selectedIds)
    const blobUrls: string[] = []

    for (let i = 0; i < ids.length; i++) {
      setDownloadProgress({ current: i + 1, total: ids.length })
      try {
        const media = allMediaRef.current.find(m => m.id === ids[i])
        const url = await mediaService.getDownloadUrl(ids[i])
        const response = await fetch(url)
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        blobUrls.push(blobUrl)

        const link = document.createElement('a')
        link.href = blobUrl
        link.download = media?.originalName || 'download'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Wait longer between downloads so the browser doesn't block them
        if (i < ids.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      } catch (err) {
        console.error('Download failed:', ids[i], err)
      }
    }

    // Revoke all blob URLs after all downloads have started
    setTimeout(() => {
      blobUrls.forEach(url => URL.revokeObjectURL(url))
    }, 10000)

    setDownloading(false)
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  // Close viewer
  const handleCloseViewer = () => {
    setViewerOpen(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        {selectionMode ? (
          // Selection mode header
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-800">
              {selectedIds.size}개 선택됨
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectionMode}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleBatchDownload}
                disabled={selectedIds.size === 0 || downloading}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                다운로드
              </button>
            </div>
          </div>
        ) : (
          // Normal header
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">갤러리</h1>
              <p className="text-gray-600 mt-1">소중한 순간을 담은 사진과 동영상</p>
            </div>
            <button
              onClick={toggleSelectionMode}
              className="px-4 py-2 text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
            >
              선택
            </button>
          </div>
        )}
      </div>

      {/* Type filter tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => handleTabChange('ALL')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'ALL'
                ? 'text-pink-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            전체
            {activeTab === 'ALL' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
          <button
            onClick={() => handleTabChange('PHOTO')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'PHOTO'
                ? 'text-pink-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            사진
            {activeTab === 'PHOTO' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
          <button
            onClick={() => handleTabChange('VIDEO')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'VIDEO'
                ? 'text-pink-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            동영상
            {activeTab === 'VIDEO' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
            )}
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <MediaGrid
        filters={filters}
        selectable={selectionMode}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onMediaClick={handleMediaClick}
      />

      {/* Media Viewer Modal */}
      {viewerOpen && viewerMedia.length > 0 && (
        <MediaViewer
          media={viewerMedia}
          initialIndex={viewerIndex}
          onClose={handleCloseViewer}
        />
      )}

      {/* Download Progress Overlay */}
      {downloading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 relative">
                <svg
                  className="w-16 h-16 animate-spin text-pink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                다운로드 중...
              </h3>
              <p className="text-gray-600 text-center">
                {downloadProgress.current} / {downloadProgress.total} 파일
              </p>
              <div className="w-full mt-4 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
