-- Add thumbnail_path column to case_documents
-- Run this migration if you already executed 001_initial.sql.
-- For fresh installs, 001_initial.sql already includes this column.

alter table public.case_documents
  add column if not exists thumbnail_path text;
