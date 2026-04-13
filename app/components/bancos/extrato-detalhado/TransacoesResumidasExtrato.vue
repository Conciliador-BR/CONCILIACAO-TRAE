<template>
  <div class="flex-1 flex flex-col bg-white p-6">
    <div v-if="transacoes.length > 0" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <p class="text-sm font-semibold text-gray-900">Transações resumidas</p>
        <p class="text-xs text-gray-600 mt-1">Mostrando {{ linhas.length }} de {{ transacoes.length }}</p>
      </div>
      <div class="overflow-auto max-h-[520px]">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th v-for="c in colunas" :key="c" class="text-left px-4 py-3 font-semibold text-gray-700 whitespace-nowrap">
                {{ c }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in linhas" :key="idx" class="border-t border-gray-100">
              <td v-for="c in colunas" :key="c" class="px-4 py-3 text-gray-700 whitespace-nowrap">
                {{ formatCell(row?.[c]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="text-center py-8 text-gray-500">
      <p>Nenhuma transação para exibir.</p>
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

const colunas = computed(() => {
  const first = props.transacoes?.[0]
  if (!first || typeof first !== 'object') return []
  return Object.keys(first).slice(0, 10)
})

const linhas = computed(() => (props.transacoes || []).slice(0, 50))

const formatCell = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
</script>
