import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/Header'
import { DashboardClient } from '@/components/DashboardClient'
import { PAGE_SIZE } from '@/lib/constants'
import type { Case } from '@/lib/types'

type SearchParams = {
  page?: string
  sort?: string
  dir?: string
  status?: string
  search?: string
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const page = Math.max(1, parseInt(params.page ?? '1') || 1)
  const sort = params.sort ?? 'entry_date'
  const dir = params.dir === 'asc' ? 'asc' : 'desc'
  const status = params.status ?? 'all'
  const search = params.search ?? ''

  const supabase = await createClient()

  let query = supabase.from('cases').select('*', { count: 'exact' })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (search.trim()) {
    const s = search.trim()
    query = query.or(
      `reference_number.ilike.%${s}%,last_name.ilike.%${s}%,first_name.ilike.%${s}%,passport_number.ilike.%${s}%`
    )
  }

  const validSortCols = [
    'reference_number',
    'entry_date',
    'last_name',
    'endorsed_to',
    'status',
  ]
  const sortCol = validSortCols.includes(sort) ? sort : 'entry_date'

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, count, error } = await query
    .order(sortCol, { ascending: dir === 'asc' })
    .range(from, to)

  if (error) {
    console.error('Dashboard query error:', error)
  }

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <>
      <Header />
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <DashboardClient
          cases={(data as Case[]) ?? []}
          totalCount={count ?? 0}
          totalPages={totalPages}
          currentPage={page}
          currentSort={sortCol}
          currentDir={dir as 'asc' | 'desc'}
          currentStatus={status}
          currentSearch={search}
        />
      </main>
    </>
  )
}
