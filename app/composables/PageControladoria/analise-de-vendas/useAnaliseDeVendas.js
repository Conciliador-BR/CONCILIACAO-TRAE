import { ref, computed, watch } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useSecureLogger } from '~/composables/useSecureLogger'
import { useDateUtils } from '~/composables/configuracoes/importacao/Envio_vendas/calculo_previsao_pgto/useDateUtils'
import { useVouchersManual } from '~/composables/PageControladoria/controladoria-vendas/tabela_voucher_manual'
import { usePixVendasManual } from '~/composables/PageControladoria/controladoria-vendas/tabela_pix_vendas/usePixVendasManual'

export const useAnaliseDeVendas = () => {
  const { error: logError } = useSecureLogger()
  const { criarDataSegura } = useDateUtils()
  const { vendas, vendasOriginais, loading: vendasLoading, error: vendasError, filtroAtivo } = useVendas()

  const dreData = ref([])
  const vouchersAnaliseData = ref([])
  const loading = ref(false)
  const error = ref(null)

  const normalizeString = (str) => {
    if (!str) return ''
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.\-_\s]/g, '')
  }
  const voucherAdquirentes = new Set([
    'alelo', 'ticket', 'vr', 'sodexo', 'pluxe', 'pluxee', 'comprocard', 'lecard', 'upbrasil',
    'ecxcard', 'fncard', 'benvisa', 'credshop', 'rccard', 'goodcard', 'bigcard', 'bkcard',
    'greencard', 'brasilcard', 'boltcard', 'cabal', 'verocard', 'facecard', 'valecard', 'naip'
  ])
  const isVoucherRegistro = (registro) => {
    const modalidade = normalizeString(registro?.modalidade || '')
    const adquirente = normalizeString(registro?.adquirente || '')
    return modalidade.includes('voucher') ||
      modalidade.includes('alimentacao') ||
      modalidade.includes('refeicao') ||
      voucherAdquirentes.has(adquirente)
  }
  const { vouchersData, fetchTaxas: fetchVouchersAnalise } = useVouchersManual(filtroAtivo)
  const { pixData, fetchPixVendas } = usePixVendasManual(filtroAtivo)

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
      const valorLiquidoOrigem = parseFloat(venda.vendaLiquida || venda.valor_liquido || 0)
      const despesaMdr = parseFloat(venda.despesaMdr || venda.mdr || 0)
      const taxaAplicada = getTaxaPorBandeira(bandeiraClassificada, modalidadePagamento)
      const taxaCalculada = valorBruto * taxaAplicada
      const rawData = venda.dataVenda || venda.data_venda || venda.data
      const dataObj = criarDataSegura(rawData)
      const dataVendaNormalizada = dataObj ? `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}-${String(dataObj.getDate()).padStart(2, '0')}` : null
      const custo = despesaMdr || taxaCalculada
      const receitaLiquidaCalc = valorBruto - custo
      return {
        id: venda.id || `${venda.dataVenda}-${Math.random()}`,
        dataVenda: dataVendaNormalizada,
        empresa: venda.empresa || '',
        matriz: venda.matriz || '',
        adquirente: venda.adquirente || '',
        bandeira: bandeiraClassificada,
        modalidade: modalidadePagamento,
        valorBruto,
        valorLiquido: receitaLiquidaCalc,
        despesaMdr,
        taxaAplicada,
        taxaCalculada,
        numeroParcelas: venda.numeroParcelas || venda.parcelas || 1,
        receitaBruta: valorBruto,
        custoTaxa: custo,
        receitaLiquida: receitaLiquidaCalc,
        margemBruta: (receitaLiquidaCalc / valorBruto) * 100 || 0,
        valorLiquidoOrigem
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

  const analiseDetalhadaVouchers = computed(() => {
    const grupos = {}

    // Prioriza dados manuais de vouchers da Controladoria (salvos no Supabase).
    const origemVouchersControladoria = vouchersAnaliseData.value || []
    if (origemVouchersControladoria.length > 0) {
      origemVouchersControladoria.forEach((registro) => {
        const chave = String(registro.nome || registro.adquirente || 'VOUCHERS')
          .trim()
          .toUpperCase()
        if (!grupos[chave]) {
          grupos[chave] = {
            voucher: chave,
            receitaBruta: 0,
            custoTaxa: 0,
            receitaLiquida: 0,
            margemBruta: 0,
            taxaEfetiva: 0,
            lucratividade: 'Baixa'
          }
        }
        const receitaBruta = Number(registro.valor_bruto || registro.voucher || 0)
        const custoTaxa = Number(registro.despesa_mdr || 0) + Number(registro.despesa_extra || 0)
        const receitaLiquida = Number(registro.valor_liquido || (receitaBruta - custoTaxa))
        const grupo = grupos[chave]
        grupo.receitaBruta += receitaBruta
        grupo.custoTaxa += custoTaxa
        grupo.receitaLiquida += receitaLiquida
      })
    } else {
      dreData.value
        .filter(isVoucherRegistro)
        .forEach((registro) => {
          const chave = String(registro.adquirente || registro.bandeira || 'VOUCHERS')
            .trim()
            .toUpperCase()
          if (!grupos[chave]) {
            grupos[chave] = {
              voucher: chave,
              receitaBruta: 0,
              custoTaxa: 0,
              receitaLiquida: 0,
              margemBruta: 0,
              taxaEfetiva: 0,
              lucratividade: 'Baixa'
            }
          }
          const grupo = grupos[chave]
          grupo.receitaBruta += Number(registro.receitaBruta || 0)
          grupo.custoTaxa += Number(registro.custoTaxa || 0)
          grupo.receitaLiquida += Number(registro.receitaLiquida || 0)
        })
    }

    const dados = Object.values(grupos).map((item) => {
      const margemBruta = item.receitaBruta > 0 ? ((item.receitaLiquida / item.receitaBruta) * 100) : 0
      const taxaEfetiva = item.receitaBruta > 0 ? ((item.custoTaxa / item.receitaBruta) * 100) : 0
      const lucratividade = margemBruta >= 95 ? 'Alta' : margemBruta >= 90 ? 'Media' : 'Baixa'
      return {
        ...item,
        margemBruta,
        taxaEfetiva,
        lucratividade
      }
    })

    return dados.sort((a, b) => b.receitaBruta - a.receitaBruta)
  })

  const totaisManuais = computed(() => {
    const totais = {
      receitaBruta: 0,
      custoTaxa: 0,
      receitaLiquida: 0,
      quantidade: 0
    }

    ;(vouchersAnaliseData.value || []).forEach((registro) => {
      if (!registro?._table_exists || !registro?._table_name) return
      const receitaBruta = Number(registro.valor_bruto || registro.voucher || 0)
      const custoTaxa = Number(registro.despesa_mdr || 0) + Number(registro.despesa_extra || 0)
      const receitaLiquida = Number(registro.valor_liquido || (receitaBruta - custoTaxa))

      if (receitaBruta === 0 && custoTaxa === 0 && receitaLiquida === 0) return

      totais.receitaBruta += receitaBruta
      totais.custoTaxa += custoTaxa
      totais.receitaLiquida += receitaLiquida
      totais.quantidade += 1
    })

    ;(pixData.value || []).forEach((registro) => {
      const possuiConteudo = Boolean(String(registro?.nome || registro?._nome_db || '').trim()) ||
        Number(registro?.valor_bruto || 0) !== 0 ||
        Number(registro?.valor_liquido || 0) !== 0 ||
        (Array.isArray(registro?._db_ids) && registro._db_ids.length > 0)

      if (!possuiConteudo) return

      const receitaBruta = Number(registro.valor_bruto || registro.pix || 0)
      const custoTaxa = Number(registro.despesa_mdr || 0)
      const receitaLiquida = Number(registro.valor_liquido || (receitaBruta - custoTaxa))

      totais.receitaBruta += receitaBruta
      totais.custoTaxa += custoTaxa
      totais.receitaLiquida += receitaLiquida
      totais.quantidade += 1
    })

    return totais
  })

  const dreConsolidada = computed(() => {
    const total = dreData.value.reduce((acc, v) => {
      acc.receitaBruta += v.receitaBruta
      acc.custoTaxa += v.custoTaxa
      acc.receitaLiquida += v.receitaLiquida
      acc.quantidade += 1
      return acc
    }, { receitaBruta: 0, custoTaxa: 0, receitaLiquida: 0, quantidade: 0 })

    total.receitaBruta += totaisManuais.value.receitaBruta
    total.custoTaxa += totaisManuais.value.custoTaxa
    total.receitaLiquida += totaisManuais.value.receitaLiquida
    total.quantidade += totaisManuais.value.quantidade

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
    try {
      try {
        await Promise.all([
          fetchVouchersAnalise(),
          fetchPixVendas()
        ])
        vouchersAnaliseData.value = (vouchersData.value || []).filter(v => v?._table_exists === true && Boolean(v?._table_name))
      } catch {
        vouchersAnaliseData.value = []
      }
      return processarDadosDRE()
    } catch (err) {
      error.value = `Erro ao processar dados: ${err.message}`
      dreData.value = []
      vouchersAnaliseData.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  watch([vendas, vendasOriginais], () => { processarDadosDRE() }, { immediate: true })
  watch(vendasLoading, (nl) => { loading.value = nl })
  watch(vendasError, (ne) => { error.value = ne })

  return {
    dreData,
    loading,
    error,
    analisePorBandeira,
    gruposPorAdquirente,
    analiseDetalhadaVouchers,
    dreConsolidada,
    analiseTemporal,
    buscarDadosDRE,
    processarDadosDRE,
    classificarBandeira,
    determinarModalidade,
    getTaxaPorBandeira,
    taxasPadrao
  }
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
