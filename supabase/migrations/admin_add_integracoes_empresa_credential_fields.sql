alter table if exists public.integracoes_empresa
  add column if not exists client_id text,
  add column if not exists client_secret_criptografado text;
