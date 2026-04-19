'use client'

import { useState, useEffect, useRef } from 'react'
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

// ─── PDF thumbnail via PDF.js CDN ────────────────────────────────────────────

async function generatePdfThumbnail(file: File): Promise<Blob | null> {
  try {
    // webpackIgnore / turbopackIgnore: do not bundle this CDN URL
    // @ts-ignore – no installed package types for CDN module
    const pdfjs = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs') as {
      GlobalWorkerOptions: { workerSrc: string }
      getDocument: (src: { data: Uint8Array }) => { promise: Promise<{
        getPage: (n: number) => Promise<{
          getViewport: (o: { scale: number }) => { width: number; height: number }
          render: (o: { canvasContext: CanvasRenderingContext2D; viewport: object }) => { promise: Promise<void> }
        }>
      }> }
    }

    pdfjs.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs'

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    const page = await pdf.getPage(1)

    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({
      canvasContext: canvas.getContext('2d') as CanvasRenderingContext2D,
      viewport,
    }).promise

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7)
    })
  } catch (err) {
    console.error('PDF thumbnail generation failed:', err)
    return null
  }
}

// ─── Signed URL helpers ───────────────────────────────────────────────────────

type UrlPair = { displayUrl: string | null; downloadUrl: string }
type UrlCache = Record<string, UrlPair>

async function fetchSignedUrls(docs: CaseDocument[]): Promise<UrlCache> {
  if (!docs.length) return {}

  const supabase = createClient()
  const paths = new Set<string>()
  for (const doc of docs) {
    paths.add(doc.storage_path)
    if (doc.thumbnail_path) paths.add(doc.thumbnail_path)
  }

  const { data: signed } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(Array.from(paths), 3600)

  const byPath: Record<string, string> = {}
  for (const item of signed ?? []) {
    if (item.path && item.signedUrl) byPath[item.path] = item.signedUrl
  }

  const cache: UrlCache = {}
  for (const doc of docs) {
    const downloadUrl = byPath[doc.storage_path] ?? ''
    const isImage = /\.(jpg|jpeg|png)$/i.test(doc.file_name)
    const isPdf = /\.pdf$/i.test(doc.file_name)

    let displayUrl: string | null = null
    if (isImage) {
      displayUrl = downloadUrl || null
    } else if (isPdf && doc.thumbnail_path) {
      displayUrl = byPath[doc.thumbnail_path] ?? null
    }

    cache[doc.id] = { displayUrl, downloadUrl }
  }
  return cache
}

// ─── Tile sub-components ──────────────────────────────────────────────────────

function FileIcon({ fileName }: { fileName: string }) {
  const ext = (fileName.split('.').pop() ?? 'FILE').toUpperCase()
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 select-none">
      <svg
        className="w-9 h-9 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span className="mt-1 text-[10px] font-semibold text-slate-400 tracking-wide">{ext}</span>
    </div>
  )
}

interface TileProps {
  doc: CaseDocument
  urls: UrlPair | undefined
  onDownload: () => void
  onDelete: () => void
  isDeleting: boolean
}

function DocumentTile({ doc, urls, onDownload, onDelete, isDeleting }: TileProps) {
  const tooltip = [
    doc.file_name,
    formatFileSize(doc.file_size),
    new Date(doc.uploaded_at).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }),
  ].join('\n')

  return (
    <div className="relative group w-[120px]" title={tooltip}>
      {/* Image box */}
      <div
        className="relative w-[120px] h-[120px] rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer"
        onClick={onDownload}
      >
        {urls?.displayUrl ? (
          <img
            src={urls.displayUrl}
            alt={doc.file_name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <FileIcon fileName={doc.file_name} />
        )}

        {/* Hover download overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-xs font-semibold bg-black/60 px-2.5 py-1 rounded-full">
            Download
          </span>
        </div>
      </div>

      {/* Filename below tile */}
      <p className="mt-1.5 text-xs text-gray-600 truncate w-[120px] leading-tight">
        {doc.file_name}
      </p>

      {/* Delete × button — top-right corner, shown on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        disabled={isDeleting}
        title="Delete"
        className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40 shadow"
      >
        {isDeleting ? '…' : '×'}
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  caseId?: string
  initialDocuments: CaseDocument[]
}

export function DocumentSection({ caseId, initialDocuments }: Props) {
  const { showToast } = useToast()
  const [documents, setDocuments] = useState<CaseDocument[]>(initialDocuments)
  const [urlCache, setUrlCache] = useState<UrlCache>({})
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSignedUrls(initialDocuments).then(setUrlCache)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        const storagePath = `${caseId}/${file.name}`
        let thumbnailPath: string | null = null

        // Upload original file
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, file, { upsert: true })

        if (uploadError) {
          showToast({ type: 'error', message: uploadError.message })
          continue
        }

        // Generate + upload thumbnail for PDFs
        if (file.type === 'application/pdf') {
          const thumbnailBlob = await generatePdfThumbnail(file)
          if (thumbnailBlob) {
            thumbnailPath = `${caseId}/thumbnails/${file.name}.jpg`
            const { error: thumbErr } = await supabase.storage
              .from(STORAGE_BUCKET)
              .upload(thumbnailPath, thumbnailBlob, {
                contentType: 'image/jpeg',
                upsert: true,
              })
            if (thumbErr) {
              console.error('Thumbnail upload failed:', thumbErr.message)
              thumbnailPath = null
            }
          }
        }

        const result = await insertDocumentAction({
          case_id: caseId,
          file_name: file.name,
          file_size: file.size,
          storage_path: storagePath,
          thumbnail_path: thumbnailPath,
        })

        if (result.error) {
          showToast({ type: 'error', message: result.error })
        } else if (result.document) {
          const newDoc = result.document
          setDocuments((prev) => [newDoc, ...prev])
          const newUrls = await fetchSignedUrls([newDoc])
          setUrlCache((prev) => ({ ...prev, ...newUrls }))
          showToast({ type: 'success', message: `${file.name} uploaded.` })
        }
      } finally {
        setUploading(false)
      }
    }

    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDownload = async (doc: CaseDocument) => {
    const supabase = createClient()
    const { data: blob, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(doc.storage_path)

    if (error || !blob) {
      showToast({ type: 'error', message: 'Download failed.' })
      return
    }

    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = doc.file_name
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(objectUrl)
  }

  const handleDelete = async (doc: CaseDocument) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return
    setDeletingId(doc.id)

    const paths = [doc.storage_path, ...(doc.thumbnail_path ? [doc.thumbnail_path] : [])]
    const result = await deleteDocumentAction(doc.id, paths)
    setDeletingId(null)

    if (result.error) {
      showToast({ type: 'error', message: result.error })
    } else {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
      setUrlCache((prev) => {
        const next = { ...prev }
        delete next[doc.id]
        return next
      })
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
          <div className="mb-5">
            <label
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md cursor-pointer transition-colors ${
                uploading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {uploading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin text-gray-400"
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
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3 3-3"
                    />
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
              PDF, JPG, PNG, DOCX · max 10 MB per file
            </p>
          </div>

          {/* Thumbnail grid */}
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {documents.map((doc) => (
                <DocumentTile
                  key={doc.id}
                  doc={doc}
                  urls={urlCache[doc.id]}
                  onDownload={() => handleDownload(doc)}
                  onDelete={() => handleDelete(doc)}
                  isDeleting={deletingId === doc.id}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
