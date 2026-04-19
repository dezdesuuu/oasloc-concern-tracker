-- ============================================================
-- OASLOC Concern Tracker — Initial Migration
-- ============================================================

-- Cases table
create table if not exists public.cases (
  id                   uuid        primary key default gen_random_uuid(),
  reference_number     text        not null,
  entry_date           date        not null,
  last_name            text,
  first_name           text,
  middle_name          text,
  sex                  text        check (sex in ('Male', 'Female')),
  civil_status         text,
  birthdate            date,
  postal_address       text,
  passport_number      text,
  country_jobsite      text,
  job_position         text,
  category             text        check (category in ('Land-based', 'Sea-based')),
  employer_name        text,
  ofw_contact_number   text,
  ofw_email            text,
  pra_name             text,
  pra_contact_number   text,
  pra_address          text,
  nok_name             text,
  nok_contact_number   text,
  nok_relationship     text,
  nok_address          text,
  nok_email            text,
  source_of_concern    text        check (source_of_concern in ('Walk-in', 'Email', 'Others')),
  main_concern         text[],
  requested_assistance text[],
  case_reference       text,
  endorsed_to          text        check (endorsed_to in ('MWOOSB', 'NCR', 'Region') or endorsed_to is null),
  endorsed_by          text,
  remarks              text,
  status               text        check (status in ('For Compliance', 'In Progress', 'Completed') or status is null),
  status_date          date,
  closed_by            text,
  created_at           timestamptz default now(),
  created_by           uuid        references auth.users (id)
);

-- Case documents table
create table if not exists public.case_documents (
  id             uuid        primary key default gen_random_uuid(),
  case_id        uuid        not null references public.cases (id) on delete cascade,
  file_name      text        not null,
  file_size      bigint      not null,
  storage_path   text        not null,
  thumbnail_path text,
  uploaded_at    timestamptz default now(),
  uploaded_by    uuid        references auth.users (id)
);

-- Indexes
create index if not exists idx_cases_entry_date      on public.cases (entry_date);
create index if not exists idx_cases_status          on public.cases (status);
create index if not exists idx_cases_reference       on public.cases (reference_number);
create index if not exists idx_case_docs_case_id     on public.case_documents (case_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.cases          enable row level security;
alter table public.case_documents enable row level security;

-- Cases: authenticated users have full access
create policy "cases_select" on public.cases
  for select to authenticated using (true);

create policy "cases_insert" on public.cases
  for insert to authenticated with check (true);

create policy "cases_update" on public.cases
  for update to authenticated using (true);

create policy "cases_delete" on public.cases
  for delete to authenticated using (true);

-- Case documents: authenticated users have full access
create policy "case_documents_select" on public.case_documents
  for select to authenticated using (true);

create policy "case_documents_insert" on public.case_documents
  for insert to authenticated with check (true);

create policy "case_documents_update" on public.case_documents
  for update to authenticated using (true);

create policy "case_documents_delete" on public.case_documents
  for delete to authenticated using (true);

-- ============================================================
-- Storage: case-documents bucket
-- Run this AFTER creating the bucket in Supabase Storage.
-- You can also create the bucket via this SQL:
-- ============================================================

insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "storage_case_docs_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'case-documents');

create policy "storage_case_docs_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'case-documents');

create policy "storage_case_docs_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'case-documents');

create policy "storage_case_docs_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'case-documents');
