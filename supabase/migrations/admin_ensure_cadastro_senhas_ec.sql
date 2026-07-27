alter table if exists public.cadastro_senhas
add column if not exists ec numeric;

create index if not exists idx_cadastro_senhas_empresa_ec
on public.cadastro_senhas (empresa, ec);
