import { useTableNameBuilder } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useTableNameBuilder'
import { useEmpresaHelpers } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useEmpresaHelpers'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { normalizarEcNumerico } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual/supabaseUtils'
import { useManualAutorizadaBase } from './useManualAutorizadaBase'

export const useManualAutorizadaRecebimentos = (filtroAtivoRef) => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { filtrosGlobais } = useGlobalFilters()

  return useManualAutorizadaBase({
    filtroAtivoRef,
    obterEmpresaSelecionadaCompleta,
    filtrosGlobais,
    construirNomeTabela,
    normalizarEcNumerico,
    context: 'recebimentos',
    storagePrefix: 'controladoria:recebimentos:autorizada-manual'
  })
}
