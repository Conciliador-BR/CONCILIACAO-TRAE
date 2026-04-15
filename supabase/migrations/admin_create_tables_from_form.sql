create extension if not exists unaccent;

create or replace function public.normalize_identifier(p_value text)
returns text
language sql
stable
as $$
  select
    regexp_replace(
      regexp_replace(
        regexp_replace(
          trim(regexp_replace(lower(unaccent(coalesce(p_value, ''))), '\\s+', '_', 'g')),
          '-',
          '_',
          'g'
        ),
        '[^a-z0-9_]',
        '',
        'g'
      ),
      '_+',
      '_',
      'g'
    )
$$;

create or replace function public.admin_create_tables_from_form(
  p_empresa text,
  p_adquirentes text[],
  p_vouchers text[],
  p_bancos text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa text;
  v_item text;
  v_provider text;
  v_bank text;
  v_table text;
  v_seq text;
  v_created_tables text[] := '{}'::text[];
begin
  v_empresa := public.normalize_identifier(p_empresa);
  if v_empresa is null or v_empresa = '' then
    raise exception 'Empresa inválida';
  end if;

  foreach v_item in array coalesce(p_adquirentes, '{}'::text[]) || coalesce(p_vouchers, '{}'::text[])
  loop
    v_provider := public.normalize_identifier(v_item);
    if v_provider is null or v_provider = '' then
      continue;
    end if;

    v_table := format('vendas_%s_%s', v_empresa, v_provider);
    execute format(
      'create table if not exists public.%I (
        id bigserial primary key,
        data_venda date,
        previsao_pgto date,
        modalidade text,
        nsu text,
        valor_bruto numeric,
        valor_liquido numeric,
        taxa_mdr numeric,
        despesa_mdr numeric,
        numero_parcelas integer,
        bandeira text,
        valor_antecipacao numeric,
        despesa_antecipacao numeric,
        valor_liquido_antecipacao numeric,
        empresa text,
        matriz text,
        adquirente text,
        auditoria text,
        observacoes text,
        ec text,
        created_at timestamptz default now()
      )',
      v_table
    );
    execute format('alter table public.%I add column if not exists auditoria text', v_table);
    execute format('alter table public.%I add column if not exists observacoes text', v_table);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', v_table);
    v_seq := format('%s_id_seq', v_table);
    begin
      execute format('grant usage, select on sequence public.%I to authenticated', v_seq);
    exception when undefined_table then
      null;
    end;
    v_created_tables := array_append(v_created_tables, v_table);

    v_table := format('recebimento_%s_%s', v_empresa, v_provider);
    execute format(
      'create table if not exists public.%I (
        id bigserial primary key,
        data_venda date,
        data_recebimento date,
        data_pgto date,
        modalidade text,
        nsu text,
        valor_bruto numeric,
        valor_liquido numeric,
        taxa_mdr numeric,
        despesa_mdr numeric,
        numero_parcelas integer,
        bandeira text,
        valor_antecipacao numeric,
        despesa_antecipacao numeric,
        valor_liquido_antecipacao numeric,
        empresa text,
        matriz text,
        adquirente text,
        auditoria text,
        ec text,
        despesa_extra numeric,
        observacoes text,
        created_at timestamptz default now()
      )',
      v_table
    );
    execute format('alter table public.%I add column if not exists auditoria text', v_table);
    execute format('alter table public.%I add column if not exists observacoes text', v_table);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', v_table);
    v_seq := format('%s_id_seq', v_table);
    begin
      execute format('grant usage, select on sequence public.%I to authenticated', v_seq);
    exception when undefined_table then
      null;
    end;
    v_created_tables := array_append(v_created_tables, v_table);
  end loop;

  foreach v_item in array coalesce(p_bancos, '{}'::text[])
  loop
    v_bank := public.normalize_identifier(v_item);
    if v_bank is null or v_bank = '' then
      continue;
    end if;

    v_table := format('banco_%s_%s', v_bank, v_empresa);
    execute format(
      'create table if not exists public.%I (
        id bigserial primary key,
        data date,
        descricao text,
        documento text,
        valor numeric,
        empresa text,
        created_at timestamptz default now()
      )',
      v_table
    );
    execute format('grant select, insert, update, delete on table public.%I to authenticated', v_table);
    v_seq := format('%s_id_seq', v_table);
    begin
      execute format('grant usage, select on sequence public.%I to authenticated', v_seq);
    exception when undefined_table then
      null;
    end;
    v_created_tables := array_append(v_created_tables, v_table);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'created_tables', v_created_tables
  );
end;
$$;

revoke all on function public.admin_create_tables_from_form(text, text[], text[], text[]) from public;
grant execute on function public.admin_create_tables_from_form(text, text[], text[], text[]) to authenticated;
