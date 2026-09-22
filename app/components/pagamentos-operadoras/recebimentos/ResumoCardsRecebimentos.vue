<template>
  <div class="mb-6 px-2 sm:px-4 lg:px-6 xl:px-8">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6 2xl:gap-6">
      <button
        type="button"
        class="w-full min-w-0 rounded-xl bg-[#102a43] p-3.5 text-left text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5 lg:p-6"
        :class="activeFilter === 'vendasBrutas' ? 'ring-4 ring-blue-300' : ''"
        @click="toggleFilter('vendasBrutas')"
      >
        <div class="flex h-full items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] text-white/80 sm:text-sm">Vendas Brutas</p>
            <p class="text-base font-bold leading-tight sm:text-xl lg:text-2xl">{{ formatCurrency(vendasBrutas) }}</p>
          </div>
          <CurrencyDollarIcon class="ml-2 h-6 w-6 shrink-0 text-white/70 sm:h-9 sm:w-9 lg:h-12 lg:w-12" />
        </div>
      </button>

      <div class="w-full min-w-0 rounded-xl bg-[#B56A00] p-3.5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5 lg:p-6">
        <div class="flex h-full items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] text-white/80 sm:text-sm">Total Taxas</p>
            <p class="text-base font-bold leading-tight sm:text-xl lg:text-2xl">{{ formatCurrency(taxas) }}</p>
          </div>
          <PercentBadgeIcon class="ml-2 h-6 w-6 shrink-0 text-white/70 sm:h-9 sm:w-9 lg:h-12 lg:w-12" />
        </div>
      </div>

      <button
        type="button"
        class="w-full min-w-0 rounded-xl bg-[#244b77] p-3.5 text-left text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5 lg:p-6"
        :class="activeFilter === 'debitos' ? 'ring-4 ring-blue-300' : ''"
        @click="toggleFilter('debitos')"
      >
        <div class="flex h-full items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] text-white/80 sm:text-sm">Débitos</p>
            <p class="text-base font-bold leading-tight sm:text-xl lg:text-2xl">{{ formatCurrency(debitos) }}</p>
          </div>
          <ExclamationTriangleIcon class="ml-2 h-6 w-6 shrink-0 text-white/70 sm:h-9 sm:w-9 lg:h-12 lg:w-12" />
        </div>
      </button>

      <button
        type="button"
        class="w-full min-w-0 rounded-xl bg-[#7A1F1F] p-3.5 text-left text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5 lg:p-6"
        :class="activeFilter === 'despesaAntecipacao' ? 'ring-4 ring-red-300' : ''"
        @click="toggleFilter('despesaAntecipacao')"
      >
        <div class="flex h-full items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] text-white/80 sm:text-sm">Despesa com Antecipação</p>
            <p class="text-base font-bold leading-tight sm:text-xl lg:text-2xl">{{ formatCurrency(despesaAntecipacao) }}</p>
          </div>
          <PercentBadgeIcon class="ml-2 h-6 w-6 shrink-0 text-white/70 sm:h-9 sm:w-9 lg:h-12 lg:w-12" />
        </div>
      </button>

      <div class="w-full min-w-0 rounded-xl bg-[#1E7E34] p-3.5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5 lg:p-6">
        <div class="flex h-full items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] text-white/80 sm:text-sm">Vendas Líquidas</p>
            <p class="text-base font-bold leading-tight sm:text-xl lg:text-2xl">{{ formatCurrency(vendasLiquidas) }}</p>
          </div>
          <ArrowTrendingUpIcon class="ml-2 h-6 w-6 shrink-0 text-white/70 sm:h-9 sm:w-9 lg:h-12 lg:w-12" />
        </div>
      </div>

      <div class="w-full min-w-0 rounded-xl bg-[#244b77] p-3.5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5 lg:p-6">
        <div class="flex h-full items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] text-white/80 sm:text-sm">Total Líquido</p>
            <p class="text-base font-bold leading-tight sm:text-xl lg:text-2xl">{{ formatCurrency(totalLiquido) }}</p>
          </div>
          <BanknotesIcon class="ml-2 h-6 w-6 shrink-0 text-white/70 sm:h-9 sm:w-9 lg:h-12 lg:w-12" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  PercentBadgeIcon,
  BanknotesIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  dados: { type: Array, default: () => [] },
  activeFilter: { type: String, default: '' }
})
const emit = defineEmits(['filter-change'])

const toNumber = (v) => {
  const s = String(v ?? '').replace(',', '.').trim()
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

const get = (row, key, fallbacks = []) => {
  if (row && key in row && row[key] != null) return row[key]
  for (const k of fallbacks) {
    if (row && k in row && row[k] != null) return row[k]
  }
  return 0
}

const normalizeText = (text) => String(text || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ')
  .trim()

const vendasBrutas = computed(() => props.dados.reduce((s, r) => s + toNumber(get(r, 'valor_bruto', ['valorBruto', 'vendaBruta'])), 0))
const vendasLiquidas = computed(() => props.dados.reduce((s, r) => s + toNumber(get(r, 'valor_liquido', ['valorLiquido', 'vendaLiquida'])), 0))
const taxas = computed(() => props.dados.reduce((s, r) => s + toNumber(get(r, 'despesa_mdr', ['despesaMdr', 'taxaMdr'])), 0))

const debitos = computed(() => {
  const rows = props.dados.filter(r => {
    const modalidade = normalizeText(r?.modalidade)
    const bandeira = normalizeText(r?.bandeira)
    const texto = `${modalidade} ${bandeira}`.trim()
    const isAluguelMaquina = texto.includes('aluguel') && (texto.includes('maquin') || texto.includes('terminal') || texto.includes('pos'))
    const isDebitoFixo = texto.includes('mensalidade') || texto.includes('ajuste') || texto.includes('desconto')
    return isAluguelMaquina || isDebitoFixo
  })
  return rows.reduce((s, r) => {
    const valorBruto = Math.abs(toNumber(get(r, 'valor_bruto', ['valorBruto', 'vendaBruta'])))
    const despesaMdr = Math.abs(toNumber(get(r, 'despesa_mdr', ['despesaMdr'])))
    return s + (valorBruto > 0 ? valorBruto : despesaMdr)
  }, 0)
})

const despesaAntecipacao = computed(() => props.dados.reduce((s, r) => {
  return s + Math.abs(toNumber(get(r, 'despesa_antecipacao', ['despesaAntecipacao'])))
}, 0))

const totalLiquido = computed(() => vendasLiquidas.value)

const toggleFilter = (filterName) => {
  emit('filter-change', props.activeFilter === filterName ? '' : filterName)
}

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
</script>
