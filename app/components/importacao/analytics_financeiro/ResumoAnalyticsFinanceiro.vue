<template>
  <div class="mb-8 px-2 sm:px-4 lg:px-6 xl:px-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7 gap-4 sm:gap-6 lg:gap-8">
      <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-indigo-100 text-xs sm:text-sm lg:text-sm">Empresas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ empresasResumo.contagem }}</p>
            <div class="mt-1">
              <span class="text-indigo-300 text-xs sm:text-sm">{{ empresasResumo.preview }}</span>
            </div>
          </div>
          <UserGroupIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-indigo-200 ml-2" />
        </div>
      </div>

      <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
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

      <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-red-100 text-xs sm:text-sm lg:text-sm">Taxas</p>
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

      <div class="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-emerald-100 text-xs sm:text-sm lg:text-sm">Vendas Conciliadas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ conciliadas }}</p>
          </div>
          <CheckCircleIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-emerald-200 ml-2" />
        </div>
      </div>

      <div class="bg-gradient-to-r from-rose-500 to-rose-600 text-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div class="flex items-center justify-between h-full">
          <div class="flex-1">
            <p class="text-rose-100 text-xs sm:text-sm lg:text-sm">Vendas Não Conciliadas</p>
            <p class="text-lg sm:text-xl lg:text-2xl font-bold">{{ naoConciliadas }}</p>
          </div>
          <XCircleIcon class="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-rose-200 ml-2" />
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
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'
import { useConciliacaoVendasRecebimentos } from '~/composables/analytics-financeiro/useConciliacaoVendasRecebimentos'

const { conciliados } = useConciliacaoVendasRecebimentos()

const modalidadesDebito = ['mensalidade', 'ajustes', 'aluguel de maquina', 'aluguel', 'descontos']

const vendasBrutas = computed(() => (conciliados.value || []).reduce((s, r) => s + (parseFloat(r.vendaBruta) || 0), 0))
const vendasLiquidas = computed(() => (conciliados.value || []).reduce((s, r) => s + (parseFloat(r.vendaLiquida) || 0), 0))
const taxas = computed(() => (conciliados.value || []).reduce((s, r) => s + (parseFloat(r.despesaMdr) || 0), 0))

const debitos = computed(() => {
  const rows = (conciliados.value || []).filter(r => {
    const m = String(r.modalidade || '').toLowerCase()
    return modalidadesDebito.some(mod => m.includes(mod))
  })
  return rows.reduce((s, r) => s + Math.abs(parseFloat(r.vendaBruta) || 0), 0)
})

const conciliadas = computed(() => (conciliados.value || []).filter(r => r.auditoria === 'Conciliado').length)
const naoConciliadas = computed(() => (conciliados.value || []).filter(r => r.auditoria !== 'Conciliado').length)

const empresasResumo = computed(() => {
  const set = new Set((conciliados.value || []).map(r => r.empresa).filter(Boolean))
  const arr = Array.from(set)
  const preview = arr.slice(0, 3).join(', ') + (arr.length > 3 ? `, +${arr.length - 3}` : '')
  return { contagem: arr.length, preview }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}
</script>

