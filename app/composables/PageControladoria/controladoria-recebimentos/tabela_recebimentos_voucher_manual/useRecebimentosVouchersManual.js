import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useTableNameBuilder } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useTableNameBuilder'
import { useEmpresaHelpers } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useEmpresaHelpers'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useBatchDataFetcher } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useBatchDataFetcher'
import { calcularValoresVoucherRecebimento } from './calculos'
import { criarFetchRecebimentosVoucher } from './carregamento'
import { criarEnviarRecebimento, criarGetTableName } from './envio'
import { criarResolvers } from './resolvers'
import { criarVerificarTabelaExiste } from './supabaseUtils'
import { criarListaVouchersInicial } from './voucherState'

export const useRecebimentosVouchersManual = (filtroAtivoRef) => {
  const vouchersData = ref([])
  const loading = ref(false)
  const error = ref(null)
  const successMessage = ref(null)

  const { construirNomeTabela } = useTableNameBuilder()
  const { obterEmpresaSelecionadaCompleta } = useEmpresaHelpers()
  const { filtrosGlobais } = useGlobalFilters()
  const { buscarDadosTabela, buscarDadosTabelaAlternativo } = useBatchDataFetcher()

  const { listarOperadorasComTabela, resolverNomeTabelaOperadora } = criarVerificarTabelaExiste({ supabase })
  const { resolverEmpresaNome, resolverEmpresaEC, resolverPeriodoTrabalho } = criarResolvers({ filtroAtivoRef, obterEmpresaSelecionadaCompleta, filtrosGlobais })
  const resolverOperadorasDisponiveis = async (empresa) => {
    return await listarOperadorasComTabela(empresa, 'recebimento')
  }
  const formatarNomeVoucher = (valor) => String(valor || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()

  const sincronizarVouchersDaEmpresa = async (empresa) => {
    const operadoras = await resolverOperadorasDisponiveis(empresa)
    const nomes = [...new Set(
      (operadoras || [])
        .map(formatarNomeVoucher)
        .filter(Boolean)
    )]
    vouchersData.value = criarListaVouchersInicial(nomes)

    return nomes
  }

  const setLoading = (v) => { loading.value = Boolean(v) }
  const setError = (v) => { error.value = v }
  const setSuccess = (v) => { successMessage.value = v }

  const calcularValores = (voucher) => {
    calcularValoresVoucherRecebimento(voucher)
  }

  const { fetchRecebimentosVoucher } = criarFetchRecebimentosVoucher({
    vouchersData,
    buscarDadosTabela,
    buscarDadosTabelaAlternativo,
    resolverEmpresaEC,
    resolverPeriodoTrabalho,
    resolverOperadorasDisponiveis,
    resolverNomeTabelaOperadora,
    setError,
    calcularValores
  })

  const { getTableName } = criarGetTableName({ construirNomeTabela })
  const { enviarRecebimento } = criarEnviarRecebimento({
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

  const carregar = async () => {
    const empresaAtual = await resolverEmpresaNome()
    if (!empresaAtual) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      await sincronizarVouchersDaEmpresa(empresaAtual)
      await fetchRecebimentosVoucher(empresaAtual)
    } catch (e) {
      setError(`Erro ao carregar recebimentos: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return {
    vouchersData,
    loading,
    error,
    successMessage,
    carregar,
    calcularValores,
    enviarRecebimento
  }
}
