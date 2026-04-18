'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { insertDocumentAction, deleteDocumentAction } from '@/app/cases/actions'
import { useToast } from '@/components/Toast'
import { formatFileSize } from '@/lib/utils'
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  STORAGE_BUCKET,
} from '@/lib/constants'
import type { CaseDocument } from '@/lib/types'

interface Props {
  caseId?: string
  initialDocuments: CaseDocument[]
}

export function DocumentSection({ caseId, initialDocuments }: Props) {
  const { showToast } = useToast()
  const [documents, setDocuments] = useState<CaseDocument[]>(initialDocuments)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !caseId) return

    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showToast({ type: 'error', message: `${file.name}: unsupported file type.` })
        continue
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        showToast({ type: 'error', message: `${file.name}: exceeds 10 MB limit.` })
        continue
      }

      setUploading(true)
      try {
        const supabase = createClient()
        const ext = file.name.split('.').pop() ?? 'bin'
        const uid = Math.random().toString(36).slice(2)
        const storagePath = `${caseId}/${uid}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, file)

        if (uploadError) {
          showToast({ type: 'error', message: uploadError.message })
          continue
        }

        const result = await insertDocumentAction({
          case_id: caseId,
          file_name: file.name,
          file_size: file.size,
          storage_path: storagePath,
        })

        if (result.error) {
          showToast({ type: 'error', message: result.error })
        } else if (result.document) {
          setDocuments((prev) => [result.document!, ...prev])
          showToast({ type: 'success', message: `${file.name} uploaded.` })
        }
      } finally {
        setUploading(false)
      }
    }

    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDownload = async (doc: CaseDocument) => {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(doc.storage_path, 120)

    if (error || !data?.signedUrl) {
      showToast({ type: 'error', message: 'Could not generate download link.' })
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  const handleDelete = async (doc: CaseDocument) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return
    setDeletingId(doc.id)
    const result = await deleteDocumentAction(doc.id, doc.storage_path)
    setDeletingId(null)

    if (result.error) {
      showToast({ type: 'error', message: result.error })
    } else {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
      showToast({ type: 'success', message: `${doc.file_name} deleted.` })
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
        Documents
      </h2>

      {!caseId ? (
        <p className="text-sm text-gray-500 italic">
          Save the case first to upload documents.
        </p>
      ) : (
        <>
          {/* Upload button */}
          <div className="mb-4">
            <label
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md cursor-pointer transition-colors ${
                uploading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {uploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3" />
                  </svg>
                  Upload Files
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
            <p className="mt-1.5 text-xs text-gray-400">
              PDF, JPG, PNG, DOCX — max 10 MB per file
            </p>
          </div>

          {/* Document list */}
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500">File Name</th>
                    <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500">Size</th>
                    <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500">Uploaded</th>
                    <th className="py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="py-2 pr-4 text-gray-900 max-w-xs truncate">{doc.file_name}</td>
                      <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">
                        {new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            disabled={deletingId === doc.id}
                            className="text-xs text-red-600 hover:text-red-800 hover:underline disabled:opacity-50"
                          >
                            {deletingId === doc.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
