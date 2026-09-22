-- Read-only diagnosis. Run with an administrative connection, not in the browser.
-- Requires pg_stat_statements to be installed. Compare deltas between two captures.
set search_path = public, extensions;

select queryid, calls,
       round(mean_exec_time::numeric, 2) as mean_ms,
       round(total_exec_time::numeric, 2) as total_ms,
       rows, shared_blks_hit, shared_blks_read, temp_blks_written,
       query
from pg_stat_statements
where query ~* '(vendas_|recebimento_|banco_)'
order by total_exec_time desc
limit 30;

-- Inspect existing indexes before applying any DDL.
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename ~ '^(vendas_|recebimento_|banco_)'
order by tablename, indexname;

-- Generate candidates only. Review against EXPLAIN (ANALYZE, BUFFERS)
-- using the actual empresa/matriz/date predicates and the authenticated role.
-- Execute each approved CREATE INDEX CONCURRENTLY outside a transaction.
-- Do NOT apply every candidate: use only the date column used by that table.
select c.relname as tabela, d.attname as coluna_data,
       format(
         'CREATE INDEX CONCURRENTLY IF NOT EXISTS %I ON %I.%I USING btree (%I, %I);',
         'perf_filter_' || substr(md5(c.relname || ':' || d.attname), 1, 16),
         n.nspname, c.relname, m.attname, d.attname
       ) as ddl_candidato,
       format('ANALYZE %I.%I;', n.nspname, c.relname) as atualizar_estatisticas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute m on m.attrelid = c.oid
  and m.attname = 'matriz' and not m.attisdropped
join pg_attribute d on d.attrelid = c.oid and not d.attisdropped
  and (
    (c.relname ~ '^vendas_' and d.attname in ('data_venda', 'previsao_pgto'))
    or (c.relname ~ '^recebimento_pix_' and d.attname = 'data_venda')
    or (c.relname ~ '^recebimento_' and c.relname !~ '^recebimento_pix_'
        and d.attname in ('data_recebimento', 'data_pgto', 'data_pagamento', 'data'))
    or (c.relname ~ '^banco_' and d.attname = 'data')
  )
where n.nspname = 'public' and c.relkind = 'r'
  and not exists (
    select 1 from pg_index i
    where i.indrelid = c.oid and i.indisvalid
      and i.indpred is null and i.indexprs is null
      and i.indkey[0] = m.attnum and i.indkey[1] = d.attnum
  )
order by c.relname, d.attname;

-- B-tree on empresa alone does not solve ILIKE '%empresa%'.
-- Prefer the existing matriz equality + date range before adding trigram indexes.
-- BRIN is a candidate only for large, physically date-correlated append-only tables.
-- Aggregation RPCs must preserve RLS (SECURITY INVOKER), tenant scope, date semantics,
-- MDR, anticipation, rent signs and manual deltas. Do not replace these with a
-- generic SUM or a materialized view exposed directly to authenticated users.
