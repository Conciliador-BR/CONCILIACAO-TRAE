# Debug Session: pix-fetch-refresh

- Status: OPEN
- Sintoma principal: erro intermitente `Erro ao carregar PIX: TypeError: Failed to fetch`
- Sintoma relacionado: valores em tabelas nem sempre atualizam na tela sem refresh manual da pagina

## Reproduction Steps

1. Abrir tabelas de PIX em Controladoria Vendas ou Recebimentos.
2. Observar se a carga inicial falha com `Failed to fetch`.
3. Inserir, editar ou remover uma linha.
4. Verificar se o valor atualizado aparece sem recarregar a pagina.

## Hypotheses

1. Falha transitoria de rede derruba a tabela inteira porque o composable nao preserva o ultimo estado valido.
2. Salvamento/remocao atualiza o banco, mas nao sincroniza corretamente o estado local e os blocos dependentes.
3. Requests concorrentes sobrescrevem o estado com resposta antiga.
4. Leituras de PIX nao usam cache por filtro e recarregam desnecessariamente ao remontar.
5. O caminho de leitura via `readTablePage` ou Supabase nao tem retry suficiente para falhas temporarias.

## Evidence

- `usePixRecebimentosManual.js` limpava `pixData` no catch de carga, o que derrubava a tabela inteira em falha transitória.
- `usePixVendasManual.js` tinha o mesmo comportamento de limpar dados no catch.
- Ambos os fluxos de salvar dependiam de um `fetch` logo depois do sucesso; se a releitura falhasse, a UI ficava com erro apesar do banco ja ter sido atualizado.
- As linhas salvas nao sincronizavam imediatamente `_nome_db`, `_bruto_db`, `_mdr_db` e `_liquido_db`, entao a tela podia continuar parecendo "nao atualizada" ate um refresh.
- `usePixRecebimentosManual.js` tinha um bug adicional no fallback combinado: `ecColumn` podia chegar indefinido ao salvar.
- `npm run build` executado com sucesso apos a instrumentacao e a correcao.

## Next Steps

- Validar no navegador as tabelas de PIX em Vendas e Recebimentos
- Confirmar se os valores persistem sem refresh manual
- Aguardar sua confirmacao para limpar a instrumentacao
