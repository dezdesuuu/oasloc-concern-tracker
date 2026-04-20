'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DateInput } from '@/components/DateInput'
import { DocumentSection } from '@/components/DocumentSection'
import { useToast } from '@/components/Toast'
import { saveCaseAction } from '@/app/cases/actions'
import {
  CIVIL_STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  SEX_OPTIONS,
  SOURCE_OF_CONCERN_OPTIONS,
  MAIN_CONCERN_OPTIONS,
  REQUESTED_ASSISTANCE_OPTIONS,
  ENDORSED_TO_OPTIONS,
  ENDORSED_BY_OPTIONS,
  STATUS_OPTIONS,
} from '@/lib/constants'
import { computeAging } from '@/lib/utils'
import { INITIAL_FORM_DATA, type Case, type CaseDocument, type CaseFormData } from '@/lib/types'

function caseToFormData(c: Case): CaseFormData {
  return {
    reference_number: c.reference_number ?? '',
    entry_date: c.entry_date ?? '',
    last_name: c.last_name ?? '',
    first_name: c.first_name ?? '',
    middle_name: c.middle_name ?? '',
    sex: c.sex ?? '',
    civil_status: c.civil_status ?? '',
    birthdate: c.birthdate ?? '',
    postal_address: c.postal_address ?? '',
    passport_number: c.passport_number ?? '',
    country_jobsite: c.country_jobsite ?? '',
    job_position: c.job_position ?? '',
    category: c.category ?? '',
    employer_name: c.employer_name ?? '',
    ofw_contact_number: c.ofw_contact_number ?? '',
    ofw_email: c.ofw_email ?? '',
    pra_name: c.pra_name ?? '',
    pra_contact_number: c.pra_contact_number ?? '',
    pra_address: c.pra_address ?? '',
    nok_name: c.nok_name ?? '',
    nok_contact_number: c.nok_contact_number ?? '',
    nok_relationship: c.nok_relationship ?? '',
    nok_address: c.nok_address ?? '',
    nok_email: c.nok_email ?? '',
    source_of_concern: c.source_of_concern ?? '',
    main_concern: c.main_concern ?? [],
    requested_assistance: c.requested_assistance ?? [],
    case_reference: c.case_reference ?? '',
    endorsed_to: c.endorsed_to ?? '',
    endorsed_by: c.endorsed_by ?? '',
    remarks: c.remarks ?? '',
    status: c.status ?? '',
    status_date: c.status_date ?? '',
    closed_by: c.closed_by ?? '',
    closed_date: c.closed_date ?? '',
  }
}

// --- Small UI helpers ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-5">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
        {title}
      </h2>
      {children}
    </div>
  )
}

const colsClass: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div className={`grid grid-cols-1 ${colsClass[cols] ?? 'sm:grid-cols-2'} gap-4`}>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  error,
  children,
  fullWidth,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <div className={fullWidth ? 'col-span-full' : undefined}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  error?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        error ? 'border-red-400' : 'border-gray-300'
      }`}
    />
  )
}

function SelectInput({
  value,
  onChange,
  options,
  noneLabel = '—',
  error,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  noneLabel?: string
  error?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
        error ? 'border-red-400' : 'border-gray-300'
      }`}
    >
      <option value="">{noneLabel}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function Textarea({
  value,
  onChange,
  rows = 4,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
    />
  )
}

function CheckboxGroup({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt))
    else onChange([...value, opt])
  }
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.includes(opt)}
            onChange={() => toggle(opt)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">{opt}</span>
        </label>
      ))}
    </div>
  )
}

// --- Main Component ---

interface Props {
  caseData?: Case
  caseId?: string
  initialDocuments?: CaseDocument[]
}

