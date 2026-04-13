<template>
  <div class="bg-white rounded-lg shadow-md p-4">
    <div class="flex justify-between items-center mb-3 sticky top-0 bg-white z-10 py-2 border-b">
      <h3 v-if="titulo" class="text-lg md:text-xl font-semibold text-gray-800">{{ titulo }}</h3>
      <div class="flex gap-4 text-base md:text-lg text-gray-700">
        <div>
          <span class="font-medium">Filtradas:</span> 
          <span class="ml-1 font-bold">{{ transacoesFiltradas.length }}</span>
        </div>
        <div>
          <span class="font-medium">Total Filtrado:</span> 
          <span class="ml-1 font-bold text-blue-600">{{ formatarValor(totalFiltradas) }}</span>
        </div>
        <div class="border-l border-gray-300 pl-4">
          <span class="font-medium">Selecionadas:</span> 
          <span class="ml-1 font-bold">{{ selecionadas.size }}</span>
        </div>
        <div>
          <span class="font-medium">Total Selecionado:</span> 
          <span class="ml-1 font-bold text-green-600">{{ formatarValor(totalSelecionadas) }}</span>
        </div>
      </div>
    </div>
    
    <!-- Filtro de Descrição -->
    <div class="mb-4 px-1">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
        </div>
        <input 
          v-model="filtroDescricao" 
          type="text" 
          placeholder="Filtrar por descrição..." 
          class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <div v-if="filtroDescricao" class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button @click="filtroDescricao = ''" class="text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </button>
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
            <th :style="{ width: widths.valor + 'px' }" class="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider relative select-none group cursor-pointer hover:bg-gray-100" @click.stop="toggleMenuValor">
              <div class="flex items-center justify-end gap-1">
                <span>Valor</span>
                <svg v-if="ordemValor === 'asc'" class="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
                <svg v-else-if="ordemValor === 'desc'" class="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                <svg v-else class="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
              </div>
              
              <!-- Menu Dropdown -->
              <div v-if="menuValorAberto" class="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <button @click.stop="ordenar('asc')" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  Menor para Maior
                </button>
                <button @click.stop="ordenar('desc')" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  Maior para Menor
                </button>
                <div class="border-t border-gray-100 my-1"></div>
                <button @click.stop="ordenar(null)" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left">
                  Resetar Filtros
                </button>
              </div>

              <span class="absolute right-0 top-0 h-full w-1 bg-gray-300 cursor-col-resize opacity-0 group-hover:opacity-100" @mousedown.stop="iniciarResize('valor', $event)"></span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200 select-none">
          <tr v-for="(t, idx) in transacoesFiltradas" :key="idx" @click="toggleSelecao(idx)" :class="rowClass(idx)" class="cursor-pointer hover:bg-gray-50 transition-colors duration-150">
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
import { reactive, ref, computed, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  transacoes: { type: Array, default: () => [] },
  columnWidths: { type: Object, default: () => ({ data: 140, descricao: 500, documento: 160, valor: 140 }) },
  titulo: { type: String, default: '' }
})

const widths = reactive({ ...props.columnWidths })
const selecionadas = ref(new Set())
const filtroDescricao = ref('')
const ordemValor = ref(null) // null, 'asc', 'desc'
const menuValorAberto = ref(false)

const obterValor = (t) => {
  return Number(t.valorNumerico ?? t.valor ?? 0) || 0
}

const transacoesFiltradas = computed(() => {
  let resultado = props.transacoes
  
  // 1. Filtro de Descrição
  if (filtroDescricao.value) {
    const termo = filtroDescricao.value.toLowerCase()
    resultado = resultado.filter(t => 
      (t.descricao || '').toLowerCase().includes(termo)
    )
  }

  // 2. Ordenação por Valor
  if (ordemValor.value) {
    resultado = [...resultado].sort((a, b) => {
      const valA = obterValor(a)
      const valB = obterValor(b)
      return ordemValor.value === 'asc' ? valA - valB : valB - valA
    })
  }

  return resultado
})

const toggleMenuValor = () => {
  menuValorAberto.value = !menuValorAberto.value
}

const ordenar = (direcao) => {
  ordemValor.value = direcao
  menuValorAberto.value = false
}

// Fechar menu ao clicar fora
const fecharMenu = (e) => {
  if (menuValorAberto.value) {
    menuValorAberto.value = false
  }
}

watch(menuValorAberto, (aberto) => {
  if (aberto) {
    setTimeout(() => document.addEventListener('click', fecharMenu), 0)
  } else {
    document.removeEventListener('click', fecharMenu)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', fecharMenu)
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})

watch(filtroDescricao, () => {
  selecionadas.value.clear()
})

const totalSelecionadas = computed(() => {
  let total = 0
  selecionadas.value.forEach(i => {
    const t = transacoesFiltradas.value[i]
    if (t) total += obterValor(t)
  })
  return total
})

const totalFiltradas = computed(() => {
  return transacoesFiltradas.value.reduce((acc, t) => acc + obterValor(t), 0)
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

const formatarValor = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
</script>

<style scoped>
.cursor-col-resize { cursor: col-resize; }
</style>
