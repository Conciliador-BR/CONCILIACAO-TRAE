import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useTableNameBuilder } from '~/composables/PageVendas/filtrar_tabelas/useTableNameBuilder'
import { useEmpresaHelpers } from '~/composables/PageVendas/filtrar_tabelas/useEmpresaHelpers'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useBatchDataFetcher } from '~/composables/PageVendas/filtrar_tabelas/useBatchDataFetcher'
import { calcularValoresVoucher } from './calculos'
import { criarFetchVendasVoucher } from './carregamento'
import { criarEnviarVenda, criarGetTableName } from './envio'
import { criarResolvers } from './resolvers'
import { criarVerificarTabelaExiste } from './supabaseUtils'
import { criarListaVouchersInicial } from './voucherState'
import { criarFetchTaxas } from './taxas'

export const useVouchersManual = (filtroAtivoRef) => {
  const vouchersData = ref(criarListaVouchersInicial())
  const loading = ref(false)
  const error = ref(null)
  const successMessage = ref(null)

  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { filtrosGlobais } = useGlobalFilters()
  const { buscarDadosTabela, buscarDadosTabelaAlternativo } = useBatchDataFetcher()
  const resolverOperadorasCadastradas = async () => {
    const empresa = await obterEmpresaSelecionadaCompleta()
    const autorizadoras = String(empresa?.autorizadoras || '')
    return autorizadoras
      .split(/[;,]/)
      .map(op => String(op || '').trim())
      .filter(Boolean)
  }

  const { verificarTabelaExiste } = criarVerificarTabelaExiste({ supabase })
  const { resolverEmpresaNome, resolverEmpresaEC, resolverPeriodoTrabalho } = criarResolvers({ filtroAtivoRef, obterEmpresaSelecionadaCompleta, filtrosGlobais })

  const setLoading = (v) => { loading.value = Boolean(v) }
  const setError = (v) => { error.value = v }
  const setSuccess = (v) => { successMessage.value = v }

  const calcularValores = (voucher) => {
    calcularValoresVoucher(voucher)
  }

  const { fetchVendasVoucher } = criarFetchVendasVoucher({
    vouchersData,
    construirNomeTabela,
    verificarTabelaExiste,
    buscarDadosTabela,
    buscarDadosTabelaAlternativo,
    resolverEmpresaEC,
    resolverOperadorasCadastradas,
    resolverPeriodoTrabalho,
    setError,
    calcularValores
  })

  const { fetchTaxas } = criarFetchTaxas({
    supabase,
    vouchersData,
    resolverEmpresaNome,
    setLoading,
    setError,
    setSuccess,
    fetchVendasVoucher,
    calcularValores
  })

  const { getTableName } = criarGetTableName({ construirNomeTabela })
  const { enviarVenda } = criarEnviarVenda({
    supabase,
    getTableName,
    resolverEmpresaNome,
    resolverEmpresaEC,
    resolverPeriodoTrabalho,
    setError,
    setSuccess,
    setLoading,
    calcularValores
  })

  return {
    vouchersData,
    loading,
    error,
    successMessage,
    fetchTaxas,
    calcularValores,
    enviarVenda
  }
}
