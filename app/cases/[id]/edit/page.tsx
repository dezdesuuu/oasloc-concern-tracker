import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/Header'
import { CaseForm } from '@/components/CaseForm'
import Link from 'next/link'
import type { Case, CaseDocument } from '@/lib/types'

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [caseResult, docsResult] = await Promise.all([
    supabase.from('cases').select('*').eq('id', id).single(),
    supabase
      .from('case_documents')
      .select('*')
      .eq('case_id', id)
      .order('uploaded_at', { ascending: false }),
  ])

  if (caseResult.error || !caseResult.data) {
    notFound()
  }

  const caseData = caseResult.data as Case
  const documents = (docsResult.data as CaseDocument[]) ?? []

  return (
    <>
      <Header />
      <main className="max-w-screen-lg mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <CaseForm
          caseData={caseData}
          caseId={id}
          initialDocuments={documents}
        />
      </main>
    </>
  )
}
