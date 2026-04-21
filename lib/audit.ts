import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'document_uploaded'
  | 'document_deleted'

export type ChangedField = {
  field: string
  old_value: string | null
  new_value: string | null
}

/** Human-readable labels for every tracked case field. */
export const FIELD_LABELS: Record<string, string> = {
  reference_number: 'Reference Number',
  entry_date: 'Entry Date',
  last_name: 'Last Name',
  first_name: 'First Name',
  middle_name: 'Middle Name',
  sex: 'Sex',
  civil_status: 'Civil Status',
  birthdate: 'Birthdate',
  postal_address: 'Postal Address',
  passport_number: 'Passport Number',
  country_jobsite: 'Country / Jobsite',
  job_position: 'Job Position',
  category: 'Category',
  employer_name: 'Employer Name',
  ofw_contact_number: 'OFW Contact Number',
  ofw_email: 'OFW Email',
  pra_name: 'PRA Name',
  pra_contact_number: 'PRA Contact Number',
  pra_address: 'PRA Address',
  nok_name: 'NOK Name',
  nok_contact_number: 'NOK Contact Number',
  nok_relationship: 'NOK Relationship',
  nok_address: 'NOK Address',
  nok_email: 'NOK Email',
  source_of_concern: 'Source of Concern',
  main_concern: 'Main Concern',
  requested_assistance: 'Requested Assistance',
  case_reference: 'Case Reference',
  endorsed_to: 'Endorsed To',
  endorsed_by: 'Endorsed By',
  remarks: 'Remarks',
  status: 'Status',
  status_date: 'Status Date',
  closed_by: 'Closed By',
  closed_date: 'Closed Date',
}

function normalize(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (Array.isArray(val)) return val.join(', ')
  return String(val)
}

/** Return only the fields that differ between the stored record and the new payload. */
export function diffCaseFields(
  oldRecord: Record<string, unknown>,
  newPayload: Record<string, unknown>
): ChangedField[] {
  return Object.keys(FIELD_LABELS).reduce<ChangedField[]>((acc, field) => {
    const oldNorm = normalize(oldRecord[field])
    const newNorm = normalize(newPayload[field])
    if (oldNorm !== newNorm) {
      acc.push({
        field,
        old_value: oldNorm || null,
        new_value: newNorm || null,
      })
    }
    return acc
  }, [])
}

/** Insert one row into audit_logs. Failures are silently swallowed so they never block the main operation. */
export async function insertAuditLog(
  supabase: SupabaseClient,
  opts: {
    case_id: string
    case_reference: string
    action: AuditAction
    changed_fields?: ChangedField[] | null
    performed_by: string
  }
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      case_id: opts.case_id,
      case_reference: opts.case_reference,
      action: opts.action,
      changed_fields: opts.changed_fields ?? null,
      performed_by: opts.performed_by,
    })
  } catch (err) {
    console.error('Audit log insert failed:', err)
  }
}
