'use server'

import { createClient } from '@/lib/supabase/server'
import { emptyToNull } from '@/lib/utils'
import { diffCaseFields, insertAuditLog } from '@/lib/audit'
import type { CaseFormData, CaseDocument } from '@/lib/types'

export async function saveCaseAction(
  data: CaseFormData,
  caseId?: string
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const payload = {
    reference_number: data.reference_number.trim(),
    entry_date: data.entry_date || null,
    last_name: emptyToNull(data.last_name),
    first_name: emptyToNull(data.first_name),
    middle_name: emptyToNull(data.middle_name),
    sex: emptyToNull(data.sex),
    civil_status: emptyToNull(data.civil_status),
    birthdate: emptyToNull(data.birthdate),
    postal_address: emptyToNull(data.postal_address),
    passport_number: emptyToNull(data.passport_number),
    country_jobsite: emptyToNull(data.country_jobsite),
    job_position: emptyToNull(data.job_position),
    category: emptyToNull(data.category),
    employer_name: emptyToNull(data.employer_name),
    ofw_contact_number: emptyToNull(data.ofw_contact_number),
    ofw_email: emptyToNull(data.ofw_email),
    pra_name: emptyToNull(data.pra_name),
    pra_contact_number: emptyToNull(data.pra_contact_number),
    pra_address: emptyToNull(data.pra_address),
    nok_name: emptyToNull(data.nok_name),
    nok_contact_number: emptyToNull(data.nok_contact_number),
    nok_relationship: emptyToNull(data.nok_relationship),
    nok_address: emptyToNull(data.nok_address),
    nok_email: emptyToNull(data.nok_email),
    source_of_concern: emptyToNull(data.source_of_concern),
    main_concern: data.main_concern.length > 0 ? data.main_concern : [],
    requested_assistance:
      data.requested_assistance.length > 0 ? data.requested_assistance : [],
    case_reference: emptyToNull(data.case_reference),
    endorsed_to: emptyToNull(data.endorsed_to),
    endorsed_by: emptyToNull(data.endorsed_by),
    remarks: emptyToNull(data.remarks),
    status: emptyToNull(data.status),
    status_date: emptyToNull(data.status_date),
    closed_by: emptyToNull(data.closed_by),
    closed_date: emptyToNull(data.closed_date),
  }

  if (caseId) {
    // Fetch old record before updating so we can diff fields
    const { data: oldCase } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single()

    const { error } = await supabase
      .from('cases')
      .update(payload)
      .eq('id', caseId)

    if (error) return { error: error.message }

    if (oldCase) {
      const changed = diffCaseFields(
        oldCase as Record<string, unknown>,
        payload as Record<string, unknown>
      )
      if (changed.length > 0) {
        await insertAuditLog(supabase, {
          case_id: caseId,
          case_reference: payload.reference_number,
          action: 'updated',
          changed_fields: changed,
          performed_by: user.email!,
        })
      }
    }

    return { id: caseId }
  } else {
    const { data: newCase, error } = await supabase
      .from('cases')
      .insert({ ...payload, created_by: user.id })
      .select('id')
      .single()

    if (error) return { error: error.message }

    await insertAuditLog(supabase, {
      case_id: newCase.id,
      case_reference: payload.reference_number,
      action: 'created',
      performed_by: user.email!,
    })

    return { id: newCase.id }
  }
}

export async function insertDocumentAction(doc: {
  case_id: string
  file_name: string
  file_size: number
  storage_path: string
  thumbnail_path: string | null
}): Promise<{ error?: string; document?: CaseDocument }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('case_documents')
    .insert({ ...doc, uploaded_by: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  // Fetch case reference for the audit log
  const { data: caseRow } = await supabase
    .from('cases')
    .select('reference_number')
    .eq('id', doc.case_id)
    .single()

  await insertAuditLog(supabase, {
    case_id: doc.case_id,
    case_reference: caseRow?.reference_number ?? '',
    action: 'document_uploaded',
    changed_fields: [{ field: 'document', old_value: null, new_value: doc.file_name }],
    performed_by: user.email!,
  })

  return { document: data as CaseDocument }
}

export async function deleteDocumentAction(
  documentId: string,
  storagePaths: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Fetch document + case reference before deletion for audit log
  const { data: docRow } = await supabase
    .from('case_documents')
    .select('file_name, case_id, cases(reference_number)')
    .eq('id', documentId)
    .single()

  const { error: storageError } = await supabase.storage
    .from('case-documents')
    .remove(storagePaths)

  if (storageError) return { error: storageError.message }

  const { error } = await supabase
    .from('case_documents')
    .delete()
    .eq('id', documentId)

  if (error) return { error: error.message }

  if (docRow) {
    const caseRef =
      (docRow.cases as unknown as { reference_number: string } | null)?.reference_number ?? ''
    await insertAuditLog(supabase, {
      case_id: docRow.case_id,
      case_reference: caseRef,
      action: 'document_deleted',
      changed_fields: [{ field: 'document', old_value: docRow.file_name, new_value: null }],
      performed_by: user.email!,
    })
  }

  return {}
}
