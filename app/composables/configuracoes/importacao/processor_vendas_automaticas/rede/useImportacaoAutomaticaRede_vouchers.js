import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useIntegracoesEmpresaSupabase } from '~/composables/configuracoes/cadastro/useIntegracoesEmpresaSupabase'
import { useSeletorIntegracaoEmpresa } from '../useSeletorIntegracaoEmpresa'
import { getGestaoVendasEndpointConfig } from './useImportacaoAutomaticaRede'

const LIMITE_MAXIMO_REGISTROS = 500000

const CONSULTAS_REDE_VOUCHER = [
  {
    brandCode: '1',
    brandName: 'VISA VOUCHER VAN',
    modalidade: 'VAN',
    modalidadeLabel: 'VAN',
    order: 1
  },
  {
    brandCode: '2',
    brandName: 'MASTERCARD VOUCHER VAN',
    modalidade: 'VAN',
    modalidadeLabel: 'VAN',
    order: 2
  },
  {
    brandCode: '3',
    brandName: 'AMEX VOUCHER VAN',
    modalidade: 'VAN',
    modalidadeLabel: 'VAN',
    order: 3
  },
  {
    brandCode: '14',
    brandName: 'ELO VOUCHER VAN',
    modalidade: 'VAN',
    modalidadeLabel: 'VAN',
    order: 4
  }
]

const construirQueryParamsRedeVoucher = ({ ecConsulta, dataInicial, dataFinal, brandCode, modalidade }) => {
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

const aguardar = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const formatarErroConsulta = (error, consulta = null, periodo = null) => {
  const detalhesConsulta = consulta
    ? ` [brand=${consulta?.brandCode || 'TODAS'} modalidade=${consulta?.modalidade || consulta?.modalidadeLabel || 'TODAS'}]`
    : ''
  const detalhesPeriodo = periodo
    ? ` [periodo=${periodo?.dataInicial || '-'} ate ${periodo?.dataFinal || '-'}]`
    : ''

  return `${error?.data?.statusMessage || error?.message || 'Falha ao consultar a API da Rede.'}${detalhesPeriodo}${detalhesConsulta}`
}

const criarErroParcialConsultas = (erros = []) => {
  const mensagens = erros
    .filter(Boolean)
    .map(item => `- ${item}`)
    .slice(0, 5)

  const sufixo = erros.length > 5 ? `\n- ... e mais ${erros.length - 5} erro(s)` : ''

  return new Error([
    'Falha parcial ao puxar os vouchers via API da Rede.',
    'A importacao foi interrompida para evitar resultado incompleto.',
    ...mensagens,
    sufixo
  ].filter(Boolean).join('\n'))
}

const normalizarTexto = (valor) => {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
}

const getValueByPath = (source, path) => {
  return String(path || '')
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), source)
}

const getFirstDefined = (source, paths = []) => {
  for (const path of paths) {
    const value = getValueByPath(source, path)
    if (value !== null && value !== undefined && value !== '') {
      return value
    }
  }

  return null
}

const getAllDefinedValues = (source, paths = []) => {
  return paths
    .map((path) => getValueByPath(source, path))
    .filter((value) => value !== null && value !== undefined && value !== '')
}

