import { ref, computed, onMounted } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useRecebimentos } from '~/composables/analytics-financeiro/useRecebimentos'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { toISODate, normalizeBrand, toFixed2, sanitizeNSU, endOfMonthISO, addMonthsISO } from './utilsConciliacao'
import { useVendasMapping } from '~/composables/PageVendas/useVendasMapping'
import { useAllCompaniesDataFetcher } from '~/composables/PageVendas/filtrar_tabelas/useAllCompaniesDataFetcher'
import { useSpecificCompanyDataFetcher } from '~/composables/PageVendas/filtrar_tabelas/useSpecificCompanyDataFetcher'

export const useConciliacaoVendasRecebimentos = () => {
  const conciliadosRaw = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { filtrosGlobais } = useGlobalFilters()

  const indexVendasPorDataNSU = (indice, vendas) => {
    for (const v of vendas) {
      const key = `${toISODate(v.dataVenda)}|${sanitizeNSU(v.nsu)}`
      const arr = indice.get(key) || []
      arr.push(v)
      indice.set(key, arr)
    }
  }

  const conciliar = async (vendasArr, recebimentosArr) => {
    const indice = new Map()
    indexVendasPorDataNSU(indice, vendasArr)

    const vendasCachePorMes = new Map()
    const { mapFromDatabase } = useVendasMapping()
    const { buscarTodasEmpresas } = useAllCompaniesDataFetcher()
    const { buscarEmpresaEspecifica } = useSpecificCompanyDataFetcher()

    const ensureVendasMes = async (isoDate) => {
      const s = toISODate(isoDate)
      if (!s) return []
      const ym = s.slice(0, 7)
      if (vendasCachePorMes.has(ym)) return vendasCachePorMes.get(ym)
      const ini = `${ym}-01`
      const [y, m] = ym.split('-')
      const fim = endOfMonthISO(`${y}-${m}-01`)
      let raw = []
      try {
        if (!filtrosGlobais.empresaSelecionada) {
          raw = await buscarTodasEmpresas({ dataInicial: ini, dataFinal: fim })
        } else {
          raw = await buscarEmpresaEspecifica({ dataInicial: ini, dataFinal: fim })
        }
      } catch {}
      const mapped = raw.map(mapFromDatabase)
      vendasCachePorMes.set(ym, mapped)
      indexVendasPorDataNSU(indice, mapped)
      return mapped
    }

    const result = []
    const fetchedMonths = new Set()

    const chunkSize = 1000
    for (let start = 0; start < recebimentosArr.length; start += chunkSize) {
      const chunk = recebimentosArr.slice(start, start + chunkSize)
      for (const r of chunk) {
        const isoVenda = toISODate(r.dataVenda)
        const key = `${isoVenda}|${sanitizeNSU(r.nsu)}`
        let candidatos = indice.get(key) || []

        if (candidatos.length === 0) {
          const monthsToTry = []
          const baseYM = isoVenda ? isoVenda.slice(0, 7) : ''
          if (baseYM) monthsToTry.push({ ym: baseYM, date: isoVenda })
          const prevISO = isoVenda ? addMonthsISO(isoVenda, -1) : ''
          const prevYM = prevISO ? prevISO.slice(0, 7) : ''
          if (prevYM) monthsToTry.push({ ym: prevYM, date: prevISO })
          const nextISO = isoVenda ? addMonthsISO(isoVenda, 1) : ''
          const nextYM = nextISO ? nextISO.slice(0, 7) : ''
          if (nextYM) monthsToTry.push({ ym: nextYM, date: nextISO })

          for (const { ym, date } of monthsToTry) {
            if (!ym || fetchedMonths.has(ym)) continue
            await ensureVendasMes(date)
            fetchedMonths.add(ym)
            candidatos = indice.get(key) || []
            if (candidatos.length > 0) break
          }
        }

        const brandR = normalizeBrand(r.bandeira)
        const valorR = Number(toFixed2(r.valorBruto ?? r.valorRecebido ?? 0))
        const epsilon = Math.max(0.10, valorR * 0.001)

        const match = candidatos.find(v => {
          const brandV = normalizeBrand(v.bandeira)
          if (brandR && brandV && brandR !== brandV) return false
          const valorV = Number(toFixed2(v.vendaBruta))
          if (Number.isFinite(valorR) && Number.isFinite(valorV)) {
            if (Math.abs(valorR - valorV) > epsilon) return false
          }
          return true
        }) || null

        result.push({
          id: r.id,
          empresa: r.empresa,
          matriz: r.matriz,
          adquirente: r.adquirente,
          modalidade: r.modalidade,
          dataVenda: r.dataVenda,
          dataPagamento: r.dataRecebimento || null,
          nsu: r.nsu,
          vendaBruta: r.valorBruto ?? r.valorRecebido ?? 0,
          vendaLiquida: r.valorLiquido ?? 0,
          despesaMdr: r.despesaMdr ?? null,
          numeroParcelas: r.numeroParcelas ?? 1,
          bandeira: r.bandeira,
          previsaoPgto: match ? (match.previsaoPgto ?? null) : null,
          vendaId: match ? (match.id ?? null) : null,
          auditoria: match ? 'Conciliado' : 'Não conciliado'
        })
      }
    }

    conciliadosRaw.value = result
  }

  const carregarDados = async () => {
    loading.value = true
    error.value = null
    try {
      const { vendas, fetchVendas } = useVendas()
      await fetchVendas()
      const { recebimentos, fetchRecebimentos } = useRecebimentos()
      await fetchRecebimentos()
      await conciliar(vendas.value, recebimentos.value)
    } catch (err) {
      error.value = err && err.message ? err.message : String(err)
    } finally {
      loading.value = false
    }
  }

  onMounted(carregarDados)

  const conciliados = computed(() => {
    const ini = filtrosGlobais.dataInicial ? toISODate(filtrosGlobais.dataInicial) : ''
    const fin = filtrosGlobais.dataFinal ? toISODate(filtrosGlobais.dataFinal) : ini
    if (!ini && !fin) return conciliadosRaw.value
    return conciliadosRaw.value.filter(row => {
      const dp = toISODate(row.dataPagamento)
      if (!dp) return false
      return dp >= ini && dp <= fin
    })
  })

  return {
    conciliados,
    loading,
    error,
    recarregar: carregarDados
  }
}
