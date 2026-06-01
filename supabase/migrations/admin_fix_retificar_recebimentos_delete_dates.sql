drop function if exists public.admin_delete_movimentos_by_month(text, text[], date, text[]);

create or replace function public.admin_delete_movimentos_by_month(
  p_empresa text,
  p_adquirentes text[],
  p_mes date,
  p_tipos text[] default array['vendas','recebimento']::text[],
  p_ec text default null
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
  v_has_data_recebimento boolean;
  v_has_data_pgto boolean;
  v_has_data_venda boolean;
  v_has_matriz boolean;
  v_data_ref_expr text;
  v_ec text;
begin
  v_empresa := public.normalize_identifier(p_empresa);
  if v_empresa is null or v_empresa = '' then
    raise exception 'Empresa inválida';
  end if;

  v_ec := regexp_replace(coalesce(p_ec, ''), '[^0-9]', '', 'g');

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
          select exists(
            select 1
            from information_schema.columns
            where table_schema = 'public'
              and table_name = v_table
              and column_name = 'matriz'
          ) into v_has_matriz;

          if v_ec <> '' and v_has_matriz then
            execute format(
              'delete from public.%I where data_venda >= $1 and data_venda < $2 and regexp_replace(coalesce(matriz, ''''), ''[^0-9]'', '''', ''g'') = $3',
              v_table
            )
            using v_mes_inicio, v_mes_fim, v_ec;
          else
            execute format(
              'delete from public.%I where data_venda >= $1 and data_venda < $2',
              v_table
            )
            using v_mes_inicio, v_mes_fim;
          end if;
          get diagnostics v_deleted = row_count;
          v_total := v_total + coalesce(v_deleted, 0);
          v_result := v_result || jsonb_build_object('table', v_table, 'deleted_rows', coalesce(v_deleted, 0));
        end if;

        v_table := format('recebimento_%s_%s', v_empresa, v_adq);
        if to_regclass(format('public.%I', v_table)) is not null then
          select
            exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'data_recebimento'
            ),
            exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'data_pgto'
            ),
            exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'data_venda'
            )
          into v_has_data_recebimento, v_has_data_pgto, v_has_data_venda;

          if v_has_data_recebimento and v_has_data_pgto and v_has_data_venda then
            v_data_ref_expr := 'coalesce(data_recebimento, data_pgto, data_venda)';
          elsif v_has_data_recebimento and v_has_data_pgto then
            v_data_ref_expr := 'coalesce(data_recebimento, data_pgto)';
          elsif v_has_data_recebimento and v_has_data_venda then
            v_data_ref_expr := 'coalesce(data_recebimento, data_venda)';
          elsif v_has_data_pgto and v_has_data_venda then
            v_data_ref_expr := 'coalesce(data_pgto, data_venda)';
          elsif v_has_data_recebimento then
            v_data_ref_expr := 'data_recebimento';
          elsif v_has_data_pgto then
            v_data_ref_expr := 'data_pgto';
          elsif v_has_data_venda then
            v_data_ref_expr := 'data_venda';
          else
            v_data_ref_expr := null;
          end if;

          if v_data_ref_expr is not null then
            select exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'matriz'
            ) into v_has_matriz;

            if v_ec <> '' and v_has_matriz then
              execute format(
                'delete from public.%I where %s >= $1 and %s < $2 and regexp_replace(coalesce(matriz, ''''), ''[^0-9]'', '''', ''g'') = $3',
                v_table,
                v_data_ref_expr,
                v_data_ref_expr
              )
              using v_mes_inicio, v_mes_fim, v_ec;
            else
              execute format(
                'delete from public.%I where %s >= $1 and %s < $2',
                v_table,
                v_data_ref_expr,
                v_data_ref_expr
              )
              using v_mes_inicio, v_mes_fim;
            end if;
            get diagnostics v_deleted = row_count;
            v_total := v_total + coalesce(v_deleted, 0);
            v_result := v_result || jsonb_build_object('table', v_table, 'deleted_rows', coalesce(v_deleted, 0));
          end if;
        end if;
      elsif v_tipo = 'vouchers_recebimento' then
        if not (v_adq = any(v_vouchers)) then
          continue;
        end if;

        v_table := format('recebimento_%s_%s', v_empresa, v_adq);
        if to_regclass(format('public.%I', v_table)) is not null then
          select
            exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'data_recebimento'
            ),
            exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'data_pgto'
            ),
            exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'data_venda'
            )
          into v_has_data_recebimento, v_has_data_pgto, v_has_data_venda;

          if v_has_data_recebimento and v_has_data_pgto and v_has_data_venda then
            v_data_ref_expr := 'coalesce(data_recebimento, data_pgto, data_venda)';
          elsif v_has_data_recebimento and v_has_data_pgto then
            v_data_ref_expr := 'coalesce(data_recebimento, data_pgto)';
          elsif v_has_data_recebimento and v_has_data_venda then
            v_data_ref_expr := 'coalesce(data_recebimento, data_venda)';
          elsif v_has_data_pgto and v_has_data_venda then
            v_data_ref_expr := 'coalesce(data_pgto, data_venda)';
          elsif v_has_data_recebimento then
            v_data_ref_expr := 'data_recebimento';
          elsif v_has_data_pgto then
            v_data_ref_expr := 'data_pgto';
          elsif v_has_data_venda then
            v_data_ref_expr := 'data_venda';
          else
            v_data_ref_expr := null;
          end if;

          if v_data_ref_expr is not null then
            select exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'matriz'
            ) into v_has_matriz;

            if v_ec <> '' and v_has_matriz then
              execute format(
                'delete from public.%I where %s >= $1 and %s < $2 and regexp_replace(coalesce(matriz, ''''), ''[^0-9]'', '''', ''g'') = $3',
                v_table,
                v_data_ref_expr,
                v_data_ref_expr
              )
              using v_mes_inicio, v_mes_fim, v_ec;
            else
              execute format(
                'delete from public.%I where %s >= $1 and %s < $2',
                v_table,
                v_data_ref_expr,
                v_data_ref_expr
              )
              using v_mes_inicio, v_mes_fim;
            end if;
            get diagnostics v_deleted = row_count;
            v_total := v_total + coalesce(v_deleted, 0);
            v_result := v_result || jsonb_build_object('table', v_table, 'deleted_rows', coalesce(v_deleted, 0));
          end if;
        end if;
      else
        v_table := format('%s_%s_%s', v_tipo, v_empresa, v_adq);
        if to_regclass(format('public.%I', v_table)) is null then
          continue;
        end if;

        if v_tipo = 'recebimento' then
          select
            exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'data_recebimento'
            ),
            exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'data_pgto'
            ),
            exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'data_venda'
            )
          into v_has_data_recebimento, v_has_data_pgto, v_has_data_venda;

          if v_has_data_recebimento and v_has_data_pgto and v_has_data_venda then
            v_data_ref_expr := 'coalesce(data_recebimento, data_pgto, data_venda)';
          elsif v_has_data_recebimento and v_has_data_pgto then
            v_data_ref_expr := 'coalesce(data_recebimento, data_pgto)';
          elsif v_has_data_recebimento and v_has_data_venda then
            v_data_ref_expr := 'coalesce(data_recebimento, data_venda)';
          elsif v_has_data_pgto and v_has_data_venda then
            v_data_ref_expr := 'coalesce(data_pgto, data_venda)';
          elsif v_has_data_recebimento then
            v_data_ref_expr := 'data_recebimento';
          elsif v_has_data_pgto then
            v_data_ref_expr := 'data_pgto';
          elsif v_has_data_venda then
            v_data_ref_expr := 'data_venda';
          else
            v_data_ref_expr := null;
          end if;

          if v_data_ref_expr is not null then
            select exists(
              select 1
              from information_schema.columns
              where table_schema = 'public'
                and table_name = v_table
                and column_name = 'matriz'
            ) into v_has_matriz;

            if v_ec <> '' and v_has_matriz then
              execute format(
                'delete from public.%I where %s >= $1 and %s < $2 and regexp_replace(coalesce(matriz, ''''), ''[^0-9]'', '''', ''g'') = $3',
                v_table,
                v_data_ref_expr,
                v_data_ref_expr
              )
              using v_mes_inicio, v_mes_fim, v_ec;
            else
              execute format(
                'delete from public.%I where %s >= $1 and %s < $2',
                v_table,
                v_data_ref_expr,
                v_data_ref_expr
              )
              using v_mes_inicio, v_mes_fim;
            end if;
          else
            continue;
          end if;
        else
          select exists(
            select 1
            from information_schema.columns
            where table_schema = 'public'
              and table_name = v_table
              and column_name = 'matriz'
          ) into v_has_matriz;

          if v_ec <> '' and v_has_matriz then
            execute format(
              'delete from public.%I where data_venda >= $1 and data_venda < $2 and regexp_replace(coalesce(matriz, ''''), ''[^0-9]'', '''', ''g'') = $3',
              v_table
            )
            using v_mes_inicio, v_mes_fim, v_ec;
          else
            execute format(
              'delete from public.%I where data_venda >= $1 and data_venda < $2',
              v_table
            )
            using v_mes_inicio, v_mes_fim;
          end if;
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

revoke all on function public.admin_delete_movimentos_by_month(text, text[], date, text[], text) from public;
grant execute on function public.admin_delete_movimentos_by_month(text, text[], date, text[], text) to authenticated;