const isRegistroVoucherRede = (item) => {
  const valoresAnalise = [
    ...getAllDefinedValues(item, ['modality.description', 'modality.name', 'modality.code', 'modality']),
    ...getAllDefinedValues(item, ['transactionType.description', 'transactionType.name', 'transactionType.code', 'transactionType']),
    ...getAllDefinedValues(item, ['productType.description', 'productType.name', 'productType.code', 'productType']),
    ...getAllDefinedValues(item, ['captureType.description', 'captureType.name', 'captureType.code', 'captureType']),
    ...getAllDefinedValues(item, ['kind', 'type', 'subType', 'cardType']),
    ...getAllDefinedValues(item, ['brandName', 'brandDescription', 'brandCodeDescription']),
    ...getAllDefinedValues(item, ['cardBrand.description', 'cardBrand.name', 'cardBrand.code', 'cardBrand.id']),
    ...getAllDefinedValues(item, ['issuer', 'issuerName', 'issuer.description', 'issuer.name']),
    ...getAllDefinedValues(item, ['__consultaRede.modalidade', '__consultaRede.brandCode', '__consultaRede.brandName'])
  ]

  const texto = normalizarTexto(valoresAnalise.join(' '))
  if (!texto) return false

  const isBandeiraPat = (
    texto.includes('VISA')
    || texto.includes('MASTER')
    || texto.includes('ELO')
    || texto.includes(' 1 ')
    || texto.includes(' 2 ')
    || texto.includes(' 14 ')
  )

  return (
    texto.includes('VAN') ||
    texto.includes('VOUCHER') ||
    texto.includes('BENEF') ||
    texto.includes('MULTI BENEF') ||
    texto.includes('MULTIBENEF') ||
    texto.includes('ALIMENTA') ||
    texto.includes('REFEICAO') ||
    texto.includes('PAT') ||
    texto.includes('VENDAS FULL') ||
    texto.includes('VENDA FULL') ||
    (texto.includes('FULL') && isBandeiraPat)
  )
}

const executarConsultaRedeVoucherPorPeriodo = async ({
  accessToken,
  integracaoId,
  ecConsulta,
  dataInicial,
  dataFinal,
  endpointKey = 'v2_sales'
}) => {
  const tamanhoLote = 3
  const endpointConfig = getGestaoVendasEndpointConfig(endpointKey, ecConsulta)
  const resultadosConsultas = []

  for (let i = 0; i < CONSULTAS_REDE_VOUCHER.length; i += tamanhoLote) {
    const lote = CONSULTAS_REDE_VOUCHER.slice(i, i + tamanhoLote)
    const promessasLote = lote.map((consulta) => {
      return (async () => {
        let ultimoErro = null

        for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
          try {
            const payload = await $fetch('/api/configuracoes/rede/teste-autenticacao', {
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
                queryParams: construirQueryParamsRedeVoucher({
                  ecConsulta,
                  dataInicial,
                  dataFinal,
                  brandCode: consulta.brandCode,
                  modalidade: consulta.modalidade
                }),
                paymentsEndpointPath: '',
                paymentsQueryParams: {}
              },
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            })

            return {
              ...payload,
              consulta,
              periodo: {
                dataInicial,
                dataFinal
              },
              tentativa
            }
          } catch (error) {
            ultimoErro = error

            if (tentativa >= 3) {
              throw error
            }

            await aguardar(500 * tentativa)
          }
        }

        throw ultimoErro || new Error('Falha ao consultar vouchers na API da Rede.')
      })()
    })

    const resultadosLote = await Promise.allSettled(promessasLote)
    resultadosConsultas.push(...resultadosLote)

    if (i + tamanhoLote < CONSULTAS_REDE_VOUCHER.length) {
      await aguardar(500)
    }
  }

  return {
    payloads: resultadosConsultas.reduce((acc, resultado) => {
      if (resultado.status === 'fulfilled') {
        acc.push(resultado.value)
      }
      return acc
    }, []),
    erros: resultadosConsultas.reduce((acc, resultado, index) => {
      if (resultado.status === 'rejected') {
        acc.push(formatarErroConsulta(resultado.reason, CONSULTAS_REDE_VOUCHER[index], { dataInicial, dataFinal }))
      }
      return acc
    }, [])
  }
}

