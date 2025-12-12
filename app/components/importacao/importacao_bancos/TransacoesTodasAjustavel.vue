<template>
  <div class="bg-white rounded-lg shadow-md p-4">
    <div class="flex justify-between items-center mb-3 sticky top-0 bg-white z-10 py-2 border-b">
      <h3 v-if="titulo" class="text-lg md:text-xl font-semibold text-gray-800">{{ titulo }}</h3>
      <div class="flex gap-4 text-base md:text-lg text-gray-700">
        <div>
          <span class="font-medium">Selecionadas:</span> 
          <span class="ml-1 font-bold">{{ selecionadas.size }}</span>
        </div>
        <div>
          <span class="font-medium">Total Selecionado:</span> 
          <span class="ml-1 font-bold text-green-600">{{ formatarValor(totalSelecionadas) }}</span>
        </div>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full w-full divide-y divide-gray-200 table-fixed">
        <colgroup>
          <col :style="{ width: widths.data + 'px' }" />
          <col :style="{ width: widths.descricao + 'px' }" />
          <col :style="{ width: widths.documento + 'px' }" />
          <col :style="{ width: widths.valor + 'px' }" />
        </colgroup>
        <thead>
          <tr>
            <th :style="{ width: widths.data + 'px' }" class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative select-none group">
              <span>Data</span>
              <span class="absolute right-0 top-0 h-full w-1 bg-gray-300 cursor-col-resize opacity-0 group-hover:opacity-100" @mousedown="iniciarResize('data', $event)"></span>
            </th>
            <th :style="{ width: widths.descricao + 'px' }" class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative select-none group">
              <span>Descrição</span>
              <span class="absolute right-0 top-0 h-full w-1 bg-gray-300 cursor-col-resize opacity-0 group-hover:opacity-100" @mousedown="iniciarResize('descricao', $event)"></span>
            </th>
            <th :style="{ width: widths.documento + 'px' }" class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative select-none group">
              <span>Documento</span>
              <span class="absolute right-0 top-0 h-full w-1 bg-gray-300 cursor-col-resize opacity-0 group-hover:opacity-100" @mousedown="iniciarResize('documento', $event)"></span>
            </th>
            <th :style="{ width: widths.valor + 'px' }" class="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider relative select-none group">
              <span>Valor</span>
              <span class="absolute right-0 top-0 h-full w-1 bg-gray-300 cursor-col-resize opacity-0 group-hover:opacity-100" @mousedown="iniciarResize('valor', $event)"></span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200 select-none">
          <tr v-for="(t, idx) in transacoes" :key="idx" @click="toggleSelecao(idx)" :class="rowClass(idx)" class="cursor-pointer hover:bg-gray-50 transition-colors duration-150">
            <td :style="{ width: widths.data + 'px' }" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ t.data_formatada || t.data || 'N/A' }}</td>
            <td :style="{ width: widths.descricao + 'px' }" class="px-6 py-4 text-sm text-gray-900">
              <div class="w-full truncate" :title="t.descricao || 'N/A'">
                {{ t.descricao || 'N/A' }}
              </div>
            </td>
            <td :style="{ width: widths.documento + 'px' }" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ t.documento ?? t.doc ?? t.document ?? '' }}</td>
            <td :style="{ width: widths.valor + 'px' }" class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
              <span :class="[obterValor(t) >= 0 ? 'text-green-600' : 'text-red-600']">
                {{ formatarValor(obterValor(t)) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  transacoes: { type: Array, default: () => [] },
  columnWidths: { type: Object, default: () => ({ data: 140, descricao: 500, documento: 160, valor: 140 }) },
  titulo: { type: String, default: '' }
})

const widths = reactive({ ...props.columnWidths })
const selecionadas = ref(new Set())

const obterValor = (t) => {
  return Number(t.valorNumerico ?? t.valor ?? 0) || 0
}

const totalSelecionadas = computed(() => {
  let total = 0
  selecionadas.value.forEach(i => {
    const t = props.transacoes[i]
    total += obterValor(t)
  })
  return total
})

const rowClass = (idx) => {
  return selecionadas.value.has(idx) ? 'bg-green-100' : 'bg-white'
}

const toggleSelecao = (idx) => {
  const set = new Set(selecionadas.value)
  if (set.has(idx)) set.delete(idx)
  else set.add(idx)
  selecionadas.value = set
}

// Resizing Logic
const estadoResize = ref({ ativo: false, coluna: '', startX: 0, startW: 0 })
const iniciarResize = (coluna, e) => {
  estadoResize.value = { ativo: true, coluna, startX: e.clientX, startW: widths[coluna] }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
const onMouseMove = (e) => {
  if (!estadoResize.value.ativo) return
  const delta = e.clientX - estadoResize.value.startX
  const w = Math.max(60, estadoResize.value.startW + delta)
  widths[estadoResize.value.coluna] = w
}
const onMouseUp = () => {
  estadoResize.value.ativo = false
  estadoResize.value.coluna = ''
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})

const formatarValor = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
</script>

<style scoped>
.cursor-col-resize { cursor: col-resize; }
</style>
