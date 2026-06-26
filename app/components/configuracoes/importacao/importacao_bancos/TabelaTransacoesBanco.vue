<template>
  <div v-if="transacoes && transacoes.length > 0" class="w-full max-w-none bg-white rounded-lg shadow-md p-4 lg:p-5 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800">
        Transações Processadas
      </h3>
      <div class="flex items-center gap-3">
        <div class="text-sm">
          <label class="text-gray-600 mr-2">Mês:</label>
          <select
            v-model="mesSelecionado"
            class="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-700"
          >
            <option value="todos">Todos os meses</option>
            <option v-for="op in opcoesMes" :key="op.valor" :value="op.valor">
              {{ op.label }}
            </option>
          </select>
        </div>
        <div class="text-sm text-gray-600">
          Total: {{ calcularTotal() }}
        </div>
      </div>
    </div>

    <!-- Abas -->
    <div class="border-b border-gray-200 mb-4">
      <nav class="-mb-px flex space-x-8">
        <button
          @click="abaAtiva = 'todas'"
          :class="[
            'py-2 px-1 border-b-2 font-medium text-sm',
            abaAtiva === 'todas'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          Todas as Transações ({{ transacoesFiltradas.length }})
        </button>
        <button
          @click="abaAtiva = 'resumidas'"
          :class="[
            'py-2 px-1 border-b-2 font-medium text-sm',
            abaAtiva === 'resumidas'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          Transações Resumidas
        </button>
      </nav>
    </div>

    <!-- Conteúdo das Abas -->
    <div v-if="abaAtiva === 'todas'">
      <TransacoesTodasAjustavel :transacoes="transacoesFiltradas" />
      
      <!-- Resumo Geral -->
      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{{ transacoesFiltradas.length }}</div>
          <div class="text-sm text-gray-500">Total de Transações</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ contarCreditos() }}</div>
          <div class="text-sm text-gray-500">Créditos</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ contarDebitos() }}</div>
          <div class="text-sm text-gray-500">Débitos</div>
        </div>
      </div>
    </div>

    <div v-if="abaAtiva === 'resumidas'">
      <TransacoesResumidasBancoShared :transacoes="transacoesFiltradas" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import TransacoesTodasAjustavel from './TransacoesTodasAjustavel.vue'
import TransacoesResumidasBancoShared from './TransacoesResumidasBancoShared.vue'

const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

const abaAtiva = ref('todas')
const mesSelecionado = ref('todos')

const extrairMesAno = (data) => {
  const valor = String(data || '').trim()
  if (!valor) return null
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    const [, mm, aaaa] = valor.split('/')
    return `${aaaa}-${mm}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return valor.slice(0, 7)
  }
  return null
}

const labelMesAno = (mesAno) => {
  const [ano, mes] = String(mesAno).split('-')
  const nomes = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  const idx = Math.max(1, Math.min(12, Number(mes || 0))) - 1
  return `${nomes[idx]} / ${ano}`
}

const opcoesMes = computed(() => {
  const set = new Set()
  for (const t of props.transacoes || []) {
    const chave = extrairMesAno(t?.data)
    if (chave) set.add(chave)
  }
  return Array.from(set)
    .sort((a, b) => a.localeCompare(b))
    .map(valor => ({ valor, label: labelMesAno(valor) }))
})

const transacoesFiltradas = computed(() => {
  if (mesSelecionado.value === 'todos') return props.transacoes
  return (props.transacoes || []).filter(t => extrairMesAno(t?.data) === mesSelecionado.value)
})

const calcularTotal = () => {
  const total = transacoesFiltradas.value.reduce((acc, transacao) => acc + transacao.valorNumerico, 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(total)
}

const contarCreditos = () => {
  return transacoesFiltradas.value.filter(t => t.valorNumerico > 0).length
}

const contarDebitos = () => {
  return transacoesFiltradas.value.filter(t => t.valorNumerico < 0).length
}
</script>
