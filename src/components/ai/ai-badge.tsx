'use client'

import { ApprovalStatus } from '@prisma/client'

interface AIBadgeProps {
  aiGenerated?: boolean
  approvalStatus?: ApprovalStatus
  aiConfidence?: number | null
  showConfidence?: boolean
  size?: 'sm' | 'md'
}

/**
 * Badge component to indicate AI-generated content
 */
export function AIBadge({
  aiGenerated,
  approvalStatus,
  aiConfidence,
  showConfidence = false,
  size = 'sm',
}: AIBadgeProps) {
  if (!aiGenerated) {
    return null
  }

  const sizeClasses = size === 'sm'
    ? 'text-xs px-1.5 py-0.5'
    : 'text-sm px-2 py-1'

  const getStatusColor = () => {
    switch (approvalStatus) {
      case 'AUTO_APPROVED':
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'PENDING':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200'
    }
  }

  const getStatusLabel = () => {
    switch (approvalStatus) {
      case 'AUTO_APPROVED':
        return 'AI Auto'
      case 'APPROVED':
        return 'AI Approved'
      case 'REJECTED':
        return 'AI Rejected'
      case 'PENDING':
      default:
        return 'AI Pending'
    }
  }

  const confidencePercent = aiConfidence != null
    ? Math.round(aiConfidence * 100)
    : null

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded border ${sizeClasses} ${getStatusColor()}`}
      title={
        aiConfidence != null
          ? `AI-generated with ${confidencePercent}% confidence`
          : 'AI-generated content'
      }
    >
      <svg
        className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <span>{getStatusLabel()}</span>
      {showConfidence && confidencePercent != null && (
        <span className="opacity-75">({confidencePercent}%)</span>
      )}
    </span>
  )
}

/**
 * Small inline AI indicator
 */
export function AIIndicator({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 ${className}`}
      title="AI-generated"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    </span>
  )
}
