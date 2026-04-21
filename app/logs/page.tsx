import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/Header'
import { LogsClient } from '@/components/LogsClient'
import type { AuditLog } from '@/lib/types'

const PAGE_SIZE = 50

type SearchParams = {
  page?: string
  email?: string
  case_ref?: string
  from_date?: string
  to_date?: string
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  const page = Math.max(1, parseInt(params.page ?? '1') || 1)
  const email = params.email ?? ''
  const caseRef = params.case_ref ?? ''
  const fromDate = params.from_date ?? ''
  const toDate = params.to_date ?? ''

  const supabase = await createClient()

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('performed_at', { ascending: false })

  if (email.trim()) query = query.ilike('performed_by', `%${email.trim()}%`)
  if (caseRef.trim()) query = query.ilike('case_reference', `%${caseRef.trim()}%`)
  if (fromDate) query = query.gte('performed_at', `${fromDate}T00:00:00`)
  if (toDate) query = query.lte('performed_at', `${toDate}T23:59:59`)

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, count, error } = await query.range(from, to)

  if (error) console.error('Audit logs query error:', error?.message, error?.code, error?.details, error?.hint)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <>
      <Header />
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <LogsClient
          logs={(data as AuditLog[]) ?? []}
          totalCount={count ?? 0}
          totalPages={totalPages}
          currentPage={page}
          currentEmail={email}
          currentCaseRef={caseRef}
          currentFromDate={fromDate}
          currentToDate={toDate}
        />
      </main>
    </>
  )
}
