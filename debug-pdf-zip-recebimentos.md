# Debug Session: pdf-zip-recebimentos

- Status: OPEN
- Sintoma principal: exportacao de PDF em ZIP gera arquivo extraido com erro de carregamento de dados
- Sintoma relacionado: algumas paginas falham ao carregar recebimentos mesmo fora da exportacao
- Debug Server: http://127.0.0.1:7777/event
- Log File: .dbg/trae-debug-log-pdf-zip-recebimentos.ndjson

## Reproduction Steps

1. Abrir exportacao de PDF em qualquer pagina da controladoria.
2. Selecionar Controladoria de Recebimentos ou Analise de Recebimentos.
3. Gerar o arquivo.
4. Observar se a page oculta entra em estado de erro e o PDF/ZIP sai com conteudo quebrado.

## Hypotheses & Verification

| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | A consulta de recebimentos falha de forma intermitente em tabelas especificas do Supabase | Alta | Media | Instrumentado com logs por tabela e por tentativa |
| B | Falta retry/tratamento no carregamento de recebimentos e qualquer falha derruba a page | Alta | Baixa | Confirmado por leitura do fluxo em `useSpecificCompanyDataFetcher.js` |
| C | O export monta paginas ocultas demais ao mesmo tempo e aumenta a chance de falha | Alta | Baixa | Confirmado por leitura do fluxo em `ControladoriaPdfExportBase.vue` |
| D | O export considera a page pronta mesmo quando ela esta em erro/incompleta | Alta | Baixa | Confirmado por leitura de `waitForPdfTarget` em `pdfExportUtils.js` |
| E | O ZIP em si esta corrompendo os dados exportados | Baixa | Baixa | Rejeitado por leitura: o ZIP apenas empacota blobs PDF |

## Evidencias

- `pdfGenerationUtils.js` so compacta blobs PDF no ZIP; nao executa leitura de dados.
- `ControladoriaPdfHiddenRenderer.vue` monta paginas reais da aplicacao no renderer oculto.
- `ControladoriaPdfExportBase.vue` montava todas as paginas ocultas de uma vez.
- `pdfExportUtils.js` aceitava um `fallbackTarget` mesmo sem estar pronto.
- `pdfExportUtils.js` podia tratar banner de erro como conteudo valido.
- `useSpecificCompanyDataFetcher.js` consultava tabelas de recebimentos sem retry; qualquer falha encerrava a carga.
- `npm run build` executado com sucesso apos instrumentacao e correcao.

## Proximos passos

- Coletar reproducao com logs pre-fix/post-fix no navegador do usuario
- Confirmar se a exportacao volta a gerar PDFs validos
- Limpar instrumentacao apos confirmacao do usuario
