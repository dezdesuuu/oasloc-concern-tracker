import { Header } from '@/components/Header'
import { CaseForm } from '@/components/CaseForm'
import Link from 'next/link'

export default function NewCasePage() {
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
        <CaseForm />
      </main>
    </>
  )
}
