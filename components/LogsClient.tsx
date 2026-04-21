'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatDateTime, truncate } from '@/lib/utils'
import { FIELD_LABELS } from '@/lib/audit'
import type { AuditLog } from '@/lib/types'

const ACTION_LABELS: Record<string, string> = {
  created: 'Case Created',
  updated: 'Case Updated',
  deleted: 'Case Deleted',
  document_uploaded: 'Document Uploaded',
  document_deleted: 'Document Deleted',
}

function formatChangedFields(log: AuditLog): React.ReactNode {
  const { action, changed_fields } = log

  if (!changed_fields || changed_fields.length === 0) return <span className="text-gray-400">—</span>

  if (action === 'document_uploaded') {
    const name = changed_fields[0]?.new_value ?? '—'
    return <span className="text-gray-700">{name}</span>
  }

  if (action === 'document_deleted') {
    const name = changed_fields[0]?.old_value ?? '—'
    return <span className="text-gray-700">{name}</span>
  }

  if (action === 'updated') {
    return (
      <ul className="space-y-0.5">
        {changed_fields.map((cf, i) => {
          const label = FIELD_LABELS[cf.field] ?? cf.field
          const oldVal = cf.old_value ? truncate(cf.old_value, 60) : '(empty)'
          const newVal = cf.new_value ? truncate(cf.new_value, 60) : '(empty)'
          return (
            <li key={i} className="text-xs text-gray-700">
              <span className="font-medium">{label}:</span>{' '}
              <span className="text-gray-500">{oldVal}</span>
              <span className="mx-1 text-gray-400">→</span>
              <span className="text-gray-900">{newVal}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  return <span className="text-gray-400">—</span>
}

interface Props {
  logs: AuditLog[]
  totalCount: number
  totalPages: number
  currentPage: number
  currentEmail: string
  currentCaseRef: string
  currentFromDate: string
  currentToDate: string
}

export function LogsClient({
  logs,
  totalCount,
  totalPages,
  currentPage,
  currentEmail,
  currentCaseRef,
  currentFromDate,
  currentToDate,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const [emailInput, setEmailInput] = useState(currentEmail)
  const [caseRefInput, setCaseRefInput] = useState(currentCaseRef)
  const [fromDate, setFromDate] = useState(currentFromDate)
  const [toDate, setToDate] = useState(currentToDate)

  const emailDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const caseRefDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buildUrl = useCallback(
    (overrides: Record<string, string | number>) => {
      const merged = {
        page: currentPage,
        email: currentEmail,
        case_ref: currentCaseRef,
        from_date: currentFromDate,
        to_date: currentToDate,
        ...overrides,
      }
      const params = new URLSearchParams()
      if (merged.page && merged.page !== 1) params.set('page', String(merged.page))
      if (merged.email) params.set('email', String(merged.email))
      if (merged.case_ref) params.set('case_ref', String(merged.case_ref))
      if (merged.from_date) params.set('from_date', String(merged.from_date))
      if (merged.to_date) params.set('to_date', String(merged.to_date))
      const qs = params.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [currentPage, currentEmail, currentCaseRef, currentFromDate, currentToDate, pathname]
  )

  // Sync local state when URL params change (e.g. after clear)
  useEffect(() => { setEmailInput(currentEmail) }, [currentEmail])
  useEffect(() => { setCaseRefInput(currentCaseRef) }, [currentCaseRef])
  useEffect(() => { setFromDate(currentFromDate) }, [currentFromDate])
  useEffect(() => { setToDate(currentToDate) }, [currentToDate])

  const handleEmailChange = (value: string) => {
    setEmailInput(value)
    if (emailDebounce.current) clearTimeout(emailDebounce.current)
    emailDebounce.current = setTimeout(() => {
      router.replace(buildUrl({ email: value, page: 1 }))
    }, 300)
  }

  const handleCaseRefChange = (value: string) => {
    setCaseRefInput(value)
    if (caseRefDebounce.current) clearTimeout(caseRefDebounce.current)
    caseRefDebounce.current = setTimeout(() => {
      router.replace(buildUrl({ case_ref: value, page: 1 }))
    }, 300)
  }

  const handleFromDate = (value: string) => {
    setFromDate(value)
    router.replace(buildUrl({ from_date: value, page: 1 }))
  }

  const handleToDate = (value: string) => {
    setToDate(value)
    router.replace(buildUrl({ to_date: value, page: 1 }))
  }

  const handleClear = () => {
    setEmailInput('')
    setCaseRefInput('')
    setFromDate('')
    setToDate('')
    router.push(pathname)
  }

  const hasFilters = currentEmail || currentCaseRef || currentFromDate || currentToDate

  const pageFrom = (currentPage - 1) * 50 + 1
  const pageTo = Math.min(currentPage * 50, totalCount)

  return (
    <div>
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Performed By (email)
            </label>
            <input
              type="text"
              value={emailInput}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="Filter by email…"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Case Reference
            </label>
            <input
              type="text"
              value={caseRefInput}
              onChange={(e) => handleCaseRefChange(e.target.value)}
              placeholder="Filter by case ref…"
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => handleFromDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => handleToDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {hasFilters && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Date &amp; Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Case Reference
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Changed Fields
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  Performed By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No audit log entries found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {formatDateTime(log.performed_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 whitespace-nowrap">
                      {log.case_reference || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      {formatChangedFields(log)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                      {log.performed_by}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {pageFrom}–{pageTo} of {totalCount}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => router.push(buildUrl({ page: currentPage - 1 }))}
              disabled={currentPage <= 1}
              className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 border border-blue-600 bg-blue-600 text-white rounded text-xs">
              {currentPage}
            </span>
            <button
              onClick={() => router.push(buildUrl({ page: currentPage + 1 }))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const ACTION_STYLES: Record<string, string> = {
  created: 'bg-green-100 text-green-800',
  updated: 'bg-blue-100 text-blue-800',
  deleted: 'bg-red-100 text-red-800',
  document_uploaded: 'bg-purple-100 text-purple-800',
  document_deleted: 'bg-orange-100 text-orange-800',
}

function ActionBadge({ action }: { action: string }) {
  const label = ACTION_LABELS[action] ?? action
  const style = ACTION_STYLES[action] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}
