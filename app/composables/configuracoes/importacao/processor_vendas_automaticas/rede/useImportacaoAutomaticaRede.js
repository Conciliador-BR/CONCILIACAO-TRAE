import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useIntegracoesEmpresaSupabase } from '~/composables/configuracoes/cadastro/useIntegracoesEmpresaSupabase'
import { useSeletorIntegracaoEmpresa } from '../useSeletorIntegracaoEmpresa'
import { buildVendasImportacaoRows } from './redeSalesImportMapper'

const LIMITE_MAXIMO_REGISTROS = 500000
const CONSULTA_REDE_VOUCHER_ADICIONAL = {
  brandCode: '',
  brandName: 'VOUCHERS VAN',
  modalidade: 'VAN',
  modalidadeLabel: 'VAN',
  order: 1000
}
export const REDE_GESTAO_VENDAS_ENDPOINT_OPTIONS = [
  {
    key: 'v2_sales',
    label: 'Consultar Vendas V2',
    endpointPath: '/merchant-statement/v2/sales',
    descricao: 'Consulta principal V2 por periodo, bandeira e modalidade.'
  },
  {
    key: 'v1_sales',
    label: 'Consultar Vendas V1',
    endpointPath: '/merchant-statement/v1/sales',
    descricao: 'Consulta principal V1 por periodo, bandeira e modalidade.'
  },
  {
    key: 'v2_sales_summary',
    label: 'Visao Sumarizada V2',
    endpointPath: '/merchant-statement/v2/sales/{merchantId}/summary',
    descricao: 'Visao sumarizada V2 por EC.'
  },
  {
    key: 'v1_sales_summary',
    label: 'Visao Sumarizada V1',
    endpointPath: '/merchant-statement/v1/sales/{companyNumber}/summary',
    descricao: 'Visao sumarizada V1 por EC.'
  },
  {
    key: 'v1_sales_daily',
    label: 'Consultar Vendas por NSU',
    endpointPath: '/merchant-statement/v1/sales/{companyNumber}/daily',
    descricao: 'Consulta diaria/NSU por EC.'
  },
  {
    key: 'v2_installments_detailed',
    label: 'Parceladas Detalhada V2',
    endpointPath: '/merchant-statement/v2/payments/installments/{merchantId}',
    descricao: 'Visao detalhada V2 de parceladas.'
  },
  {
    key: 'v1_installments_detailed',
    label: 'Parceladas Detalhada V1',
    endpointPath: '/merchant-statement/v1/sales/installments',
    descricao: 'Visao detalhada V1 de parceladas.'
  }
]
const REDE_GESTAO_VENDAS_ENDPOINTS_MAP = REDE_GESTAO_VENDAS_ENDPOINT_OPTIONS.reduce((acc, option) => {
  acc[option.key] = option
  return acc
}, {})
const BANDEIRAS_REDE_CARTAO = [
  { code: '1', name: 'VISA' },
  { code: '2', name: 'MASTERCARD' },
  { code: '3', name: 'AMEX' },
  { code: '14', name: 'ELO' },
  { code: '15', name: 'HIPERCARD' }
]
const MODALIDADES_REDE_POR_BANDEIRA = [
  { apiValue: 'DEBIT', label: 'DEBITO' },
  { apiValue: 'CREDIT', label: 'CREDITO' }
]
const CONSULTAS_REDE_POR_BANDEIRA = BANDEIRAS_REDE_CARTAO.flatMap((bandeira, bandeiraIndex) => {
  return MODALIDADES_REDE_POR_BANDEIRA.map((modalidade, modalidadeIndex) => ({
    brandCode: bandeira.code,
    brandName: bandeira.name,
    modalidade: modalidade.apiValue,
    modalidadeLabel: modalidade.label,
    order: (bandeiraIndex * MODALIDADES_REDE_POR_BANDEIRA.length) + modalidadeIndex
  }))
})
const CONSULTAS_REDE = [
  ...CONSULTAS_REDE_POR_BANDEIRA,
  {
    brandCode: '',
    brandName: '',
    modalidade: '',
    modalidadeLabel: 'TODAS',
    order: 999
  }
]

const replaceEndpointPlaceholders = (endpointPath, ecConsulta) => {
  return String(endpointPath || '')
    .replace('{merchantId}', ecConsulta)
    .replace('{companyNumber}', ecConsulta)
    .replace('{parentCompanyNumber}', ecConsulta)
}

export const getGestaoVendasEndpointConfig = (endpointKey = 'v2_sales', ecConsulta = '') => {
  const option = REDE_GESTAO_VENDAS_ENDPOINTS_MAP[endpointKey] || REDE_GESTAO_VENDAS_ENDPOINTS_MAP.v2_sales
  return {
    ...option,
    endpointPath: replaceEndpointPlaceholders(option?.endpointPath, ecConsulta)
  }
}

const construirQueryParamsRede = ({ ecConsulta, dataInicial, dataFinal, modalidade, brandCode }) => {
  return {
    parentCompanyNumber: ecConsulta,
    subsidiaries: ecConsulta,
    brands: brandCode,
    modalities: modalidade,
    startDate: dataInicial,
    endDate: dataFinal
  }
}