export function CaseForm({ caseData, caseId, initialDocuments = [] }: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<CaseFormData>(
    caseData ? caseToFormData(caseData) : { ...INITIAL_FORM_DATA }
  )
  const [errors, setErrors] = useState<Partial<Record<keyof CaseFormData, string>>>({})

  const set = <K extends keyof CaseFormData>(key: K, value: CaseFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const errs: Partial<Record<keyof CaseFormData, string>> = {}
    if (!form.reference_number.trim()) errs.reference_number = 'Reference Number is required.'
    if (!form.entry_date) errs.entry_date = 'Entry Date is required.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    startTransition(async () => {
      const result = await saveCaseAction(form, caseId)
      if (result.error) {
        showToast({ type: 'error', message: result.error })
      } else {
        showToast({ type: 'success', message: 'Case saved successfully.' })
        if (!caseId && result.id) {
          router.push(`/cases/${result.id}/edit`)
        }
      }
    })
  }

  const aging = form.entry_date ? computeAging(form.entry_date, form.closed_date) : null
  const pageTitle = caseId
    ? `Edit Case — ${caseData?.reference_number ?? ''}`
    : 'New Case'

  return (
    <div>
      {/* Page title + save button */}
      <div className="flex items-start justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving…
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>

      {/* Case Header */}
      <Section title="Case Header">
        <Grid cols={3}>
          <Field label="Reference Number" required error={errors.reference_number}>
            <TextInput
              value={form.reference_number}
              onChange={(v) => set('reference_number', v)}
              error={!!errors.reference_number}
            />
          </Field>
          <Field label="Entry Date" required error={errors.entry_date}>
            <DateInput
              value={form.entry_date}
              onChange={(v) => set('entry_date', v)}
              className={errors.entry_date ? 'border-red-400' : ''}
            />
          </Field>
          <Field label="Aging (days)">
            <div className={`w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm ${form.status === 'In Progress' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              {aging !== null ? `${aging} days` : '—'}
            </div>
          </Field>
        </Grid>
      </Section>

      {/* OFW Information */}
      <Section title="Information of OFW">
        <div className="space-y-4">
          <Grid cols={3}>
            <Field label="Last Name">
              <TextInput value={form.last_name} onChange={(v) => set('last_name', v)} />
            </Field>
            <Field label="First Name">
              <TextInput value={form.first_name} onChange={(v) => set('first_name', v)} />
            </Field>
            <Field label="Middle Name">
              <TextInput value={form.middle_name} onChange={(v) => set('middle_name', v)} />
            </Field>
          </Grid>
          <Grid cols={3}>
            <Field label="Sex">
              <div className="flex gap-4 pt-1">
                {SEX_OPTIONS.map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="sex"
                      value={s}
                      checked={form.sex === s}
                      onChange={() => set('sex', s)}
                      className="border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {s}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Civil Status">
              <SelectInput
                value={form.civil_status}
                onChange={(v) => set('civil_status', v)}
                options={CIVIL_STATUS_OPTIONS}
              />
            </Field>
            <Field label="Birthdate">
              <DateInput value={form.birthdate} onChange={(v) => set('birthdate', v)} />
            </Field>
          </Grid>
          <Grid cols={1}>
            <Field label="Postal Address">
              <TextInput value={form.postal_address} onChange={(v) => set('postal_address', v)} />
            </Field>
          </Grid>
          <Grid cols={2}>
            <Field label="Passport Number">
              <TextInput value={form.passport_number} onChange={(v) => set('passport_number', v)} />
            </Field>
            <Field label="Country / Jobsite">
              <TextInput value={form.country_jobsite} onChange={(v) => set('country_jobsite', v)} />
            </Field>
          </Grid>
          <Grid cols={2}>
            <Field label="Job Position">
              <TextInput value={form.job_position} onChange={(v) => set('job_position', v)} />
            </Field>
            <Field label="Category">
              <SelectInput
                value={form.category}
                onChange={(v) => set('category', v)}
                options={CATEGORY_OPTIONS}
              />
            </Field>
          </Grid>
          <Grid cols={2}>
            <Field label="Name of Employer">
              <TextInput value={form.employer_name} onChange={(v) => set('employer_name', v)} />
            </Field>
            <Field label="Contact Number of OFW">
              <TextInput value={form.ofw_contact_number} onChange={(v) => set('ofw_contact_number', v)} />
            </Field>
          </Grid>
          <Grid cols={1}>
            <Field label="Email Address of OFW">
              <TextInput
                type="email"
                value={form.ofw_email}
                onChange={(v) => set('ofw_email', v)}
              />
            </Field>
          </Grid>
          <Grid cols={3}>
            <Field label="PRA Name">
              <TextInput value={form.pra_name} onChange={(v) => set('pra_name', v)} />
            </Field>
            <Field label="PRA Contact Number">
              <TextInput value={form.pra_contact_number} onChange={(v) => set('pra_contact_number', v)} />
            </Field>
            <Field label="PRA Address">
              <TextInput value={form.pra_address} onChange={(v) => set('pra_address', v)} />
            </Field>
          </Grid>
        </div>
      </Section>

      {/* Next of Kin */}
      <Section title="Information of Next of Kin">
        <div className="space-y-4">
          <Grid cols={2}>
            <Field label="Name of Next of Kin">
              <TextInput value={form.nok_name} onChange={(v) => set('nok_name', v)} />
            </Field>
            <Field label="Contact Number">
              <TextInput value={form.nok_contact_number} onChange={(v) => set('nok_contact_number', v)} />
            </Field>
          </Grid>
          <Grid cols={2}>
            <Field label="Relationship to OFW">
              <TextInput value={form.nok_relationship} onChange={(v) => set('nok_relationship', v)} />
            </Field>
            <Field label="Email Address of Next of Kin">
              <TextInput
                type="email"
                value={form.nok_email}
                onChange={(v) => set('nok_email', v)}
              />
            </Field>
          </Grid>
          <Grid cols={1}>
            <Field label="Address of Next of Kin">
              <TextInput value={form.nok_address} onChange={(v) => set('nok_address', v)} />
            </Field>
          </Grid>
        </div>
      </Section>

      {/* Case Details */}
      <Section title="Case Details">
        <div className="space-y-4">
          <Grid cols={2}>
            <Field label="Source of Concern">
              <SelectInput
                value={form.source_of_concern}
                onChange={(v) => set('source_of_concern', v)}
                options={SOURCE_OF_CONCERN_OPTIONS}
              />
            </Field>
          </Grid>
          <Grid cols={2}>
            <Field label="Main Concern">
              <CheckboxGroup
                options={MAIN_CONCERN_OPTIONS}
                value={form.main_concern}
                onChange={(v) => set('main_concern', v)}
              />
            </Field>
            <Field label="Requested Assistance">
              <CheckboxGroup
                options={REQUESTED_ASSISTANCE_OPTIONS}
                value={form.requested_assistance}
                onChange={(v) => set('requested_assistance', v)}
              />
            </Field>
          </Grid>
          <Field label="Case Reference" fullWidth>
            <Textarea
              value={form.case_reference}
              onChange={(v) => set('case_reference', v)}
              rows={5}
            />
          </Field>
          <Grid cols={2}>
            <Field label="Endorsed To">
              <SelectInput
                value={form.endorsed_to}
                onChange={(v) => set('endorsed_to', v)}
                options={ENDORSED_TO_OPTIONS}
                noneLabel="— None —"
              />
            </Field>
            <Field label="Endorsed By">
              <SelectInput
                value={form.endorsed_by}
                onChange={(v) => set('endorsed_by', v)}
                options={ENDORSED_BY_OPTIONS}
                noneLabel="— None —"
              />
            </Field>
          </Grid>
          <Field label="Remarks" fullWidth>
            <Textarea
              value={form.remarks}
              onChange={(v) => set('remarks', v)}
            />
          </Field>
          <Grid cols={4}>
            <Field label="Status">
              <SelectInput
                value={form.status}
                onChange={(v) => set('status', v)}
                options={STATUS_OPTIONS}
              />
            </Field>
            <Field label="Status Date">
              <DateInput value={form.status_date} onChange={(v) => set('status_date', v)} />
            </Field>
            <Field label="Closed By">
              <TextInput value={form.closed_by} onChange={(v) => set('closed_by', v)} />
            </Field>
            <Field label="Closed Date">
              <DateInput value={form.closed_date} onChange={(v) => set('closed_date', v)} />
            </Field>
          </Grid>
        </div>
      </Section>

      {/* Documents */}
      <DocumentSection caseId={caseId} initialDocuments={initialDocuments} />

      {/* Bottom save button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
