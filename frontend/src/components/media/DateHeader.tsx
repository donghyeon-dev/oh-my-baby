'use client'

import { formatDate } from '@/lib/utils'

interface DateHeaderProps {
  date: string // ISO date string like "2024-01-15"
  count: number
}

export function DateHeader({ date, count }: DateHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-2 py-3">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-700">{formatDate(date)}</h3>
          <span className="text-sm text-gray-500">{count} items</span>
        </div>
      </div>
      <div className="h-px bg-gray-200/50" />
    </div>
  )
}
