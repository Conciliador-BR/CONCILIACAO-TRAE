<template>
  <div class="mb-8 px-2 sm:px-4 lg:px-6 xl:px-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8 gap-4 sm:gap-6 lg:gap-8">
      <!-- Vendas Brutas (Limpa Filtro) -->
      <div 
        @click="emitFilter(null)"
        class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        :class="{ 'ring-4 ring-green-300 ring-offset-2': !activeFilter }"
      >
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-green-100 text-xs sm:text-sm lg:text-sm">Vendas Brutas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(vendasBrutas) }}</p>
          </div>
          <CurrencyDollarIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-200 ml-2" />
        </div>
      </div>

      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-blue-100 text-xs sm:text-sm lg:text-sm">Vendas Líquidas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(vendasLiquidas) }}</p>
          </div>
          <ArrowTrendingUpIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-200 ml-2" />
        </div>
      </div>

      <!-- Conciliadas -->
      <div 
        @click="emitFilter('Conciliado')"
        class="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        :class="{ 'ring-4 ring-emerald-300 ring-offset-2': activeFilter === 'Conciliado' }"
      >
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-emerald-100 text-xs sm:text-sm lg:text-sm">Conciliadas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ conciliadasCount }}</p>
          </div>
          <CheckCircleIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-emerald-200 ml-2" />
        </div>
      </div>

      <!-- A Receber -->
      <div 
        @click="emitFilter('A receber')"
        class="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        :class="{ 'ring-4 ring-cyan-300 ring-offset-2': activeFilter === 'A receber' }"
      >
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-cyan-100 text-xs sm:text-sm lg:text-sm">A Receber</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ aReceberCount }}</p>
          </div>
          <ClockIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-cyan-200 ml-2" />
        </div>
      </div>

      <!-- Atrasadas -->
      <div 
        @click="emitFilter('Atrasado')"
        class="bg-gradient-to-r from-rose-500 to-rose-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        :class="{ 'ring-4 ring-rose-300 ring-offset-2': activeFilter === 'Atrasado' }"
      >
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-rose-100 text-xs sm:text-sm lg:text-sm">Atrasadas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ atrasadasCount }}</p>
          </div>
          <ExclamationCircleIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-rose-200 ml-2" />
        </div>
      </div>

      <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-red-100 text-xs sm:text-sm lg:text-sm">Total Taxas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(taxas) }}</p>
          </div>
          <PercentBadgeIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-200 ml-2" />
        </div>
      </div>

      <div class="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-orange-100 text-xs sm:text-sm lg:text-sm">Débitos</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(debitos) }}</p>
          </div>
          <ExclamationTriangleIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-orange-200 ml-2" />
        </div>
      </div>

      <div class="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-purple-100 text-xs sm:text-sm lg:text-sm">Total Líquido</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ formatCurrency(totalLiquido) }}</p>
          </div>
          <BanknotesIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-purple-200 ml-2" />
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
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'
import { useAuditoriaStatus } from '~/composables/useAuditoriaStatus'

const props = defineProps({ 
  dados: { type: Array, default: () => [] },
  activeFilter: { type: String, default: null }
})

const emit = defineEmits(['filter-status'])

const { getAuditoriaLabel } = useAuditoriaStatus()

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

const modalidadesDebito = ['mensalidade', 'ajustes', 'aluguel de maquina', 'aluguel', 'descontos']

const vendasBrutas = computed(() => props.dados.reduce((s, r) => s + toNumber(get(r, 'vendaBruta', ['valor_bruto', 'valorBruto'])), 0))
const vendasLiquidas = computed(() => props.dados.reduce((s, r) => s + toNumber(get(r, 'vendaLiquida', ['valor_liquido', 'valorLiquido'])), 0))
const taxas = computed(() => props.dados.reduce((s, r) => s + toNumber(get(r, 'despesaMdr', ['despesa_mdr', 'taxaMdr'])), 0))

const debitos = computed(() => {
  const rows = props.dados.filter(r => {
    const m = String(r?.modalidade || '').toLowerCase()
    return modalidadesDebito.some(mod => m.includes(mod))
  })
  return rows.reduce((s, r) => s + Math.abs(toNumber(get(r, 'vendaBruta', ['valor_bruto', 'valorBruto']))), 0)
})

const totalLiquido = computed(() => vendasLiquidas.value)

// Counts for new cards
const conciliadasCount = computed(() => props.dados.filter(r => getAuditoriaLabel(r) === 'Conciliado').length)
const aReceberCount = computed(() => props.dados.filter(r => getAuditoriaLabel(r) === 'A receber').length)
const atrasadasCount = computed(() => props.dados.filter(r => getAuditoriaLabel(r) === 'Atrasado').length)

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

const emitFilter = (status) => {
  emit('filter-status', status)
}
</script>