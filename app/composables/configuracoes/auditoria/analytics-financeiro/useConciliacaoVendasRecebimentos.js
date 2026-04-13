import { ref, computed, onMounted } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useRecebimentos } from '~/composables/configuracoes/auditoria/analytics-financeiro/useRecebimentos'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { toISODate, normalizeBrand, toFixed2, sanitizeNSU, endOfMonthISO, addMonthsISO } from './utilsConciliacao'
import { useVendasMapping } from '~/composables/PageVendas/useVendasMapping'
import { useAllCompaniesDataFetcher } from '~/composables/PageVendas/filtrar_tabelas/useAllCompaniesDataFetcher'
import { useSpecificCompanyDataFetcher } from '~/composables/PageVendas/filtrar_tabelas/useSpecificCompanyDataFetcher'

const conciliadosRawState = ref([])
const loadingState = ref(false)
const errorState = ref(null)
const progressoState = ref({
  total: 0,
  processadas: 0,
  conciliadas: 0,
  naoConciliadas: 0
})
let carregamentoEmAndamento = null
let carregadoUmaVez = false

export const useConciliacaoVendasRecebimentos = () => {
  const { filtrosGlobais } = useGlobalFilters()

  const indexVendasPorDataNSU = (indice, indiceNSU, vendas) => {
    for (const v of vendas) {
      const key = `${toISODate(v.dataVenda)}|${sanitizeNSU(v.nsu)}`
      const arr = indice.get(key) || []
      arr.push(v)
      indice.set(key, arr)
      const nsuKey = sanitizeNSU(v.nsu)
      const arrN = indiceNSU.get(nsuKey) || []
      arrN.push(v)
      indiceNSU.set(nsuKey, arrN)
    }
  }

  const conciliar = async (vendasArr, recebimentosArr) => {
    progressoState.value = {
      total: recebimentosArr.length,
      processadas: 0,
      conciliadas: 0,
      naoConciliadas: 0
    }
    const indice = new Map()
    const indiceNSU = new Map()
    indexVendasPorDataNSU(indice, indiceNSU, vendasArr)

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
      indexVendasPorDataNSU(indice, indiceNSU, mapped)
      return mapped
    }

    const result = []
    const fetchedMonths = new Set()
    const nsuSearchedRemote = new Set()

    const chunkSize = 1000
    const pickMinDate = (a, b) => (!a ? b : (!b ? a : (a < b ? a : b)))
    const pickMaxDate = (a, b) => (!a ? b : (!b ? a : (a > b ? a : b)))
    const toDays = (s) => {
      const dt = new Date(s)
      return Math.floor(dt.getTime() / 86400000)
    }

    for (let start = 0; start < recebimentosArr.length; start += chunkSize) {
      const chunk = recebimentosArr.slice(start, start + chunkSize)
      const pendenciasRemotas = new Map()
      const estadoChunk = []

      for (const r of chunk) {
        const isoVenda = toISODate(r.dataVenda)
        const nsuKey = sanitizeNSU(r.nsu)
        const key = `${isoVenda}|${nsuKey}`
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

        let match = candidatos.find(v => {
          const brandV = normalizeBrand(v.bandeira)
          if (brandR && brandV && brandR !== brandV) return false
          const valorV = Number(toFixed2(v.vendaBruta))
          if (Number.isFinite(valorR) && Number.isFinite(valorV)) {
            if (Math.abs(valorR - valorV) > epsilon) return false
          }
          return true
        }) || null

        if (!match && nsuKey) {
          const lista = indiceNSU.get(nsuKey) || []
          if (lista.length === 0 && !nsuSearchedRemote.has(nsuKey)) {
            const isoBase = isoVenda || toISODate(r.dataRecebimento) || toISODate(new Date())
            const baseStart = `${isoBase.slice(0,7)}-01`
            const prevStart = `${addMonthsISO(baseStart, -1).slice(0,7)}-01`
            const nextEnd = endOfMonthISO(addMonthsISO(baseStart, 1))
            const chaveGrupo = `${r.empresa || ''}||${r.matriz || ''}||${r.adquirente || ''}`
            const grupo = pendenciasRemotas.get(chaveGrupo) || {
              empresa: r.empresa,
              matriz: r.matriz,
              operadora: r.adquirente,
              nsus: new Set(),
              dataInicial: '',
              dataFinal: ''
            }
            grupo.nsus.add(nsuKey)
            grupo.dataInicial = pickMinDate(grupo.dataInicial, prevStart)
            grupo.dataFinal = pickMaxDate(grupo.dataFinal, nextEnd)
            pendenciasRemotas.set(chaveGrupo, grupo)
          }
        }

        estadoChunk.push({ r, isoVenda, brandR, valorR, epsilon, match })
      }

      for (const grupo of pendenciasRemotas.values()) {
        const nsus = Array.from(grupo.nsus)
        if (nsus.length === 0) continue
        let raw = []
        try {
          raw = await buscarEmpresaEspecifica({
            nsus,
            dateColumn: 'data_venda',
            dataInicial: grupo.dataInicial,
            dataFinal: grupo.dataFinal,
            columns: 'id, nsu, valor_bruto, bandeira, data_venda, previsao_pgto, empresa, matriz, adquirente',
            empresaOverride: { nome: grupo.empresa, matriz: grupo.matriz },
            operadora: grupo.operadora
          })
        } catch {}
        const mapped = raw.map(mapFromDatabase)
        indexVendasPorDataNSU(indice, indiceNSU, mapped)
        for (const nsu of nsus) nsuSearchedRemote.add(nsu)
      }

      for (const item of estadoChunk) {
        const { r, isoVenda, brandR, valorR, epsilon } = item
        let match = item.match

        if (!match) {
          const nsuKey = sanitizeNSU(r.nsu)
          const lista = indiceNSU.get(nsuKey) || []
          if (lista.length > 0) {
            const daysR = isoVenda ? toDays(isoVenda) : 0
            match = lista.find(v => {
              const brandV = normalizeBrand(v.bandeira)
              if (brandR && brandV && brandR !== brandV) return false
              const valorV = Number(toFixed2(v.vendaBruta))
              if (Number.isFinite(valorR) && Number.isFinite(valorV)) {
                if (Math.abs(valorR - valorV) > epsilon) return false
              }
              const isoV = toISODate(v.dataVenda)
              if (!isoV) return false
              const diff = Math.abs((toDays(isoV) - daysR))
              return diff <= 60
            }) || null
          }
        }

        const conciliada = !!match
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
          previsaoPgto: conciliada ? (match.previsaoPgto ?? null) : null,
          vendaId: conciliada ? (match.id ?? null) : null,
          auditoria: conciliada ? 'Conciliado' : 'Não conciliado'
        })
        progressoState.value.processadas += 1
        if (conciliada) progressoState.value.conciliadas += 1
        else progressoState.value.naoConciliadas += 1
      }
    }

    conciliadosRawState.value = result
  }

  const carregarDados = async (forcar = false) => {
    if (carregamentoEmAndamento && !forcar) {
      return carregamentoEmAndamento
    }
    if (carregadoUmaVez && !forcar) return

    carregamentoEmAndamento = (async () => {
      loadingState.value = true
      errorState.value = null
      progressoState.value = {
        total: 0,
        processadas: 0,
        conciliadas: 0,
        naoConciliadas: 0
      }
      try {
        const { vendas, fetchVendas } = useVendas()
        await fetchVendas(forcar)
        const { recebimentos, fetchRecebimentos } = useRecebimentos()
        await fetchRecebimentos()
        await conciliar(vendas.value, recebimentos.value)
        carregadoUmaVez = true
      } catch (err) {
        errorState.value = err && err.message ? err.message : String(err)
      } finally {
        loadingState.value = false
        carregamentoEmAndamento = null
      }
    })()

    return carregamentoEmAndamento
  }

  onMounted(() => {
    carregarDados()
  })

  const conciliados = computed(() => {
    const ini = filtrosGlobais.dataInicial ? toISODate(filtrosGlobais.dataInicial) : ''
    const fin = filtrosGlobais.dataFinal ? toISODate(filtrosGlobais.dataFinal) : ini
    if (!ini && !fin) return conciliadosRawState.value
    return conciliadosRawState.value.filter(row => {
      const dp = toISODate(row.dataPagamento)
      if (!dp) return false
      return dp >= ini && dp <= fin
    })
  })

  return {
    conciliados,
    loading: loadingState,
    error: errorState,
    progresso: progressoState,
    recarregar: carregarDados
  }
}
