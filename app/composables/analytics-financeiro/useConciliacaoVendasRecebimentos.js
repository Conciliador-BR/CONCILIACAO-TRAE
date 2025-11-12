/**
 * Composable para conciliar vendas e recebimentos
 * Base: dataVenda, bandeira, nsu, valor (vendaBruta ≈ valorRecebido)
 */

import { ref, computed, onMounted } from 'vue'
import { useVendas } from '~/composables/useVendas'
import { useRecebimentos } from '~/composables/useRecebimentos'

// ---------- Estado ----------
const conciliados = ref([])
const loading = ref(false)
const error = ref(null)

// ---------- Chave de conciliação ----------
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
  if (s.startsWith('MASTER')) return 'MASTER'
  if (s.startsWith('MASTERCARD')) return 'MASTER'
  if (s.startsWith('VISA')) return 'VISA'
  if (s.startsWith('ELO')) return 'ELO'
  if (s.startsWith('HIPER')) return 'HIPER'
  return s
}

const chaveConciliacao = (data, bandeira, nsu, valor) => {
  const valorNum = Number(String(valor).replace(',', '.'))
  const valorKey = Number.isFinite(valorNum) ? valorNum.toFixed(2) : String(valor).trim()
  const dateKey = toISODate(data)
  const brandKey = normalizeBrand(bandeira)
  const nsuKey = String(nsu || '').trim()
  return `${dateKey}|${brandKey}|${nsuKey}|${valorKey}`
}

// ---------- Conciliação ----------
const conciliar = (vendasArr, recebimentosArr) => {
  const mapVendas = new Map()
  for (const v of vendasArr) {
    const key = chaveConciliacao(v.dataVenda, v.bandeira, v.nsu, v.vendaBruta)
    if (!mapVendas.has(key)) mapVendas.set(key, [])
    mapVendas.get(key).push(v)
  }

  conciliados.value = recebimentosArr.map(r => {
    const key = chaveConciliacao(r.dataVenda, r.bandeira, r.nsu, r.valorBruto ?? r.valorRecebido)
    const match = mapVendas.get(key)?.[0] || null
    return {
      id: r.id,
      empresa: r.empresa,
      matriz: r.matriz,
      adquirente: r.adquirente,
      dataVenda: r.dataVenda,
      dataPagamento: r.dataRecebimento ?? null,
      modalidade: r.modalidade,
      nsu: r.nsu,
      vendaBruta: r.valorBruto ?? r.valorRecebido ?? 0,
      vendaLiquida: r.valorLiquido ?? 0,
      despesaMdr: r.despesaMdr ?? null,
      numeroParcelas: r.numeroParcelas ?? 1,
      bandeira: r.bandeira,
      previsaoPgto: match?.previsaoPgto ?? null,
      pago: match ? 'Sim' : 'Não',
      auditoria: match ? 'Conciliado' : 'Não conciliado'
    }
  })
}

// ---------- Ações ----------
const carregarDados = async () => {
  loading.value = true
  error.value = null
  try {
    // Busca vendas
    const { vendas, fetchVendas } = useVendas()
    await fetchVendas()

    // Busca recebimentos
    const { recebimentos, fetchRecebimentos } = useRecebimentos()
    await fetchRecebimentos()

    // Concilia
    conciliar(vendas.value, recebimentos.value)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// ---------- Export ----------
export function useConciliacaoVendasRecebimentos() {
  onMounted(carregarDados)

  return {
    conciliados: computed(() => conciliados.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    recarregar: carregarDados
  }
}