const parseIsoDate = (value) => {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null

  const [year, month, day] = text.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return Number.isNaN(date.getTime()) ? null : date
}

const formatIsoDate = (date) => {
  return date.toISOString().slice(0, 10)
}

const buildDailyPeriods = (dataInicial, dataFinal) => {
  const start = parseIsoDate(dataInicial)
  const end = parseIsoDate(dataFinal)

  if (!start || !end || start > end) {
    return [{
      dataInicial,
      dataFinal
    }]
  }

  const periods = []
  const current = new Date(start.getTime())

  while (current <= end) {
    const isoDate = formatIsoDate(current)
    periods.push({
      dataInicial: isoDate,
      dataFinal: isoDate
    })
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return periods
}

const criarChaveTransacao = (item) => {
  const partes = [
    item?.nsuHost,
    item?.nsu,
    item?.transactionCode,
    item?.saleSummaryNumber,
    item?.id,
    item?.authorizationCode,
    item?.amount,
    item?.grossAmount,
    item?.grossValue,
    item?.movementDate,
    item?.saleDate,
    item?.transactionDate,
    item?.captureDate,
    item?.captureTime,
    item?.saleTime,
    item?.transactionTime
  ]
    .map((valor) => String(valor ?? '').trim())
    .filter(Boolean)

  return partes.length > 0 ? partes.join('|') : JSON.stringify(item)
}

const executarConsultaRedePorPeriodo = async ({
  accessToken,
  integracaoId,
  ecConsulta,
  dataInicial,
  dataFinal,
  incluirVouchers = false,
  endpointKey = 'v2_sales'
}) => {
  const resultadosConsultas = []
  const consultasRede = incluirVouchers
    ? [...CONSULTAS_REDE, CONSULTA_REDE_VOUCHER_ADICIONAL]
    : CONSULTAS_REDE
  const endpointConfig = getGestaoVendasEndpointConfig(endpointKey, ecConsulta)

  // Executa as consultas em lotes menores para evitar rate limit (ex: 3 por vez)
  const tamanhoLote = 3
  for (let i = 0; i < consultasRede.length; i += tamanhoLote) {
    const lote = consultasRede.slice(i, i + tamanhoLote)
    const promessasLote = lote.map((consulta) => {
      return $fetch('/api/configuracoes/rede/teste-autenticacao', {
        method: 'POST',
        body: {
          integrationId: Number(integracaoId),
          endpointPath: endpointConfig.endpointPath,
          method: 'GET',
          timeoutMs: 60000,
          paginateAll: true,
          maxPaginatedRecords: LIMITE_MAXIMO_REGISTROS,
          paginationStrategy: 'page',
          paginationPageParam: 'page',
          paginationSizeParam: 'size',
          paginationStartPage: 1,
          paginationPageSize: 100,
          queryParams: construirQueryParamsRede({
            ecConsulta,
            dataInicial,
            dataFinal,
            modalidade: consulta.modalidade,
            brandCode: consulta.brandCode
          }),
          paymentsEndpointPath: '',
          paymentsQueryParams: {}
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }).then((payload) => ({
        ...payload,
        consulta,
        periodo: {
          dataInicial,
          dataFinal
        }
      }))
    })

    const resultadosLote = await Promise.allSettled(promessasLote)
    resultadosConsultas.push(...resultadosLote)

    if (i + tamanhoLote < consultasRede.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return {
    payloads: resultadosConsultas
      .filter((resultado) => resultado.status === 'fulfilled')
      .map((resultado) => resultado.value),
    erros: resultadosConsultas
      .filter((resultado) => resultado.status === 'rejected')
      .map((resultado) => resultado.reason)
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
    dataFinal = '',
    incluirVouchers = false,
    endpointKey = 'v2_sales'
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
      const periodosConsulta = buildDailyPeriods(dataInicial, dataFinal)
      const payloads = []
      const errosConsultas = []

      for (const periodo of periodosConsulta) {
        const resultadoPeriodo = await executarConsultaRedePorPeriodo({
          accessToken,
          integracaoId: integracao.id,
          ecConsulta,
          dataInicial: periodo.dataInicial,
          dataFinal: periodo.dataFinal,
          incluirVouchers,
          endpointKey
        })

        payloads.push(...resultadoPeriodo.payloads)
        errosConsultas.push(...resultadoPeriodo.erros)
      }

      if (payloads.length === 0) {
        const primeiroErro = errosConsultas[0]
        throw new Error(
          primeiroErro?.data?.statusMessage
          || primeiroErro?.message
          || 'Falha ao puxar as vendas via API da Rede.'
        )
      }

      const transactions = []
      const transactionKeys = new Set()

      payloads.forEach((payload) => {
        const consulta = payload?.consulta || null
        const payloadTransactions = Array.isArray(payload?.request?.transactions) ? payload.request.transactions : []

        payloadTransactions.forEach((item) => {
          const key = criarChaveTransacao(item)
          if (transactionKeys.has(key)) return
          transactionKeys.add(key)
          transactions.push({
            ...item,
            __consultaRede: {
              ...consulta,
              dataInicial: payload?.periodo?.dataInicial || null,
              dataFinal: payload?.periodo?.dataFinal || null
            }
          })
        })
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
        endpointKey,
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