export const useImportacaoAutomaticaRede_vouchers = () => {
  const carregando = ref(false)
  const erro = ref('')
  const integracaoEncontrada = ref(null)
  const criterioBusca = ref('')

  const { listarIntegracoes } = useIntegracoesEmpresaSupabase()
  const { selecionarIntegracao, normalizarEc, normalizarTexto } = useSeletorIntegracaoEmpresa()

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

  const selecionarIntegracaoFallback = (integracoes = [], nomeEmpresa = '', ecEmpresa = '') => {
    const adquirenteNormalizado = normalizarTexto('rede')
    const nomeNormalizado = normalizarTexto(nomeEmpresa)
    const ecNormalizada = normalizarEc(ecEmpresa)

    const candidatas = (integracoes || [])
      .filter((item) => normalizarTexto(item?.adquirente) === adquirenteNormalizado)
      .map((item) => {
        let score = 0
        const nomeItem = normalizarTexto(item?.nome_empresa)
        const matrizItem = normalizarEc(item?.matriz)
        const ecAdquirente = normalizarEc(item?.ec_adquirente)
        const updatedAt = new Date(item?.updated_at || item?.created_at || 0).getTime()

        if (ecNormalizada) {
          if (matrizItem && matrizItem === ecNormalizada) score += 200
          if (ecAdquirente && ecAdquirente === ecNormalizada) score += 120
        }

        if (nomeNormalizado && nomeItem) {
          if (nomeItem === nomeNormalizado) score += 80
          else if (nomeItem.includes(nomeNormalizado) || nomeNormalizado.includes(nomeItem)) score += 40
        }

        if (item?.ativo) score += 20

        return {
          item,
          score,
          updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0
        }
      })
      .sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score
        return b.updatedAt - a.updatedAt
      })

    return candidatas[0]?.item || null
  }

  const importarVouchers = async ({
    nomeEmpresa = '',
    ecEmpresa = '',
    dataInicial = '',
    dataFinal = '',
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
        throw new Error('Selecione o periodo no filtro de data antes de puxar os dados.')
      }

      const integracoes = await listarIntegracoes()
      const { integracao: integracaoSelecionada, criterio } = selecionarIntegracao({
        integracoes,
        adquirente: 'rede',
        nomeEmpresa,
        ecEmpresa
      })
      const integracao = integracaoSelecionada || selecionarIntegracaoFallback(integracoes, nomeEmpresa, ecEmpresa)
      const criterioFinal = integracaoSelecionada ? criterio : 'fallback_rede'

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

      for (const periodo of periodosConsulta) {
        const resultadoPeriodo = await executarConsultaRedeVoucherPorPeriodo({
          accessToken,
          integracaoId: integracao.id,
          ecConsulta,
          dataInicial: periodo.dataInicial,
          dataFinal: periodo.dataFinal,
          endpointKey
        })

        if (resultadoPeriodo.erros.length > 0) {
          throw criarErroParcialConsultas(resultadoPeriodo.erros)
        }

        payloads.push(...resultadoPeriodo.payloads)
      }

      if (payloads.length === 0) {
        throw new Error(
          'Falha ao puxar os dados brutos via API da Rede.'
        )
      }

      const registros = []
      const transactionKeys = new Set()

      payloads.forEach((payload) => {
        const consulta = payload?.consulta || null
        const payloadTransactions = Array.isArray(payload?.request?.transactions) ? payload.request.transactions : []

        payloadTransactions.forEach((item) => {
          const itemComContexto = {
            ...item,
            __consultaRede: {
              ...consulta,
              dataInicial: payload?.periodo?.dataInicial || null,
              dataFinal: payload?.periodo?.dataFinal || null
            }
          }

          if (!isRegistroVoucherRede(itemComContexto)) return

          const key = criarChaveTransacao(itemComContexto)
          if (transactionKeys.has(key)) return
          transactionKeys.add(key)
          registros.push(itemComContexto)
        })
      })

      integracaoEncontrada.value = integracao
      criterioBusca.value = criterioFinal

      return {
        integracao,
        criterio: criterioFinal,
        ecConsulta,
        endpointKey,
        payloads,
        registros
      }
    } catch (error) {
      erro.value = error?.data?.statusMessage || error?.message || 'Falha ao puxar os dados brutos via API da Rede.'
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
    importarVouchers
  }
}
