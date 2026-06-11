import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useIntegracoesEmpresaSupabase } from '~/composables/configuracoes/cadastro/useIntegracoesEmpresaSupabase'
import { useSeletorIntegracaoEmpresa } from '../useSeletorIntegracaoEmpresa'
import { buildVendasImportacaoRows } from './redeSalesImportMapper'

const LIMITE_MAXIMO_REGISTROS = 500000

const construirQueryParamsRede = ({ ecConsulta, dataInicial, dataFinal, modalidade }) => {
  return {
    parentCompanyNumber: ecConsulta,
    subsidiaries: ecConsulta,
    modalities: modalidade,
    startDate: dataInicial,
    endDate: dataFinal
  }
}

export const useImportacaoAutomaticaRede = () => {
  const carregando = ref(false)
  const erro = ref('')
  const integracaoEncontrada = ref(null)
  const criterioBusca = ref('')

  const { listarIntegracoes } = useIntegracoesEmpresaSupabase()
  const { selecionarIntegracao, normalizarEc } = useSeletorIntegracaoEmpresa()

  const limparEstado = () => {
    erro.value = ''
    integracaoEncontrada.value = null
    criterioBusca.value = ''
  }

  const obterAccessToken = async () => {
    const { data } = await supabase.auth.getSession()
    const accessToken = String(data?.session?.access_token || '').trim()

    if (!accessToken) {
      throw new Error('Sessao expirada. Faca login novamente.')
    }

    return accessToken
  }

  const importarVendas = async ({
    nomeEmpresa = '',
    ecEmpresa = '',
    dataInicial = '',
    dataFinal = ''
  }) => {
    carregando.value = true
    erro.value = ''

    try {
      if (!String(nomeEmpresa || '').trim()) {
        throw new Error('Nao foi possivel identificar a empresa selecionada.')
      }

      if (!String(ecEmpresa || '').trim()) {
        throw new Error('A empresa selecionada nao possui EC/matriz preenchida.')
      }

      if (!String(dataInicial || '').trim() || !String(dataFinal || '').trim()) {
        throw new Error('Selecione o periodo no filtro de data antes de puxar as vendas.')
      }

      const integracoes = await listarIntegracoes()
      const { integracao, criterio } = selecionarIntegracao({
        integracoes,
        adquirente: 'rede',
        nomeEmpresa,
        ecEmpresa
      })

      if (!integracao) {
        throw new Error(`Nenhuma integracao ativa da Rede foi encontrada para ${nomeEmpresa} com a matriz ${ecEmpresa}.`)
      }

      const ecConsulta = normalizarEc(integracao.ec_adquirente || integracao.matriz || ecEmpresa)
      if (!ecConsulta) {
        throw new Error('A integracao localizada nao possui EC valida para consulta na API da Rede.')
      }

      const accessToken = await obterAccessToken()
      const modalidades = ['DEBIT', 'CREDIT']
      const payloads = await Promise.all(
        modalidades.map((modalidade) => {
          return $fetch('/api/configuracoes/teste-autenticacao', {
            method: 'POST',
            body: {
              integrationId: Number(integracao.id),
              endpointPath: '/merchant-statement/v1/sales',
              method: 'GET',
              timeoutMs: 60000,
              paginateAll: true,
              maxPaginatedRecords: LIMITE_MAXIMO_REGISTROS,
              queryParams: construirQueryParamsRede({
                ecConsulta,
                dataInicial,
                dataFinal,
                modalidade
              }),
              paymentsEndpointPath: '',
              paymentsQueryParams: {}
            },
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          })
        })
      )

      const transactions = payloads.flatMap((payload) => {
        return Array.isArray(payload?.request?.transactions) ? payload.request.transactions : []
      })

      const payload = {
        ...(payloads[0] || {}),
        request: {
          ...(payloads[0]?.request || {}),
          quantity: transactions.length,
          transactions
        }
      }

      const registros = buildVendasImportacaoRows({
        payload,
        integracao,
        nomeEmpresa,
        matrizEmpresa: ecEmpresa
      })

      integracaoEncontrada.value = integracao
      criterioBusca.value = criterio

      return {
        integracao,
        criterio,
        ecConsulta,
        payload,
        registros
      }
    } catch (error) {
      erro.value = error?.data?.statusMessage || error?.message || 'Falha ao puxar as vendas via API da Rede.'
      throw new Error(erro.value)
    } finally {
      carregando.value = false
    }
  }

  return {
    carregando,
    erro,
    integracaoEncontrada,
    criterioBusca,
    limparEstado,
    importarVendas
  }
}
