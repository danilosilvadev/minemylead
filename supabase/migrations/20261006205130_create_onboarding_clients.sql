-- MineMyLead post-payment onboarding intake
create table if not exists public.onboarding_clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text,
  email text,
  company text,
  website text,
  offer text,
  price text,
  best_customers text,
  buyer_role text,
  company_size text,
  industry text,
  region text,
  pain text,
  channels text,
  channels_other text,
  exclusions text,
  a_vs_c text,
  fields_needed text,
  notes text,
  session_id text,
  plan text,
  lang text,
  submitted_at text,
  status text not null default 'new'
    constraint onboarding_clients_status_check
    check (status in ('new','spec_sent','sample_sent','delivered')),
  owner_notes text,
  email_status text
);

comment on table public.onboarding_clients is
  'Post-payment onboarding intake submissions. Written only by the onboarding-intake Edge Function (service role). No browser access.';

create index if not exists onboarding_clients_created_at_idx on public.onboarding_clients (created_at desc);

-- RLS on, intentionally NO policies: anon/authenticated can neither read nor write.
alter table public.onboarding_clients enable row level security;

-- Defense in depth: remove table privileges from browser roles entirely
-- (also hides the table from the anon GraphQL/REST schema).
revoke all on table public.onboarding_clients from anon, authenticated;
grant all on table public.onboarding_clients to service_role;
