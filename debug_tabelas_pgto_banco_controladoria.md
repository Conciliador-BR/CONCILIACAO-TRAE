# Debug Session: tabelas-pgto-banco-controladoria
- **Status**: [OPEN]
- **Issue**: Divergencias de PGTO BANCO nas tabelas da controladoria (adquirentes, vouchers e demais tabelas que usam pgto_banco), incluindo casos em que o valor da controladoria nao bate com Transacoes Resumidas ou com o valor do banco.
- **Debug Server**: Running (`tabelas-pgto-banco-controladoria`)
- **Log File**: .dbg/trae-debug-log-tabelas-pgto-banco-controladoria.ndjson

## Reproduction Steps
1. Abrir as paginas da controladoria que exibem colunas de PGTO BANCO.
2. Comparar os valores com Transacoes Resumidas e com os lancamentos do banco.
3. Identificar casos em que o valor aparece duplicado, zerado, classificado em bandeira errada ou atribuido ao grupo errado.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | A mesma transacao bancaria entra mais de uma vez no pipeline de pgto_banco por diferenca entre fontes deduplicadas e fontes brutas | High | Low | Pending |
| B | A classificacao de grupo/bandeira (REDE, CIELO, UNICA, vouchers, etc.) acerta no resumo, mas desvia na controladoria por normalizacao diferente | High | Medium | Pending |
| C | A linha sintetica ou o merge de linhas da tabela final soma pgto_banco duas vezes ao colapsar voucher/bandeira/base | High | Low | Pending |
| D | Existem fallbacks especificos por banco/adquirente que redistribuem pgto_banco mesmo quando a classificacao principal ja resolveu a linha | Medium | Medium | Pending |
| E | Algumas tabelas usam o valor detectado do banco e outras usam o valor consolidado/manual, gerando divergencia entre modulos | Medium | Medium | Pending |

## Log Evidence
- Migrado do caso anterior `REDE / VISA / Sicoob`:
  - O mapa do banco fechou corretamente em `175,84` para `REDE / VISA VOUCHER`.
  - A atribuicao na linha da controladoria tambem chegou correta em `175,84`.
  - A duplicacao aconteceu no merge final da tabela, quando a linha sintetica herdava `pgto_banco` do spread original e somava de novo no merge.

## Coverage
- `usePagamentoDeBanco.js`
  - Loga cada classificacao de transacao que entra no mapa de `pgto_banco`.
- `useRecebimentosGrupos.js`
  - Loga a atribuicao de `pgto_banco` nas linhas da controladoria por grupo/bandeira.
- `ControladoriaRecebimentosTableComplete.vue`
  - Loga merges finais de linhas que alteram `pgto_banco`.
- `useAnaliseDeRecebimentos.js`
  - Loga o total consolidado por adquirente usado no resumo/comparacao.
- `TabelaVouchersRecebimentos.vue`
  - Loga `valorDetectado`, `valorDb` e `valorPrioritario` por voucher.
- `controladoria-vendas/tabela_voucher_manual/carregamento.js`
  - Loga a carga de `pgto_banco` vinda do banco de dados nas tabelas de vouchers de vendas.
- `controladoria-recebimentos/tabela_recebimentos_voucher_manual/carregamento.js`
  - Loga a carga de `pgto_banco` vinda do banco de dados nas tabelas de vouchers de recebimentos.

## Verification Conclusion
Esse arquivo passa a ser a trilha principal de debug para qualquer divergencia de `pgto_banco` na controladoria. O caso `REDE / VISA` virou o primeiro caso documentado e serviu para validar que a nova trilha consegue separar: classificacao, atribuicao na linha, merge final e prioridade entre valor detectado e valor persistido.
