<template>
  <div v-if="transacoes && transacoes.length > 0" class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800">
        Transações Processadas
      </h3>
      <div class="text-sm text-gray-600">
        Total: {{ calcularTotal() }}
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
          Todas as Transações ({{ transacoes.length }})
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
      <!-- Tabela de Todas as Transações -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
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
            <tr v-for="transacao in transacoes" :key="transacao.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ transacao.data }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                <div class="max-w-xs truncate" :title="transacao.descricao">
                  {{ transacao.descricao }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ transacao.documento }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                <span :class="[
                  transacao.valorNumerico >= 0 ? 'text-green-600' : 'text-red-600'
                ]">
                  {{ transacao.valor }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Resumo das Transações -->
      <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{{ transacoes.length }}</div>
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
      <DetectadorAdquirentesSicoob v-if="isSicoob" :transacoes="transacoes" />
      <DetectadorAdquirentesTribanco v-else-if="isTribanco" :transacoes="transacoes" />
      <TransacoesResumidasBanco v-else :transacoes="transacoes" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import TransacoesResumidasBanco from './TransacoesResumidasBanco.vue'
import DetectadorAdquirentesSicoob from './Detectador_Adquirentes/DetectadorAdquirentesSicoob.vue'
import DetectadorAdquirentesTribanco from './Detectador_Adquirentes/DetectadorAdquirentesTribanco.vue'

const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

const abaAtiva = ref('todas')

const isSicoob = computed(() => {
  return props.transacoes.length > 0 && props.transacoes.every(t => (t.banco || '').toLowerCase() === 'sicoob')
})

const isTribanco = computed(() => {
  return props.transacoes.length > 0 && props.transacoes.every(t => (t.banco || '').toLowerCase() === 'tribanco')
})

const calcularTotal = () => {
  const total = props.transacoes.reduce((acc, transacao) => acc + transacao.valorNumerico, 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(total)
}

const contarCreditos = () => {
  return props.transacoes.filter(t => t.valorNumerico > 0).length
}

const contarDebitos = () => {
  return props.transacoes.filter(t => t.valorNumerico < 0).length
}
</script>
