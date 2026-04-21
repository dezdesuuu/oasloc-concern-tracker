-- Audit logs table
create table if not exists public.audit_logs (
  id             uuid        primary key default gen_random_uuid(),
  case_id        uuid        not null references public.cases (id) on delete cascade,
  case_reference text        not null,
  action         text        not null
                             check (action in ('created', 'updated', 'deleted', 'document_uploaded', 'document_deleted')),
  changed_fields jsonb,
  performed_by   text        not null,
  performed_at   timestamptz default now()
);

create index if not exists idx_audit_logs_case_id      on public.audit_logs (case_id);
create index if not exists idx_audit_logs_performed_at on public.audit_logs (performed_at desc);
create index if not exists idx_audit_logs_performed_by on public.audit_logs (performed_by);
create index if not exists idx_audit_logs_case_ref     on public.audit_logs (case_reference);

-- RLS: authenticated users may read all rows and insert, but never update or delete
alter table public.audit_logs enable row level security;

create policy "audit_logs_select" on public.audit_logs
  for select to authenticated using (true);

create policy "audit_logs_insert" on public.audit_logs
  for insert to authenticated with check (true);
