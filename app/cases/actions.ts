'use server'

import { createClient } from '@/lib/supabase/server'
import { emptyToNull } from '@/lib/utils'
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
  }

  if (caseId) {
    const { error } = await supabase
      .from('cases')
      .update(payload)
      .eq('id', caseId)

    if (error) return { error: error.message }
    return { id: caseId }
  } else {
    const { data: newCase, error } = await supabase
      .from('cases')
      .insert({ ...payload, created_by: user.id })
      .select('id')
      .single()

    if (error) return { error: error.message }
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

  const { error: storageError } = await supabase.storage
    .from('case-documents')
    .remove(storagePaths)

  if (storageError) return { error: storageError.message }

  const { error } = await supabase
    .from('case_documents')
    .delete()
    .eq('id', documentId)

  if (error) return { error: error.message }
  return {}
}
