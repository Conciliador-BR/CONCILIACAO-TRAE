import { computed, ref } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useVendasCRUD } from '~/composables/PageVendas/useVendasCRUD'
import { buildMesesDinamicos, parsePrevisaoDate, resolveMesKeyByDate } from './usePrevisaoDeRecebimentoMeses'

const toNumber = (value) => {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number : 0
}

const normalizeText = (value) => {
  return String(value || '')
    .trim()
}

const formatUpper = (value) => {
  const text = normalizeText(value)
  if (!text) return ''

  return text
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

const getPrevisaoValida = (registro) => {
  const previsaoExistente = registro?.previsao_pgto || registro?.previsaoPgto || ''
  const data = parsePrevisaoDate(previsaoExistente)

  return {
    previsaoRaw: previsaoExistente,
    previsaoDate: data
  }
}

const buildLinhaNome = (registro) => {
  const bandeira = formatUpper(registro?.bandeira || registro?.adquirente_bandeira || '')
  const modalidade = formatUpper(registro?.modalidade || '')

  if (bandeira && modalidade) return `${bandeira} ${modalidade}`
  if (bandeira) return bandeira
  if (modalidade) return modalidade
  return 'SEM CLASSIFICACAO'
}

const buildGrupoNome = (registro) => {
  return formatUpper(registro?.adquirente || 'Sem Adquirente') || 'SEM ADQUIRENTE'
}

const isRegistroAluguelOuMensalidade = (registro) => {
  const texto = [
    registro?.modalidade,
    registro?.bandeira,
    registro?.adquirente_bandeira,
    registro?.tipo_lancamento,
    registro?.lancamento,
    registro?.descricao,
    registro?.observacoes,
    registro?.motivo
  ]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

  const hasAluguel = (
    texto.includes('ALUGUEL') ||
    texto.includes('DESPESA DE ALUGUEL') ||
    texto.includes('ALUGUEL DE MAQUINA')
  )

  const hasMensalidadePinpad = (
    (texto.includes('MENSALIDADE') && (texto.includes('PINPAD') || texto.includes('PIN PAD'))) ||
    texto.includes('MENSALIDADE PIN PAD') ||
    texto.includes('MENSALIDADE PINPAD')
  )

  const hasAjusteMensalidade = (
    texto.includes('AJUSTES/MENSALIDADE PINPAD') ||
    texto.includes('AJUSTES MENSALIDADE') ||
    texto.includes('MENSALIDADE CONECTIVIDADE') ||
    (texto.includes('AJUSTES') && hasMensalidadePinpad)
  )

  return hasAluguel || hasMensalidadePinpad || hasAjusteMensalidade
}

const isRegistroPix = (registro) => {
  const campos = [
    registro?.adquirente,
    registro?.bandeira,
    registro?.adquirente_bandeira,
    registro?.modalidade
  ]

  return campos.some((valor) => {
    const texto = formatUpper(valor)
    return texto.includes('PIX') || texto.includes('QR CODE') || texto.includes('QRCODE')
  })
}

const createLinhaBase = (nome, meses) => {
  const linha = {
    nome,
    valorBruto: 0,
    valorLiquido: 0
  }

  meses.forEach((mes) => {
    linha[mes.key] = 0
  })

  return linha
}

const createTotaisBase = (meses) => {
  const totais = {
    valorBruto: 0,
    valorLiquido: 0
  }

  meses.forEach((mes) => {
    totais[mes.key] = 0
  })

  return totais
}

export const usePrevisaoDeRecebimento = () => {
  const { filtrosGlobais } = useGlobalFilters()
  const { fetchVendas } = useVendasCRUD()

  const loading = ref(false)
  const error = ref('')
  const registrosFonte = ref([])

  const dataBaseFiltro = computed(() => {
    const dataInicial = parsePrevisaoDate(filtrosGlobais.dataInicial)
    if (dataInicial) return dataInicial

    const dataFinal = parsePrevisaoDate(filtrosGlobais.dataFinal)
    if (dataFinal) return dataFinal

    return new Date()
  })

  const meses = computed(() => buildMesesDinamicos(dataBaseFiltro.value, 4))

  const registrosNormalizados = computed(() => {
    return (registrosFonte.value || [])
      .filter((registro) => !isRegistroPix(registro))
      .filter((registro) => !isRegistroAluguelOuMensalidade(registro))
      .map((registro) => {
      const { previsaoRaw, previsaoDate } = getPrevisaoValida(registro)
      const valorBruto = toNumber(registro?.valor_bruto || registro?.vendaBruta)
      const valorLiquido = toNumber(registro?.valor_liquido || registro?.vendaLiquida)

      return {
        ...registro,
        grupoNome: buildGrupoNome(registro),
        linhaNome: buildLinhaNome(registro),
        previsaoRaw,
        previsaoDate,
        valorBruto,
        valorLiquido
      }
      })
  })

  const gruposPorAdquirente = computed(() => {
    const gruposMap = new Map()

    registrosNormalizados.value.forEach((registro) => {
      const grupoNome = registro.grupoNome
      const linhaNome = registro.linhaNome
      const valorBruto = registro.valorBruto
      const valorLiquido = registro.valorLiquido
      const mesKey = resolveMesKeyByDate(registro.previsaoDate, meses.value)

      if (!gruposMap.has(grupoNome)) {
        gruposMap.set(grupoNome, {
          adquirente: grupoNome,
          linhasMap: new Map(),
          totais: createTotaisBase(meses.value)
        })
      }

      const grupo = gruposMap.get(grupoNome)

      if (!grupo.linhasMap.has(linhaNome)) {
        grupo.linhasMap.set(linhaNome, createLinhaBase(linhaNome, meses.value))
      }

      const linha = grupo.linhasMap.get(linhaNome)
      linha.valorBruto += valorBruto
      linha.valorLiquido += valorLiquido
      grupo.totais.valorBruto += valorBruto
      grupo.totais.valorLiquido += valorLiquido

      if (mesKey) {
        linha[mesKey] += valorLiquido
        grupo.totais[mesKey] += valorLiquido
      }
    })

    return Array.from(gruposMap.values()).map((grupo) => ({
      adquirente: grupo.adquirente,
      previsoesData: Array.from(grupo.linhasMap.values()).sort((a, b) => a.nome.localeCompare(b.nome)),
      totais: grupo.totais
    }))
  })

  const totaisGerais = computed(() => {
    const totais = createTotaisBase(meses.value)

    gruposPorAdquirente.value.forEach((grupo) => {
      totais.valorBruto += toNumber(grupo?.totais?.valorBruto)
      totais.valorLiquido += toNumber(grupo?.totais?.valorLiquido)
      meses.value.forEach((mes) => {
        totais[mes.key] += toNumber(grupo?.totais?.[mes.key])
      })
    })

    return totais
  })

  const buscarPrevisoes = async ({ forceReload = false } = {}) => {
    try {
      loading.value = true
      error.value = ''

      const registros = await fetchVendas(forceReload)

      registrosFonte.value = Array.isArray(registros) ? registros : []
    } catch (err) {
      registrosFonte.value = []
      error.value = err?.message || 'Erro ao carregar previsão de recebimento.'
    } finally {
      loading.value = false
    }
  }

  return {
    meses,
    loading,
    error,
    registrosFonte,
    registrosNormalizados,
    gruposPorAdquirente,
    totaisGerais,
    buscarPrevisoes
  }
}
