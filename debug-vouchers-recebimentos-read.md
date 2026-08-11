# [OPEN] Debug Session: vouchers-recebimentos-read

## Sintoma
- A linha manual na tabela de vouchers de recebimentos aparenta salvar, mas depois nao reaparece ao recarregar.

## Hipoteses Iniciais
- H1. O envio grava em uma tabela diferente da que o carregamento consulta.
- H2. O envio grava, mas com campos-chave (`empresa`, `adquirente`, `matriz/ec`, `data_venda`, `created_at`) que nao casam com o filtro de leitura.
- H3. A leitura encontra a tabela correta, mas falha silenciosamente durante o carregamento e reseta a linha para zero.
- H4. A linha manual e salva corretamente, mas a deteccao de "linha manual do mes" nao a reconhece.
- H5. O componente recarrega e sobrescreve os dados lidos por um estado posterior.

## Plano de Evidencia
- Instrumentar envio para registrar tabela, payload-chave e resultado.
- Instrumentar carregamento para registrar tabela escolhida, filtros usados e linhas encontradas.
- Reproduzir o fluxo com um valor simples e comparar pre-save / post-load.

## Sessao
- Debug Server: http://127.0.0.1:7777/event
- Log File: .dbg/trae-debug-log-vouchers-recebimentos-read.ndjson

## Passos de Reproducao
1. Abrir a tela de vouchers de recebimentos.
2. Informar um valor simples, por exemplo `10,00`, em `valor bruto` e `valor liquido`.
3. Clicar em `Enviar`.
4. Clicar em `Recarregar`.
