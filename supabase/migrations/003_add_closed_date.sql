-- Add closed_date column to cases
-- Run this migration if you already executed 001_initial.sql.
-- For fresh installs, 001_initial.sql already includes this column.

alter table public.cases
  add column if not exists closed_date date;
