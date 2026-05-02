create or replace function public.admin_list_tables_for_company(
  p_empresa text
)
returns table (
  table_name text,
  category text
)
language sql
security definer
set search_path = public
as $$
  with emp as (
    select public.normalize_identifier(p_empresa) as empresa
  )
  select
    t.tablename as table_name,
    case
      when t.tablename like 'vendas_pix_%' then 'pix_vendas'
      when t.tablename like 'recebimento_pix_%' then 'pix_recebimento'
      when t.tablename like 'vendas_%' then 'vendas'
      when t.tablename like 'recebimento_%' then 'recebimento'
      when t.tablename like 'banco_%' then 'banco'
      else 'outros'
    end as category
  from pg_tables t
  cross join emp
  where t.schemaname = 'public'
    and emp.empresa <> ''
    and (
      t.tablename like format('vendas_%s_%%', emp.empresa)
      or t.tablename like format('recebimento_%s_%%', emp.empresa)
      or t.tablename = format('vendas_pix_%s', emp.empresa)
      or t.tablename = format('recebimento_pix_%s', emp.empresa)
      or (
        t.tablename like 'banco_%'
        and right(t.tablename, length(emp.empresa) + 1) = '_' || emp.empresa
      )
    )
  order by t.tablename;
$$;

create or replace function public.admin_drop_tables(
  p_tables text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table text;
  v_norm text;
  v_dropped text[] := '{}'::text[];
  v_skipped text[] := '{}'::text[];
begin
  foreach v_table in array coalesce(p_tables, '{}'::text[])
  loop
    v_norm := public.normalize_identifier(v_table);
    if v_norm is null or v_norm = '' then
      v_skipped := array_append(v_skipped, coalesce(v_table, ''));
      continue;
    end if;

    if to_regclass(format('public.%I', v_norm)) is null then
      v_skipped := array_append(v_skipped, v_norm);
      continue;
    end if;

    execute format('drop table if exists public.%I cascade', v_norm);
    v_dropped := array_append(v_dropped, v_norm);
  end loop;

  return jsonb_build_object(
    'ok', true,
    'dropped_tables', v_dropped,
    'skipped_tables', v_skipped
  );
end;
$$;

create or replace function public.admin_delete_movimentos_by_month(
  p_empresa text,
  p_adquirentes text[],
  p_mes date,
  p_tipos text[] default array['vendas','recebimento']::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_empresa text;
  v_mes_inicio date;
  v_mes_fim date;
  v_tipo text;
  v_adq text;
  v_table text;
  v_deleted integer;
  v_total integer := 0;
  v_result jsonb := '[]'::jsonb;
  v_vouchers text[] := array[
    'alelo','ticket','vr','sodexo','pluxe','pluxee','comprocard','lecard','upbrasil','ecxcard','fncard','benvisa','credshop','rccard','goodcard','bigcard','bkcard','greencard','brasilcard','boltcard','cabal','verocard','facecard','valecard','naip'
  ]::text[];
begin
  v_empresa := public.normalize_identifier(p_empresa);
  if v_empresa is null or v_empresa = '' then
    raise exception 'Empresa inválida';
  end if;

  v_mes_inicio := date_trunc('month', coalesce(p_mes, current_date))::date;
  v_mes_fim := (v_mes_inicio + interval '1 month')::date;

  foreach v_adq in array coalesce(p_adquirentes, '{}'::text[])
  loop
    v_adq := public.normalize_identifier(v_adq);
    if v_adq is null or v_adq = '' then
      continue;
    end if;

    foreach v_tipo in array coalesce(p_tipos, '{}'::text[])
    loop
      v_tipo := public.normalize_identifier(v_tipo);
      if v_tipo = 'recebimentos' then
        v_tipo := 'recebimento';
      elsif v_tipo = 'voucher_vendas' then
        v_tipo := 'vouchers_vendas';
      elsif v_tipo = 'voucher_recebimentos' then
        v_tipo := 'vouchers_recebimento';
      elsif v_tipo = 'vouchers' then
        v_tipo := 'vouchers_vendas';
      end if;

      if v_tipo not in ('vendas', 'recebimento', 'vouchers_vendas', 'vouchers_recebimento') then
        continue;
      end if;

      if v_tipo = 'vouchers_vendas' then
        if not (v_adq = any(v_vouchers)) then
          continue;
        end if;

        v_table := format('vendas_%s_%s', v_empresa, v_adq);
        if to_regclass(format('public.%I', v_table)) is not null then
          execute format(
            'delete from public.%I where data_venda >= $1 and data_venda < $2',
            v_table
          )
          using v_mes_inicio, v_mes_fim;
          get diagnostics v_deleted = row_count;
          v_total := v_total + coalesce(v_deleted, 0);
          v_result := v_result || jsonb_build_object('table', v_table, 'deleted_rows', coalesce(v_deleted, 0));
        end if;

        v_table := format('recebimento_%s_%s', v_empresa, v_adq);
        if to_regclass(format('public.%I', v_table)) is not null then
          execute format(
            'delete from public.%I where data_venda >= $1 and data_venda < $2',
            v_table
          )
          using v_mes_inicio, v_mes_fim;
          get diagnostics v_deleted = row_count;
          v_total := v_total + coalesce(v_deleted, 0);
          v_result := v_result || jsonb_build_object('table', v_table, 'deleted_rows', coalesce(v_deleted, 0));
        end if;
      elsif v_tipo = 'vouchers_recebimento' then
        if not (v_adq = any(v_vouchers)) then
          continue;
        end if;

        v_table := format('recebimento_%s_%s', v_empresa, v_adq);
        if to_regclass(format('public.%I', v_table)) is not null then
          execute format(
            'delete from public.%I where data_recebimento >= $1 and data_recebimento < $2',
            v_table
          )
          using v_mes_inicio, v_mes_fim;
          get diagnostics v_deleted = row_count;
          v_total := v_total + coalesce(v_deleted, 0);
          v_result := v_result || jsonb_build_object('table', v_table, 'deleted_rows', coalesce(v_deleted, 0));
        end if;
      else
        v_table := format('%s_%s_%s', v_tipo, v_empresa, v_adq);
        if to_regclass(format('public.%I', v_table)) is null then
          continue;
        end if;

        if v_tipo = 'recebimento' then
          execute format(
            'delete from public.%I where data_recebimento >= $1 and data_recebimento < $2',
            v_table
          )
          using v_mes_inicio, v_mes_fim;
        else
          execute format(
            'delete from public.%I where data_venda >= $1 and data_venda < $2',
            v_table
          )
          using v_mes_inicio, v_mes_fim;
        end if;

        get diagnostics v_deleted = row_count;
        v_total := v_total + coalesce(v_deleted, 0);
        v_result := v_result || jsonb_build_object(
          'table', v_table,
          'deleted_rows', coalesce(v_deleted, 0)
        );
      end if;
    end loop;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'month_start', v_mes_inicio,
    'month_end', (v_mes_fim - interval '1 day')::date,
    'total_deleted_rows', v_total,
    'details', v_result
  );
end;
$$;

revoke all on function public.admin_list_tables_for_company(text) from public;
grant execute on function public.admin_list_tables_for_company(text) to authenticated;

revoke all on function public.admin_drop_tables(text[]) from public;
grant execute on function public.admin_drop_tables(text[]) to authenticated;

revoke all on function public.admin_delete_movimentos_by_month(text, text[], date, text[]) from public;
grant execute on function public.admin_delete_movimentos_by_month(text, text[], date, text[]) to authenticated;
