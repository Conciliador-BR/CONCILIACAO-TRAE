alter table if exists public.integracoes_empresa
  add column if not exists matriz text,
  add column if not exists ec_estabelecimento text,
  add column if not exists request_company_number text,
  add column if not exists company_numbers jsonb not null default '[]'::jsonb,
  add column if not exists subsidiaries jsonb not null default '[]'::jsonb,
  add column if not exists ultimo_optin_em timestamptz,
  add column if not exists ultimo_optin_status text,
  add column if not exists ultimo_optin_erro text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'integracoes_empresa_company_numbers_array_chk'
  ) then
    alter table public.integracoes_empresa
      add constraint integracoes_empresa_company_numbers_array_chk
      check (jsonb_typeof(company_numbers) = 'array');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'integracoes_empresa_subsidiaries_array_chk'
  ) then
    alter table public.integracoes_empresa
      add constraint integracoes_empresa_subsidiaries_array_chk
      check (jsonb_typeof(subsidiaries) = 'array');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'integracoes_empresa_optin_status_chk'
  ) then
    alter table public.integracoes_empresa
      add constraint integracoes_empresa_optin_status_chk
      check (
        ultimo_optin_status is null
        or ultimo_optin_status in ('pendente', 'sucesso', 'erro')
      );
  end if;
end $$;
