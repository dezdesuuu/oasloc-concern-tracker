export type Case = {
  id: string
  reference_number: string
  entry_date: string
  last_name: string | null
  first_name: string | null
  middle_name: string | null
  sex: string | null
  civil_status: string | null
  birthdate: string | null
  postal_address: string | null
  passport_number: string | null
  country_jobsite: string | null
  job_position: string | null
  category: string | null
  employer_name: string | null
  ofw_contact_number: string | null
  ofw_email: string | null
  pra_name: string | null
  pra_contact_number: string | null
  pra_address: string | null
  nok_name: string | null
  nok_contact_number: string | null
  nok_relationship: string | null
  nok_address: string | null
  nok_email: string | null
  source_of_concern: string | null
  main_concern: string[] | null
  requested_assistance: string[] | null
  case_reference: string | null
  endorsed_to: string | null
  endorsed_by: string | null
  remarks: string | null
  status: string | null
  status_date: string | null
  closed_by: string | null
  created_at: string
  created_by: string
}

export type CaseDocument = {
  id: string
  case_id: string
  file_name: string
  file_size: number
  storage_path: string
  uploaded_at: string
  uploaded_by: string
}

export type CaseFormData = {
  reference_number: string
  entry_date: string
  last_name: string
  first_name: string
  middle_name: string
  sex: string
  civil_status: string
  birthdate: string
  postal_address: string
  passport_number: string
  country_jobsite: string
  job_position: string
  category: string
  employer_name: string
  ofw_contact_number: string
  ofw_email: string
  pra_name: string
  pra_contact_number: string
  pra_address: string
  nok_name: string
  nok_contact_number: string
  nok_relationship: string
  nok_address: string
  nok_email: string
  source_of_concern: string
  main_concern: string[]
  requested_assistance: string[]
  case_reference: string
  endorsed_to: string
  endorsed_by: string
  remarks: string
  status: string
  status_date: string
  closed_by: string
}

export const INITIAL_FORM_DATA: CaseFormData = {
  reference_number: '',
  entry_date: '',
  last_name: '',
  first_name: '',
  middle_name: '',
  sex: '',
  civil_status: '',
  birthdate: '',
  postal_address: '',
  passport_number: '',
  country_jobsite: '',
  job_position: '',
  category: '',
  employer_name: '',
  ofw_contact_number: '',
  ofw_email: '',
  pra_name: '',
  pra_contact_number: '',
  pra_address: '',
  nok_name: '',
  nok_contact_number: '',
  nok_relationship: '',
  nok_address: '',
  nok_email: '',
  source_of_concern: '',
  main_concern: [],
  requested_assistance: [],
  case_reference: '',
  endorsed_to: '',
  endorsed_by: '',
  remarks: '',
  status: '',
  status_date: '',
  closed_by: '',
}
