# Debug Session: sales-date-state
- **Status**: [OPEN]
- **Issue**: O seletor global mostra setembro, mas o card de importacao automatica recebe agosto e encontra zero arquivos.
- **Debug Server**: pendente
- **Log File**: .dbg/trae-debug-log-sales-date-state.ndjson

## Reproduction Steps
1. Abrir Importacao de Vendas.
2. Selecionar 01/09/2026 a 30/09/2026.
3. Selecionar Comprocard e modo API.
4. Atualizar ou processar vendas.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Evidence |
|----|------------|------------|----------|
| A | A pagina copia datas globais apenas na montagem | Alta | Pendente |
| B | O seletor e a importacao usam estados diferentes | Alta | Pendente |
| C | Props do card nao sao reativas ou possuem nomes incompativeis | Media | Pendente |
| D | A chamada usa snapshot antigo dos filtros | Media | Pendente |

## Log Evidence
Pendente.

## Verification Conclusion
Pendente.
