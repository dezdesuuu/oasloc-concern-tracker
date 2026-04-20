'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/StatusBadge'
import { formatFullName, formatDate, computeAging, truncate } from '@/lib/utils'
import { STATUS_OPTIONS } from '@/lib/constants'
import type { Case } from '@/lib/types'

type SortDir = 'asc' | 'desc'

type Column = {
  key: string
  label: string
  sortable: boolean
}

const COLUMNS: Column[] = [
  { key: 'reference_number', label: 'Reference No.', sortable: true },
  { key: 'last_name', label: 'Full Name', sortable: true },
  { key: 'entry_date', label: 'Entry Date', sortable: true },
  { key: 'requested_assistance', label: 'Requested Assistance', sortable: false },
  { key: 'endorsed_to', label: 'Endorsed To', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'aging', label: 'Aging', sortable: false },
]

interface Props {
  cases: Case[]
  totalCount: number
  totalPages: number
  currentPage: number
  currentSort: string
  currentDir: SortDir
  currentStatus: string
  currentSearch: string
}

export function DashboardClient({
  cases,
  totalCount,
  totalPages,
  currentPage,
  currentSort,
  currentDir,
  currentStatus,
  currentSearch,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchInput, setSearchInput] = useState(currentSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buildUrl = useCallback(
    (overrides: Record<string, string | number>) => {
      const params = new URLSearchParams()
      const merged = {
        page: currentPage,
        sort: currentSort,
        dir: currentDir,
        status: currentStatus,
        search: currentSearch,
        ...overrides,
      }
      if (merged.page && merged.page !== 1) params.set('page', String(merged.page))
      if (merged.sort && merged.sort !== 'entry_date') params.set('sort', String(merged.sort))
      if (merged.dir && merged.dir !== 'desc') params.set('dir', String(merged.dir))
      if (merged.status && merged.status !== 'all') params.set('status', String(merged.status))
      if (merged.search) params.set('search', String(merged.search))
      const qs = params.toString()
      return qs ? `${pathname}?${qs}` : pathname
    },
    [currentPage, currentSort, currentDir, currentStatus, currentSearch, pathname]
  )

  const handleSort = (col: string) => {
    if (col === currentSort) {
      router.push(buildUrl({ sort: col, dir: currentDir === 'asc' ? 'desc' : 'asc', page: 1 }))
    } else {
      router.push(buildUrl({ sort: col, dir: 'asc', page: 1 }))
    }
  }

  const handleStatusFilter = (status: string) => {
    router.push(buildUrl({ status, page: 1 }))
  }

  useEffect(() => {
    setSearchInput(currentSearch)
  }, [currentSearch])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.replace(buildUrl({ search: value, page: 1 }))
    }, 300)
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (col !== currentSort)
      return <span className="ml-1 text-gray-400 opacity-0 group-hover:opacity-100">↕</span>
    return (
      <span className="ml-1 text-blue-600">
        {currentDir === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  const pageFrom = (currentPage - 1) * 20 + 1
  const pageTo = Math.min(currentPage * 20, totalCount)

  return (
    <div>
      {/* Page heading */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cases</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount} {totalCount === 1 ? 'record' : 'records'}
          </p>
        </div>
        <Link
          href="/cases/new"
          className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Case
        </Link>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Status pills */}
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusFilter(s)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                currentStatus === s
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="sm:ml-auto relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by ref no., name, passport…"
            className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap ${
                      col.sortable ? 'cursor-pointer select-none group hover:bg-gray-100' : ''
                    }`}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    {col.label}
                    {col.sortable && <SortIcon col={col.key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-gray-400">
                    No cases found.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/cases/${c.id}/edit`)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">
                      {c.reference_number}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {formatFullName(c.last_name, c.first_name, c.middle_name)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {formatDate(c.entry_date)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      {c.requested_assistance?.length
                        ? truncate(c.requested_assistance.join(', '), 60)
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {c.endorsed_to ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {computeAging(c.entry_date, c.closed_date)} days
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
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7
                ? i + 1
                : currentPage <= 4
                ? i + 1
                : currentPage >= totalPages - 3
                ? totalPages - 6 + i
                : currentPage - 3 + i
              return (
                <button
                  key={p}
                  onClick={() => router.push(buildUrl({ page: p }))}
                  className={`px-3 py-1 border rounded text-xs transition-colors ${
                    p === currentPage
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            })}
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
