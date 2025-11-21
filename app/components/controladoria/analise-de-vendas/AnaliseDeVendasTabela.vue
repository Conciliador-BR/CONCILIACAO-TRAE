<template>
  <div class="rounded-2xl border border-gray-200/60 bg-white/70 backdrop-blur shadow-xl">
    <div class="px-6 py-4 border-b border-gray-200/70">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">{{ titulo }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ subtitulo }}</p>
        </div>
        <div class="flex items-center space-x-3">
          <select v-model="filtroAtivo" class="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white/90 backdrop-blur focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="todas">Todas Bandeiras</option>
            <option v-for="bandeira in bandeirasUnicas" :key="bandeira" :value="bandeira">{{ bandeira }}</option>
          </select>
          <button @click="exportarDados" class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Exportar
          </button>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bandeira</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transações</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita Bruta</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Taxa</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita Líquida</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margem Bruta</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa Efetiva</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lucratividade</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(item, index) in dadosFiltrados" :key="item.bandeira" :class="[index % 2 === 0 ? 'bg-white' : 'bg-gray-50', 'hover:bg-blue-50 transition']">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-3" :style="{ backgroundColor: getCorBandeira(item.bandeira) }"></div>
                <div class="text-sm font-medium text-gray-900">{{ item.bandeira }}</div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.quantidade.toLocaleString('pt-BR') }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ formatarMoeda(item.receitaBruta) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">{{ formatarMoeda(item.custoTaxa) }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">{{ formatarMoeda(item.receitaLiquida) }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="text-sm font-medium text-gray-900">{{ formatarPercentual(item.margemBruta) }}</div>
                <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
                  <div class="h-2 rounded-full" :class="getCorMargem(item.margemBruta)" :style="{ width: Math.min(item.margemBruta, 100) + '%' }"></div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatarPercentual(item.taxaEfetiva) }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="['px-2 py-1 text-xs font-medium rounded-full', getClassificacaoLucratividade(item.margemBruta)]">{{ getClassificacaoTexto(item.margemBruta) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center">
          <p class="text-xs text-gray-500">Total Transações</p>
          <p class="text-sm font-semibold text-gray-900">{{ totalTransacoes.toLocaleString('pt-BR') }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500">Receita Bruta Total</p>
          <p class="text-sm font-semibold text-gray-900">{{ formatarMoeda(totalReceitaBruta) }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500">Custo Total Taxas</p>
          <p class="text-sm font-semibold text-red-600">{{ formatarMoeda(totalCustoTaxa) }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-500">Receita Líquida Total</p>
          <p class="text-sm font-semibold text-green-700">{{ formatarMoeda(totalReceitaLiquida) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  dados: { type: Array, required: true, default: () => [] },
  titulo: { type: String, default: 'Análise Detalhada por Bandeira' },
  subtitulo: { type: String, default: 'Detalhamento completo das vendas por bandeira e modalidade' },
  loading: { type: Boolean, default: false }
})

const filtroAtivo = ref('todas')

const bandeirasUnicas = computed(() => {
  const bandeiras = [...new Set(props.dados.map(item => item.bandeira))]
  return bandeiras.sort()
})

const dadosFiltrados = computed(() => filtroAtivo.value === 'todas' ? props.dados : props.dados.filter(item => item.bandeira === filtroAtivo.value))

const totalTransacoes = computed(() => dadosFiltrados.value.reduce((acc, item) => acc + item.quantidade, 0))
const totalReceitaBruta = computed(() => dadosFiltrados.value.reduce((acc, item) => acc + item.receitaBruta, 0))
const totalCustoTaxa = computed(() => dadosFiltrados.value.reduce((acc, item) => acc + item.custoTaxa, 0))
const totalReceitaLiquida = computed(() => dadosFiltrados.value.reduce((acc, item) => acc + item.receitaLiquida, 0))

const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor || 0)
const formatarPercentual = (valor) => new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((valor || 0) / 100)

const getCorBandeira = (bandeira) => {
  const cores = { 'VISA': '#1a1f71', 'VISA ELECTRON': '#1a1f71', 'MASTERCARD': '#eb001b', 'MAESTRO': '#eb001b', 'ELO CRÉDITO': '#00a8e1', 'ELO DÉBITO': '#00a8e1', 'PIX': '#00d4aa', 'AMEX': '#006fcf', 'HIPERCARD': '#e21836', 'DINERS': '#0079be', 'CABAL': '#0033a0' }
  return cores[bandeira] || '#6b7280'
}

const getCorMargem = (margem) => margem >= 95 ? 'bg-green-500' : margem >= 90 ? 'bg-yellow-500' : 'bg-red-500'
const getClassificacaoLucratividade = (margem) => margem >= 95 ? 'bg-green-100 text-green-800' : margem >= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
const getClassificacaoTexto = (margem) => margem >= 95 ? 'Alta' : margem >= 90 ? 'Média' : 'Baixa'

const exportarDados = () => {
  const csvContent = [
    ['Bandeira', 'Transações', 'Receita Bruta', 'Custo Taxa', 'Receita Líquida', 'Margem Bruta', 'Taxa Efetiva'],
    ...dadosFiltrados.value.map(item => [item.bandeira, item.quantidade, item.receitaBruta, item.custoTaxa, item.receitaLiquida, item.margemBruta, item.taxaEfetiva])
  ].map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'analise-de-vendas.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>