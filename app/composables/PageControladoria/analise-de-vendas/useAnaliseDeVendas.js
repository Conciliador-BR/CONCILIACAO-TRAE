import { ref, computed, watch } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useSecureLogger } from '~/composables/useSecureLogger'
import { useDateUtils } from '~/composables/importacao/Envio_vendas/calculo_previsao_pgto/useDateUtils'

export const useAnaliseDeVendas = () => {
  const { error: logError } = useSecureLogger()
  const { criarDataSegura } = useDateUtils()
  const { vendas, vendasOriginais, loading: vendasLoading, error: vendasError } = useVendas()

  const dreData = ref([])
  const loading = ref(false)
  const error = ref(null)

  const normalizeString = (str) => {
    if (!str) return ''
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.\-_\s]/g, '')
  }

  const taxasPadrao = {
    visa: { debito: 0.0199, credito: 0.0479, credito2x: 0.0499, credito3x: 0.0599, credito4x5x6x: 0.0699 },
    mastercard: { debito: 0.0199, credito: 0.0479, credito2x: 0.0499, credito3x: 0.0599, credito4x5x6x: 0.0699 },
    elo: { debito: 0.0199, credito: 0.0479, credito2x: 0.0499, credito3x: 0.0599, credito4x5x6x: 0.0699 },
    amex: { debito: 0.0, credito: 0.0499, credito2x: 0.0599, credito3x: 0.0699, credito4x5x6x: 0.0799 },
    hipercard: { debito: 0.0, credito: 0.0499, credito2x: 0.0599, credito3x: 0.0699, credito4x5x6x: 0.0799 },
    pix: { debito: 0.0, credito: 0.0, credito2x: 0.0, credito3x: 0.0, credito4x5x6x: 0.0 }
  }

  const classificarBandeira = (bandeira, modalidade) => {
    const b = normalizeString(bandeira)
    const m = normalizeString(modalidade)
    if (b.includes('visa') && m.includes('debito')) return 'VISA ELECTRON'
    if (b.includes('visa')) return 'VISA'
    if ((b.includes('mastercard') || b.includes('master')) && m.includes('debito')) return 'MAESTRO'
    if (b.includes('mastercard') || b.includes('master')) return 'MASTERCARD'
    if (b.includes('elo') && m.includes('debito')) return 'ELO DÉBITO'
    if (b.includes('elo')) return 'ELO CRÉDITO'
    if (b.includes('pix') || m.includes('pix')) return 'PIX'
    if (b.includes('banescard') && m.includes('debito')) return 'BANESCARD DÉBITO'
    if (b.includes('banescard')) return 'BANESCARD CRÉDITO'
    if (b.includes('amex')) return 'AMEX'
    if (b.includes('hipercard')) return 'HIPERCARD'
    if (b.includes('diners')) return 'DINERS'
    if (b.includes('cabal')) return 'CABAL'
    return 'OUTROS'
  }

  const determinarModalidade = (modalidade, numeroParcelas) => {
    const m = normalizeString(modalidade)
    const p = parseInt(numeroParcelas) || 1
    if (m.includes('pix')) return 'debito'
    if (m.includes('debito')) return 'debito'
    if (m.includes('voucher')) return 'voucher'
    if (p === 1) return 'credito'
    if (p === 2) return 'credito2x'
    if (p === 3) return 'credito3x'
    if (p >= 4 && p <= 6) return 'credito4x5x6x'
    return 'outros'
  }

  const getTaxaPorBandeira = (bandeiraClassificada, modalidade) => {
    const b = normalizeString(bandeiraClassificada)
    if (b.includes('visa')) return taxasPadrao.visa[modalidade] || 0
    if (b.includes('mastercard')) return taxasPadrao.mastercard[modalidade] || 0
    if (b.includes('elo')) return taxasPadrao.elo[modalidade] || 0
    if (b.includes('amex')) return taxasPadrao.amex[modalidade] || 0
    if (b.includes('hipercard')) return taxasPadrao.hipercard[modalidade] || 0
    if (b.includes('pix')) return taxasPadrao.pix[modalidade] || 0
    return 0.05
  }

  const processarDadosDRE = () => {
    const dadosVendas = vendas.value || vendasOriginais.value || []
    if (dadosVendas.length === 0) { dreData.value = []; return [] }
    const dadosMapeados = dadosVendas.map(venda => {
      const bandeiraClassificada = classificarBandeira(venda.bandeira || '', venda.modalidade || '')
      const modalidadePagamento = determinarModalidade(venda.modalidade || '', venda.numeroParcelas || venda.parcelas || 1)
      const valorBruto = parseFloat(venda.vendaBruta || venda.valor_bruto || 0)
      const valorLiquido = parseFloat(venda.vendaLiquida || venda.valor_liquido || 0)
      const despesaMdr = parseFloat(venda.despesaMdr || venda.mdr || 0)
      const taxaAplicada = getTaxaPorBandeira(bandeiraClassificada, modalidadePagamento)
      const taxaCalculada = valorBruto * taxaAplicada
      const rawData = venda.dataVenda || venda.data_venda || venda.data
      const dataObj = criarDataSegura(rawData)
      const dataVendaNormalizada = dataObj ? `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}` : null
      return {
        id: venda.id || `${venda.dataVenda}-${Math.random()}`,
        dataVenda: dataVendaNormalizada,
        empresa: venda.empresa || '',
        matriz: venda.matriz || '',
        adquirente: venda.adquirente || '',
        bandeira: bandeiraClassificada,
        modalidade: modalidadePagamento,
        valorBruto,
        valorLiquido,
        despesaMdr,
        taxaAplicada,
        taxaCalculada,
        numeroParcelas: venda.numeroParcelas || venda.parcelas || 1,
        receitaBruta: valorBruto,
        custoTaxa: despesaMdr || taxaCalculada,
        receitaLiquida: valorLiquido || (valorBruto - (despesaMdr || taxaCalculada)),
        margemBruta: ((valorLiquido || (valorBruto - (despesaMdr || taxaCalculada))) / valorBruto) * 100 || 0
      }
    })
    dreData.value = dadosMapeados
    return dadosMapeados
  }

  const analisePorBandeira = computed(() => {
    const grupos = {}
    dreData.value.forEach(venda => {
      const b = venda.bandeira
      if (!grupos[b]) grupos[b] = { bandeira: b, quantidade: 0, receitaBruta: 0, custoTaxa: 0, receitaLiquida: 0, margemBruta: 0, modalidades: {} }
      const g = grupos[b]
      g.quantidade += 1
      g.receitaBruta += venda.receitaBruta
      g.custoTaxa += venda.custoTaxa
      g.receitaLiquida += venda.receitaLiquida
      const m = venda.modalidade
      if (!g.modalidades[m]) g.modalidades[m] = { modalidade: m, quantidade: 0, receitaBruta: 0, custoTaxa: 0, receitaLiquida: 0 }
      g.modalidades[m].quantidade += 1
      g.modalidades[m].receitaBruta += venda.receitaBruta
      g.modalidades[m].custoTaxa += venda.custoTaxa
      g.modalidades[m].receitaLiquida += venda.receitaLiquida
    })
    Object.values(grupos).forEach(g => {
      g.margemBruta = g.receitaBruta > 0 ? ((g.receitaLiquida / g.receitaBruta) * 100) : 0
      Object.values(g.modalidades).forEach(mod => { mod.taxaEfetiva = mod.receitaBruta > 0 ? ((mod.custoTaxa / mod.receitaBruta) * 100) : 0 })
    })
    const arr = Object.values(grupos)
    return arr.sort((a, b) => {
      const ia = ordemBandeiras.indexOf(a.bandeira)
      const ib = ordemBandeiras.indexOf(b.bandeira)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1) return -1
      if (ib !== -1) return 1
      return a.bandeira.localeCompare(b.bandeira)
    })
  })

  const gruposPorAdquirente = computed(() => {
    const grupos = {}
    dreData.value.forEach(v => {
      const key = v.adquirente || 'DESCONHECIDO'
      if (!grupos[key]) {
        grupos[key] = {
          adquirente: key,
          linhas: {},
          totais: { receitaBruta: 0, receitaLiquida: 0, custoTaxa: 0, quantidade: 0, margemBruta: 0, taxaEfetiva: 0 }
        }
      }
      const g = grupos[key]
      const bandeiraKey = v.bandeira
      if (!g.linhas[bandeiraKey]) {
        g.linhas[bandeiraKey] = {
          bandeira: bandeiraKey,
          quantidade: 0,
          receitaBruta: 0,
          receitaLiquida: 0,
          custoTaxa: 0,
          margemBruta: 0,
          taxaEfetiva: 0
        }
      }
      const linha = g.linhas[bandeiraKey]
      const rb = v.receitaBruta || 0
      const rl = v.receitaLiquida || 0
      const ct = v.custoTaxa || 0
      linha.quantidade += 1
      linha.receitaBruta += rb
      linha.receitaLiquida += rl
      linha.custoTaxa += ct
      g.totais.quantidade += 1
      g.totais.receitaBruta += rb
      g.totais.receitaLiquida += rl
      g.totais.custoTaxa += ct
    })
    Object.values(grupos).forEach(g => {
      Object.values(g.linhas).forEach(l => {
        l.margemBruta = l.receitaBruta > 0 ? ((l.receitaLiquida / l.receitaBruta) * 100) : 0
        l.taxaEfetiva = l.receitaBruta > 0 ? ((l.custoTaxa / l.receitaBruta) * 100) : 0
      })
      g.totais.margemBruta = g.totais.receitaBruta > 0 ? ((g.totais.receitaLiquida / g.totais.receitaBruta) * 100) : 0
      g.totais.taxaEfetiva = g.totais.receitaBruta > 0 ? ((g.totais.custoTaxa / g.totais.receitaBruta) * 100) : 0
    })
    return Object.values(grupos).map(g => ({
      adquirente: g.adquirente,
      vendasData: Object.values(g.linhas).sort((a, b) => {
        const ia = ordemBandeiras.indexOf(a.bandeira)
        const ib = ordemBandeiras.indexOf(b.bandeira)
        if (ia !== -1 && ib !== -1) return ia - ib
        if (ia !== -1) return -1
        if (ib !== -1) return 1
        return a.bandeira.localeCompare(b.bandeira)
      }),
      totais: g.totais
    }))
  })

  const dreConsolidada = computed(() => {
    const total = dreData.value.reduce((acc, v) => {
      acc.receitaBruta += v.receitaBruta
      acc.custoTaxa += v.custoTaxa
      acc.receitaLiquida += v.receitaLiquida
      acc.quantidade += 1
      return acc
    }, { receitaBruta: 0, custoTaxa: 0, receitaLiquida: 0, quantidade: 0 })
    total.margemBruta = total.receitaBruta > 0 ? ((total.receitaLiquida / total.receitaBruta) * 100) : 0
    total.taxaEfetiva = total.receitaBruta > 0 ? ((total.custoTaxa / total.receitaBruta) * 100) : 0
    return total
  })

  const analiseTemporal = computed(() => {
    const grupos = {}
    dreData.value.forEach(v => {
      const dataObj = criarDataSegura(v.dataVenda || '')
      const mesAno = dataObj ? `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}` : ''
      if (!grupos[mesAno] && mesAno) grupos[mesAno] = { periodo: mesAno, quantidade: 0, receitaBruta: 0, custoTaxa: 0, receitaLiquida: 0 }
      if (grupos[mesAno]) {
        grupos[mesAno].quantidade += 1
        grupos[mesAno].receitaBruta += v.receitaBruta
        grupos[mesAno].custoTaxa += v.custoTaxa
        grupos[mesAno].receitaLiquida += v.receitaLiquida
      }
    })
    Object.values(grupos).forEach(g => {
      g.margemBruta = g.receitaBruta > 0 ? ((g.receitaLiquida / g.receitaBruta) * 100) : 0
      g.taxaEfetiva = g.receitaBruta > 0 ? ((g.custoTaxa / g.receitaBruta) * 100) : 0
    })
    return Object.values(grupos).sort((a, b) => a.periodo.localeCompare(b.periodo))
  })

  const buscarDadosDRE = async () => {
    loading.value = true
    error.value = null
    try { return processarDadosDRE() } catch (err) { error.value = `Erro ao processar dados: ${err.message}`; dreData.value = []; return [] } finally { loading.value = false }
  }

  watch([vendas, vendasOriginais], () => { processarDadosDRE() }, { immediate: true })
  watch(vendasLoading, (nl) => { loading.value = nl })
  watch(vendasError, (ne) => { error.value = ne })

  return { dreData, loading, error, analisePorBandeira, gruposPorAdquirente, dreConsolidada, analiseTemporal, buscarDadosDRE, processarDadosDRE, classificarBandeira, determinarModalidade, getTaxaPorBandeira, taxasPadrao }
}
  const ordemBandeiras = [
    'VISA',
    'VISA ELECTRON',
    'MAESTRO',
    'MASTERCARD',
    'ELO DÉBITO',
    'ELO CRÉDITO',
    'BANESCARD CRÉDITO',
    'BANESCARD DÉBITO',
    'AMEX',
    'HIPERCARD',
    'DINERS',
    'CABAL',
    'PIX',
    'OUTROS'
  ]