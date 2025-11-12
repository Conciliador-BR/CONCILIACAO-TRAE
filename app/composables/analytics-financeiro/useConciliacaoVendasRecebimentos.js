import { ref, computed, onMounted } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useRecebimentos } from '~/composables/analytics-financeiro/useRecebimentos'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

const toISODate = (input) => {
  if (!input) return ''
  const s = String(input).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/')
    return `${y}-${m}-${d}`
  }
  const dt = new Date(s)
  if (Number.isFinite(dt.getTime())) {
    const y = dt.getFullYear()
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return s
}

const normalizeBrand = (b) => {
  if (!b) return ''
  const s = String(b).toUpperCase().trim()
  if (s.startsWith('MASTERCARD')) return 'MASTER'
  if (s.startsWith('MASTER')) return 'MASTER'
  if (s.startsWith('VISA')) return 'VISA'
  if (s.startsWith('ELO')) return 'ELO'
  if (s.startsWith('HIPER')) return 'HIPER'
  return s
}

const toFixed2 = (val) => {
  const n = Number(String(val).replace(',', '.'))
  return Number.isFinite(n) ? n.toFixed(2) : String(val).trim()
}

const chaveConciliacao = (data, bandeira, nsu, valor) => {
  const dateKey = toISODate(data)
  const brandKey = normalizeBrand(bandeira)
  const nsuKey = String(nsu || '').trim()
  const valorKey = toFixed2(valor)
  return `${dateKey}|${brandKey}|${nsuKey}|${valorKey}`
}

export const useConciliacaoVendasRecebimentos = () => {
  const conciliadosRaw = ref([])
  const loading = ref(false)
  const error = ref(null)
  const { filtrosGlobais } = useGlobalFilters()

  const conciliar = (vendasArr, recebimentosArr) => {
    const mapVendas = new Map()
    for (const v of vendasArr) {
      const key = chaveConciliacao(v.dataVenda, v.bandeira, v.nsu, v.vendaBruta)
      const arr = mapVendas.get(key) || []
      arr.push(v)
      mapVendas.set(key, arr)
    }

    const result = recebimentosArr.map(r => {
      const key = chaveConciliacao(r.dataVenda, r.bandeira, r.nsu, r.valorBruto ?? r.valorRecebido)
      const match = (mapVendas.get(key) || [])[0] || null
      return {
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
        previsaoPgto: match ? match.previsaoPgto ?? null : null,
        auditoria: match ? 'Conciliado' : 'Não conciliado'
      }
    })
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
      conciliar(vendas.value, recebimentos.value)
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
    conciliados: computed(() => conciliados.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    recarregar: carregarDados
  }
}
