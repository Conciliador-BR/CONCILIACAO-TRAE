# Debug Session: sicredi-summary-crash
- **Status**: [OPEN]
- **Issue**: Cliente com banco Sicredi entra em `Bancos > Extrato Detalhado > Transacoes Resumidas`, a tela fica branca, o site trava e as transacoes nao sao resumidas.
- **Debug Server**: http://127.0.0.1:7777/event
- **Log File**: .dbg/trae-debug-log-sicredi-summary-crash.ndjson

## Reproduction Steps
1. Entrar com cliente que tenha Sicredi.
2. Abrir a page `Bancos`.
3. Ir em `Extrato Detalhado`.
4. Clicar em `Transacoes Resumidas`.
5. Observar tela branca, travamento e ausencia de resumo.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | O detector/resumo do Sicredi gera um erro de renderizacao ao montar grupos ou subgrupos. | High | Low | Pending |
| B | O `TransacoesResumidasBancoShared` envia um grupo invalido ou componente nulo para renderizacao do Sicredi. | High | Low | Pending |
| C | O volume de transacoes do Sicredi dispara montagem pesada/infinita ao entrar em `Transacoes Resumidas`. | Medium | Medium | Pending |
| D | O cliente limitado recebe dados/parcialmente inconsistentes no extrato e a aba resumida nao trata esse formato. | Medium | Medium | Pending |
| E | Algum componente compartilhado do resumo quebra ao receber dados do Sicredi importado manualmente. | Medium | Low | Pending |

## Log Evidence
- Instrumentacao ativa em:
  - `app/components/bancos/ExtratoDetalhadoContainer.vue`
  - `app/components/configuracoes/importacao/importacao_bancos/TransacoesResumidasBancoShared.vue`
  - `app/components/configuracoes/importacao/importacao_bancos/Detectador_Adquirentes/DetectadorAdquirentesSicredi.vue`
- Log limpo e pronto para reproducao `pre-fix`.

## Verification Conclusion
- Pending
