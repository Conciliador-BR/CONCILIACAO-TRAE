import { useTableNameBuilder } from '~/composables/PageVendas/filtrar_tabelas/useTableNameBuilder'
import { useEmpresaHelpers } from '~/composables/PageVendas/filtrar_tabelas/useEmpresaHelpers'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { normalizarEcNumerico } from '~/composables/PageControladoria/controladoria-vendas/tabela_voucher_manual/supabaseUtils'
import { useManualAutorizadaBase } from './useManualAutorizadaBase'

export const useManualAutorizadaVendas = (filtroAtivoRef) => {
  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { filtrosGlobais } = useGlobalFilters()

  return useManualAutorizadaBase({
    filtroAtivoRef,
    obterEmpresaSelecionadaCompleta,
    filtrosGlobais,
    construirNomeTabela,
    normalizarEcNumerico,
    context: 'vendas',
    storagePrefix: 'controladoria:vendas:autorizada-manual'
  })
}
