do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'credenciais_adquirente_unique'
      and conrelid = 'public.credenciais_adquirente'::regclass
  ) then
    alter table public.credenciais_adquirente
      drop constraint credenciais_adquirente_unique;
  end if;
exception
  when undefined_table then
    null;
end $$;

drop index if exists public.credenciais_adquirente_rede_global_unique;
drop index if exists public.credenciais_adquirente_vr_scope_unique;

create unique index if not exists credenciais_adquirente_scope_unique
on public.credenciais_adquirente (
  lower(coalesce(adquirente, '')),
  lower(coalesce(ambiente, '')),
  lower(coalesce(empresas, '')),
  coalesce(ec::text, '')
);
