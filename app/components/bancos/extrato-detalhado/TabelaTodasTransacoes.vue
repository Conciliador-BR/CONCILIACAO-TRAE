<template>
  <div class="flex-1 flex flex-col bg-white">
    <!-- Resumo -->
    <div class="border-b border-gray-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{{ transacoes.length }}</div>
          <div class="text-sm text-gray-500">Total de Transações</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ formatarMoeda(totalCreditos) }}</div>
          <div class="text-sm text-gray-500">Total Créditos</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ formatarMoeda(totalDebitos) }}</div>
          <div class="text-sm text-gray-500">Total Débitos</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold" :class="saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatarMoeda(saldoTotal) }}
          </div>
          <div class="text-sm text-gray-500">Saldo Total</div>
        </div>
      </div>
    </div>
    
    <!-- Tabela -->
    <div class="flex-1 overflow-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50 sticky top-0">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Banco
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descrição
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Documento
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(transacao, index) in transacoes" :key="index" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ transacao.data_formatada || formatarData(transacao.data) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ transacao.banco?.replace('_', ' ') || 'N/A' }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
              {{ transacao.descricao || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ transacao.documento || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium"
                :class="transacao.valor >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatarMoeda(transacao.valor) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

// Computed para totais
const totalCreditos = computed(() => {
  return props.transacoes
    .filter(t => t.valor > 0)
    .reduce((sum, t) => sum + (t.valor || 0), 0)
})

const totalDebitos = computed(() => {
  return props.transacoes
    .filter(t => t.valor < 0)
    .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0)
})

const saldoTotal = computed(() => {
  return props.transacoes.reduce((sum, t) => sum + (t.valor || 0), 0)
})

// Função para formatar moeda
const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined) return 'R$ 0,00'
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Math.abs(valor))
}

// Função para formatar data
const formatarData = (data) => {
  if (!data) return 'N/A'
  
  try {
    if (typeof data === 'string' && data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return data
    }
    
    if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [ano, mes, dia] = data.split('-')
      return `${dia}/${mes}/${ano}`
    }
    
    const dateObj = new Date(data)
    if (!isNaN(dateObj.getTime())) {
      const dia = String(dateObj.getDate()).padStart(2, '0')
      const mes = String(dateObj.getMonth() + 1).padStart(2, '0')
      const ano = dateObj.getFullYear()
      return `${dia}/${mes}/${ano}`
    }
    
    return 'N/A'
  } catch (error) {
    return 'N/A'
  }
}
</script>