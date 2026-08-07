# Debug Session: pgto-banco-rede-visa
- **Status**: [OPEN]
- **Issue**: PGTO BANCO da REDE / VISA no Sicoob aparece duplicado na controladoria de recebimentos, enquanto em Transações Resumidas o total exibido está correto.
- **Debug Server**: Pending
- **Log File**: .dbg/trae-debug-log-pgto-banco-rede-visa.ndjson

## Reproduction Steps
1. Abrir Controladoria de Recebimentos.
2. Selecionar empresa/período em que a REDE / VISA no Sicoob mostra divergência.
3. Comparar o valor da linha em Transações Resumidas com a coluna PGTO BANCO na controladoria.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | O mesmo lançamento do Sicoob entra duas vezes no mapa do pgto_banco por falha de deduplicação | High | Low | Rejected |
| B | A linha VISA VOUCHER recebe o depósito e depois o valor é somado de novo na linha base VISA | High | Medium | Confirmed |
| C | O grupo REDE recebe um fallback adicional após a classificação principal | Medium | Medium | Rejected |
| D | A normalização de bandeira colapsa linhas no resumo, mas a controladoria soma duas entradas antes da exibição | Medium | Medium | Rejected |
| E | O valor correto é calculado no agrupamento, mas duplica na montagem final da tabela exibida | High | Low | Confirmed |

## Log Evidence
- `A` confirmado como **rejeitado**: o mapa do banco fecha em `175,84` para `REDE / VISA VOUCHER` com três lançamentos (`8,40 + 26,19 + 141,25`) em `.dbg/trae-debug-log-pgto-banco-rede-visa.ndjson`.
- `C` confirmado como **rejeitado**: a atribuição na linha da controladoria registra `pgtoBancoLinha: 175.84` e `bandeirasNormalizadas: { "VISA VOUCHER": 175.84 }`, sem fallback adicional.
- `B` e `E` confirmados: no merge da tabela final aparece `originalPgtoBanco: 175.84` e `pgtoBancoBaseAposMerge: 351.68`, provando que a duplicação acontece ao criar/mesclar a linha base `VISA`.

## Verification Conclusion
O valor correto chega até a linha `VISA VOUCHER` como `175,84`. A duplicação acontece em `ControladoriaRecebimentosTableComplete.vue`, porque a linha sintética criada a partir do voucher já herda `pgto_banco` do spread de `original` e, logo em seguida, soma esse mesmo `pgto_banco` novamente.
