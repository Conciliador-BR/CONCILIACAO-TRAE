import { computed, ref } from 'vue'
import { useRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/useRecebimentos'
import { useRecebimentosVouchersManual } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual'
import { usePixRecebimentosManual } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_pix_recebimentos/usePixRecebimentosManual'
import { useExtratoDetalhado } from '~/composables/PageBancos/useExtratoDetalhado'
import { useAdquirenteDetector } from '~/composables/useAdquirenteDetector'
import { useRecebimentosGrupos } from '~/composables/PageControladoria/controladoria-recebimentos/recebimentoscontainer/useRecebimentosGrupos'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { criarMapaPagamentosBanco } from '~/composables/PageControladoria/analise-de-recebimentos/pagamento_de_banco/usePagamentoDeBanco'
import {
  mapearAdquirenteParaGrupo,
  normalizarGrupoAdquirente,
  parseValorExtrato
} from '~/composables/PageControladoria/controladoria-recebimentos/recebimentoscontainer/recebimentosUtils'

const VOUCHER_BRANDS = new Set([
  'alelo', 'ticket', 'vr', 'sodexo', 'pluxe', 'pluxee', 'comprocard', 'lecard', 'upbrasil',
  'ecxcard', 'fncard', 'benvisa', 'credshop', 'rccard', 'goodcard', 'bigcard', 'bkcard',
  'greencard', 'brasilcard', 'boltcard', 'verocard', 'facecard', 'valecard', 'naip',
  'nutricash', 'libercard'
])

const toNumber = (value) => Number.parseFloat(value ?? 0) || 0

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()

const normalizeKey = (value) => normalizeText(value).replace(/[^a-z0-9]/g, '')

const toDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatMonthKey = (date) => {
  if (!date) return 'Sem periodo'
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const formatMonthLabel = (key) => {
  if (!key || key === 'Sem periodo') return 'Sem periodo'
  const [year, month] = key.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

const getCategoria = (registro) => {
  const modalidade = normalizeText(registro.modalidade)
  const bandeira = normalizeKey(registro.bandeira)
  const adquirente = normalizeKey(registro.adquirente)
  const texto = `${modalidade} ${bandeira} ${adquirente}`.trim()

  if (texto.includes('pix') || texto.includes('qrcode')) return 'PIX'
  if (
    modalidade.includes('voucher') ||
    modalidade.includes('alimentacao') ||
    modalidade.includes('refeicao') ||
    VOUCHER_BRANDS.has(bandeira) ||
    VOUCHER_BRANDS.has(adquirente)
  ) {
    return 'Voucher'
  }
  if (modalidade.includes('debito')) return 'Debito'
  if (modalidade.includes('credito')) return 'Credito'
  if (modalidade.includes('antecip')) return 'Antecipacao'
  if (modalidade.includes('aluguel') || modalidade.includes('ajuste') || modalidade.includes('desconto')) {
    return 'Debito Operacional'
  }
  return 'Outros'
}

const aggregateBy = (items, getKey, createAccumulator, reducer, sorter) => {
  const groups = new Map()

  items.forEach((item) => {
    const key = getKey(item)
    if (!groups.has(key)) {
      groups.set(key, createAccumulator(item, key))
    }
    reducer(groups.get(key), item)
  })

  const result = Array.from(groups.values())
  if (typeof sorter === 'function') {
    result.sort(sorter)
  }
  return result
}

export const useAnaliseDeRecebimentos = () => {
  const filtroAtivo = ref(null)
  const { filtrosGlobais } = useGlobalFilters()
  const { detectarAdquirente } = useAdquirenteDetector()
  const { recebimentos, loading: recebimentosLoading, error: recebimentosError, fetchRecebimentos } = useRecebimentos()
  const { vouchersData, loading: vouchersLoading, error: vouchersError, carregar: carregarVouchers } = useRecebimentosVouchersManual(filtroAtivo)
  const { pixData, loading: pixLoading, error: pixError, fetchPixRecebimentos } = usePixRecebimentosManual(filtroAtivo)
  const { transacoes, loading: extratoLoading, error: extratoError, buscarTransacoesBancarias } = useExtratoDetalhado()

  const normalizeString = (str) => {
    if (!str) return ''
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.\-_\s]/g, '')
  }

  const classificarBandeira = (bandeira, modalidade) => {
    const bandeiraNorm = normalizeString(bandeira)
    const modalidadeNorm = normalizeString(modalidade)

    if (bandeiraNorm.includes('pix') || modalidadeNorm.includes('pix') || modalidadeNorm.includes('qrcode')) return 'PIX'
    if (VOUCHER_BRANDS.has(normalizeKey(bandeira)) || VOUCHER_BRANDS.has(normalizeKey(modalidade))) return String(bandeira || modalidade || 'VOUCHER').toUpperCase()
    if (bandeiraNorm.includes('visa') && modalidadeNorm.includes('debito')) return 'VISA ELECTRON'
    if (bandeiraNorm.includes('visa')) return 'VISA'
    if ((bandeiraNorm.includes('mastercard') || bandeiraNorm.includes('master') || bandeiraNorm.includes('maestro')) && modalidadeNorm.includes('debito')) return 'MAESTRO'
    if (bandeiraNorm.includes('mastercard') || bandeiraNorm.includes('master')) return 'MASTERCARD'
    if (bandeiraNorm.includes('elo') && modalidadeNorm.includes('debito')) return 'ELO DÉBITO'
    if (bandeiraNorm.includes('elo')) return 'ELO CRÉDITO'
    if (bandeiraNorm.includes('amex')) return 'AMEX'
    if (bandeiraNorm.includes('hipercard')) return 'HIPERCARD'
    if (bandeiraNorm.includes('cabal')) return 'CABAL'
    return String(bandeira || 'OUTROS').toUpperCase()
  }

  const determinarModalidade = (modalidade, numeroParcelas, bandeira = '') => {
    const modalidadeNorm = normalizeString(modalidade)
    const bandeiraNorm = normalizeString(bandeira)
    const parcelas = Number.parseInt(numeroParcelas, 10) || 1
    const texto = `${modalidadeNorm}${bandeiraNorm}`

    if (texto.includes('pix') || texto.includes('qrcode')) return 'debito'
    if (modalidadeNorm.includes('voucher') || modalidadeNorm.includes('alimentacao') || modalidadeNorm.includes('refeicao')) return 'voucher'
    if (modalidadeNorm.includes('debito')) return 'debito'
    if (modalidadeNorm.includes('antecip')) return 'credito'
    if (parcelas === 1) return 'credito'
    if (parcelas === 2) return 'credito2x'
    if (parcelas === 3) return 'credito3x'
    if (parcelas >= 4) return 'credito4x5x6x'
    return 'outros'
  }

  const loading = computed(() => (
    recebimentosLoading.value ||
    vouchersLoading.value ||
    pixLoading.value ||
    extratoLoading.value
  ))

  const error = computed(() => (
    recebimentosError.value ||
    vouchersError.value ||
    pixError.value ||
    extratoError.value ||
    null
  ))

  const dataPadraoAnalise = computed(() => {
    return filtrosGlobais.dataFinal || filtrosGlobais.dataInicial || new Date().toISOString().slice(0, 10)
  })

  const linhasVoucherVisiveis = computed(() => {
    return (vouchersData.value || []).filter((voucher) => voucher?._table_exists === true && Boolean(voucher?._table_name))
  })

  const linhasPixVisiveis = computed(() => {
    return (pixData.value || []).filter((linha) => {
      return Boolean(String(linha?.nome || linha?._nome_db || '').trim()) ||
        Number(linha?.valor_bruto || 0) > 0 ||
        Number(linha?.valor_liquido || 0) > 0 ||
        (Array.isArray(linha?._db_ids) && linha._db_ids.length > 0)
    })
  })

  const recebimentosCompletos = computed(() => {
    const base = (recebimentos.value || []).map((item) => ({ ...item }))
    const dataManual = dataPadraoAnalise.value

    const vouchersManuais = linhasVoucherVisiveis.value.map((voucher) => ({
      id: `voucher-${voucher.nome}`,
      sourceTable: voucher._table_name || 'manual_voucher',
      empresa: filtrosGlobais.empresaSelecionada || '',
      matriz: '',
      adquirente: voucher.nome || 'VOUCHER',
      modalidade: 'Voucher',
      bandeira: voucher.nome || 'VOUCHER',
      nsu: '',
      dataVenda: dataManual,
      dataRecebimento: dataManual,
      dataPgto: dataManual,
      valorRecebido: voucher.valor_liquido || 0,
      valorBruto: voucher.valor_bruto || 0,
      valorLiquido: voucher.valor_liquido || 0,
      valorPrevisto: voucher.valor_previsto || voucher.valor_liquido || 0,
      valorPago: voucher.valor_previsto || voucher.valor_liquido || 0,
      numeroParcelas: 1,
      taxaMdr: 0,
      despesaMdr: voucher.despesa_mdr || 0,
      despesaExtra: 0,
      despesaAntecipacao: voucher.despesa_antecipacao || 0,
      observacoes: voucher.observacoes || ''
    }))

    const pixManuais = linhasPixVisiveis.value.map((linha) => ({
      id: `pix-${linha._row_key || linha.nome}`,
      sourceTable: 'recebimento_pix_manual',
      empresa: filtrosGlobais.empresaSelecionada || '',
      matriz: '',
      adquirente: linha.nome || 'PIX',
      modalidade: 'Pix',
      bandeira: 'PIX',
      nsu: '',
      dataVenda: dataManual,
      dataRecebimento: dataManual,
      dataPgto: dataManual,
      valorRecebido: linha.valor_liquido || 0,
      valorBruto: linha.valor_bruto || 0,
      valorLiquido: linha.valor_liquido || 0,
      valorPrevisto: linha.valor_liquido || 0,
      valorPago: linha.valor_liquido || 0,
      numeroParcelas: 1,
      taxaMdr: 0,
      despesaMdr: linha.despesa_mdr || 0,
      despesaExtra: 0,
      despesaAntecipacao: 0,
      observacoes: ''
    }))

    return [...base, ...pixManuais, ...vouchersManuais]
  })

  const registrosNormalizados = computed(() => {
    return recebimentosCompletos.value.map((registro) => {
      const dataBase = toDate(registro.dataRecebimento) || toDate(registro.dataPgto) || toDate(registro.dataVenda)
      const valorBruto = toNumber(registro.valorBruto)
      const valorLiquido = toNumber(registro.valorLiquido || registro.valorRecebido)
      const valorPrevisto = toNumber(registro.valorPrevisto || registro.valorLiquido || registro.valorRecebido)
      const despesaMdr = toNumber(registro.despesaMdr)
      const despesaExtra = toNumber(registro.despesaExtra)
      const despesaAntecipacao = toNumber(registro.despesaAntecipacao)
      const despesaTotal = despesaMdr + despesaExtra + despesaAntecipacao

      return {
        id: registro.id,
        empresa: registro.empresa || 'Sem empresa',
        matriz: registro.matriz || 'Sem matriz',
        adquirente: String(registro.adquirente || 'Sem adquirente').trim() || 'Sem adquirente',
        bandeira: String(registro.bandeira || 'Sem bandeira').trim() || 'Sem bandeira',
        modalidade: String(registro.modalidade || 'Sem modalidade').trim() || 'Sem modalidade',
        categoria: getCategoria(registro),
        dataBase,
        periodo: formatMonthKey(dataBase),
        valorBruto,
        valorLiquido,
        valorPrevisto,
        despesaMdr,
        despesaExtra,
        despesaAntecipacao,
        despesaTotal,
        numeroParcelas: Number.parseInt(registro.numeroParcelas, 10) || 1,
        sourceTable: registro.sourceTable || ''
      }
    })
  })

  const resumoExecutivo = computed(() => {
    return registrosNormalizados.value.reduce((acc, item) => {
      acc.quantidade += 1
      acc.valorBruto += item.valorBruto
      acc.valorLiquido += item.valorLiquido
      acc.valorPrevisto += item.valorPrevisto
      acc.despesaMdr += item.despesaMdr
      acc.despesaExtra += item.despesaExtra
      acc.despesaAntecipacao += item.despesaAntecipacao
      acc.despesaTotal += item.despesaTotal
      return acc
    }, {
      quantidade: 0,
      valorBruto: 0,
      valorLiquido: 0,
      valorPrevisto: 0,
      despesaMdr: 0,
      despesaExtra: 0,
      despesaAntecipacao: 0,
      despesaTotal: 0
    })
  })

  const rankingAdquirentes = computed(() => {
    const totalLiquido = resumoExecutivo.value.valorLiquido || 0

    return aggregateBy(
      registrosNormalizados.value,
      (item) => item.adquirente,
      (_, key) => ({
        nome: key,
        quantidade: 0,
        valorBruto: 0,
        valorLiquido: 0,
        valorPrevisto: 0,
        despesaTotal: 0,
        participacao: 0,
        taxaEfetiva: 0
      }),
      (acc, item) => {
        acc.quantidade += 1
        acc.valorBruto += item.valorBruto
        acc.valorLiquido += item.valorLiquido
        acc.valorPrevisto += item.valorPrevisto
        acc.despesaTotal += item.despesaTotal
      },
      (a, b) => b.valorLiquido - a.valorLiquido
    ).map((item) => ({
      ...item,
      participacao: totalLiquido > 0 ? (item.valorLiquido / totalLiquido) * 100 : 0,
      taxaEfetiva: item.valorBruto > 0 ? (item.despesaTotal / item.valorBruto) * 100 : 0
    }))
  })

  const rankingBandeiras = computed(() => {
    return aggregateBy(
      registrosNormalizados.value,
      (item) => item.bandeira,
      (_, key) => ({
        nome: key,
        quantidade: 0,
        valorLiquido: 0,
        valorPrevisto: 0
      }),
      (acc, item) => {
        acc.quantidade += 1
        acc.valorLiquido += item.valorLiquido
        acc.valorPrevisto += item.valorPrevisto
      },
      (a, b) => b.valorLiquido - a.valorLiquido
    )
  })

  const rankingModalidades = computed(() => {
    return aggregateBy(
      registrosNormalizados.value,
      (item) => item.categoria,
      (_, key) => ({
        nome: key,
        quantidade: 0,
        valorLiquido: 0,
        despesaTotal: 0,
        taxaEfetiva: 0
      }),
      (acc, item) => {
        acc.quantidade += 1
        acc.valorLiquido += item.valorLiquido
        acc.despesaTotal += item.despesaTotal
      },
      (a, b) => b.valorLiquido - a.valorLiquido
    ).map((item) => ({
      ...item,
      taxaEfetiva: item.valorLiquido > 0 ? (item.despesaTotal / item.valorLiquido) * 100 : 0
    }))
  })

  const analiseTemporal = computed(() => {
    return aggregateBy(
      registrosNormalizados.value,
      (item) => item.periodo,
      (_, key) => ({
        periodo: key,
        label: formatMonthLabel(key),
        quantidade: 0,
        valorLiquido: 0,
        valorPrevisto: 0
      }),
      (acc, item) => {
        acc.quantidade += 1
        acc.valorLiquido += item.valorLiquido
        acc.valorPrevisto += item.valorPrevisto
      },
      (a, b) => a.periodo.localeCompare(b.periodo)
    )
  })

  const melhorAdquirente = computed(() => rankingAdquirentes.value[0] || null)

  const periodoAnalisado = computed(() => {
    const datas = registrosNormalizados.value
      .map((item) => item.dataBase)
      .filter(Boolean)
      .sort((a, b) => a - b)

    if (datas.length === 0) return 'Sem periodo selecionado'
    if (datas.length === 1) {
      return datas[0].toLocaleDateString('pt-BR')
    }

    return `${datas[0].toLocaleDateString('pt-BR')} ate ${datas[datas.length - 1].toLocaleDateString('pt-BR')}`
  })

  const cardsResumo = computed(() => ([
    {
      id: 'liquido',
      titulo: 'Liquido Recebido',
      valor: resumoExecutivo.value.valorLiquido,
      tipo: 'currency',
      destaque: 'bg-gradient-to-br from-blue-600 to-sky-600'
    },
    {
      id: 'previsto',
      titulo: 'Valor Previsto',
      valor: resumoExecutivo.value.valorPrevisto,
      tipo: 'currency',
      destaque: 'bg-gradient-to-br from-indigo-600 to-violet-600'
    },
    {
      id: 'despesas',
      titulo: 'Despesas Totais',
      valor: resumoExecutivo.value.despesaTotal,
      tipo: 'currency',
      destaque: 'bg-gradient-to-br from-rose-500 to-red-600'
    },
    {
      id: 'transacoes',
      titulo: 'Transacoes',
      valor: resumoExecutivo.value.quantidade,
      tipo: 'number',
      destaque: 'bg-gradient-to-br from-slate-700 to-slate-900'
    }
  ]))

  const insights = computed(() => {
    const adquirente = melhorAdquirente.value
    const modalidade = rankingModalidades.value[0]

    return [
      {
        titulo: 'Maior concentracao',
        descricao: adquirente
          ? `${adquirente.nome} representa ${adquirente.participacao.toFixed(1)}% do liquido analisado`
          : 'Nenhum adquirente encontrado no periodo'
      },
      {
        titulo: 'Categoria dominante',
        descricao: modalidade
          ? `${modalidade.nome} lidera com ${modalidade.quantidade} registros e ${modalidade.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          : 'Sem categorias consolidadas'
      },
      {
        titulo: 'Ponto de atencao',
        descricao: adquirente
          ? `${adquirente.nome} concentra ${adquirente.quantidade} registros no periodo analisado`
          : 'Sem concentracoes relevantes identificadas'
      }
    ]
  })

  const analiseVouchers = computed(() => {
    return aggregateBy(
      registrosNormalizados.value.filter((item) => item.categoria === 'Voucher'),
      (item) => item.adquirente,
      (_, key) => ({
        nome: key,
        quantidade: 0,
        valorLiquido: 0,
        valorPrevisto: 0
      }),
      (acc, item) => {
        acc.quantidade += 1
        acc.valorLiquido += item.valorLiquido
        acc.valorPrevisto += item.valorPrevisto
      },
      (a, b) => b.valorLiquido - a.valorLiquido
    )
  })

  const { gruposPorAdquirente } = useRecebimentosGrupos({
    recebimentos: recebimentosCompletos,
    transacoes,
    classificarBandeira,
    determinarModalidade,
    normalizeString
  })

  const gruposDetalhados = computed(() => {
    return (gruposPorAdquirente.value || [])
      .filter((grupo) => Number(grupo?.totais?.vendaBruta || 0) > 0 || Number(grupo?.totais?.valorPago || 0) > 0)
      .sort((a, b) => Number(b?.totais?.valorPago || 0) - Number(a?.totais?.valorPago || 0))
  })

  const transacoesBancoUnicas = computed(() => {
    const unicas = new Map()

    ;(transacoes.value || []).forEach((transacao) => {
      const valor = Number(parseValorExtrato(transacao) || 0)
      const chave = [
        String(transacao?.banco || '').trim(),
        String(transacao?.data || '').trim(),
        String(transacao?.descricao || '').trim(),
        String(transacao?.documento ?? transacao?.doc ?? transacao?.document ?? '').trim(),
        Number.isFinite(valor) ? valor.toFixed(2) : '0.00'
      ].join('|')

      if (!unicas.has(chave)) {
        unicas.set(chave, transacao)
      }
    })

    return Array.from(unicas.values())
  })

  const mapaPagamentosBancoResumo = computed(() => {
    return criarMapaPagamentosBanco(transacoesBancoUnicas.value || [], detectarAdquirente)
  })

  const resumoNomenclaturasDepositos = computed(() => {
    const grupos = new Map()

    ;(transacoesBancoUnicas.value || []).forEach((transacao) => {
      const valor = Number(parseValorExtrato(transacao) || 0)
      if (valor <= 0) return

      const descricao = String(transacao?.descricao || '').trim()
      const documento = String(transacao?.documento ?? transacao?.doc ?? transacao?.document ?? '').trim()
      const contexto = `${descricao} ${documento}`.trim()
      if (!contexto) return

      const detectado = detectarAdquirente(descricao, transacao?.banco) || detectarAdquirente(contexto, transacao?.banco)
      if (!detectado?.base) return

      const categoria = String(detectado?.categoria || '')
      const nomeGrupo = categoria === 'Voucher'
        ? String(mapearAdquirenteParaGrupo(detectado.base) || detectado.base).trim()
        : String(normalizarGrupoAdquirente(detectado.base) || detectado.base).trim()

      if (!nomeGrupo) return

      if (!grupos.has(nomeGrupo)) {
        grupos.set(nomeGrupo, {
          nome: nomeGrupo,
          categoria,
          totalPgtoBanco: 0,
          quantidade: 0,
          nomenclaturas: new Set()
        })
      }

      const grupo = grupos.get(nomeGrupo)
      grupo.quantidade += 1
      if (grupo.nomenclaturas.size < 4) {
        grupo.nomenclaturas.add(contexto)
      }
    })

    return Array.from(grupos.values())
      .map((item) => ({
        ...item,
        totalPgtoBanco: Number(mapaPagamentosBancoResumo.value?.[item.nome]?.total || 0),
        nomenclaturas: Array.from(item.nomenclaturas)
      }))
      .sort((a, b) => b.totalPgtoBanco - a.totalPgtoBanco)
  })

  const buscarDadosAnalise = async () => {
    const filtrosExtrato = {
      bancoSelecionado: 'TODOS',
      dataInicial: filtrosGlobais.dataInicial || '',
      dataFinal: filtrosGlobais.dataFinal || ''
    }

    await Promise.all([
      fetchRecebimentos(),
      carregarVouchers(),
      fetchPixRecebimentos(),
      buscarTransacoesBancarias(filtrosExtrato, true)
    ])
  }

  return {
    recebimentos,
    loading,
    error,
    registrosNormalizados,
    recebimentosCompletos,
    transacoes,
    resumoExecutivo,
    cardsResumo,
    rankingAdquirentes,
    rankingBandeiras,
    rankingModalidades,
    analiseTemporal,
    analiseVouchers,
    gruposDetalhados,
    resumoNomenclaturasDepositos,
    melhorAdquirente,
    periodoAnalisado,
    insights,
    buscarDadosAnalise
  }
}
