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
          <tr class="bg-white">
            <th :style="{ width: widths.data + 'px' }" class="px-2 py-2">
              <input
                v-model="filtrosColuna.data"
                type="text"
                placeholder="Filtrar data..."
                class="filter-input w-full"
              />
            </th>
            <th :style="{ width: widths.descricao + 'px' }" class="px-2 py-2">
              <input
                v-model="filtrosColuna.descricao"
                type="text"
                placeholder="Filtrar descrição..."
                class="filter-input w-full"
              />
            </th>
            <th :style="{ width: widths.documento + 'px' }" class="px-2 py-2">
              <input
                v-model="filtrosColuna.documento"
                type="text"
                placeholder="Filtrar documento..."
                class="filter-input w-full"
              />
            </th>
            <th :style="{ width: widths.valor + 'px' }" class="px-2 py-2">
              <input
                v-model="filtrosColuna.valor"
                type="text"
                placeholder="Filtrar valor..."
                class="filter-input w-full text-right"
              />
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
const filtrosColuna = reactive({
  data: '',
  descricao: '',
  documento: '',
  valor: ''
})
const ordemValor = ref(null) // null, 'asc', 'desc'
const menuValorAberto = ref(false)

const obterValor = (t) => {
  return Number(t.valorNumerico ?? t.valor ?? 0) || 0
}

const normalizarTextoBusca = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const formatarValorBusca = (transacao) => {
  const valor = obterValor(transacao)
  const absoluto = Math.abs(valor)

  return [
    String(transacao?.valor ?? ''),
    String(transacao?.valorNumerico ?? ''),
    formatarValor(valor),
    formatarValor(absoluto),
    valor.toFixed(2),
    absoluto.toFixed(2),
    valor.toFixed(2).replace('.', ','),
    absoluto.toFixed(2).replace('.', ',')
  ]
    .map((item) => normalizarTextoBusca(item))
    .filter(Boolean)
    .join(' ')
}

const transacoesFiltradas = computed(() => {
  let resultado = props.transacoes
  
  const filtroData = normalizarTextoBusca(filtrosColuna.data)
  const filtroDescricao = normalizarTextoBusca(filtrosColuna.descricao)
  const filtroDocumento = normalizarTextoBusca(filtrosColuna.documento)
  const filtroValor = normalizarTextoBusca(filtrosColuna.valor)

  if (filtroData || filtroDescricao || filtroDocumento || filtroValor) {
    resultado = resultado.filter((t) => {
      const dataTexto = normalizarTextoBusca(t?.data_formatada || t?.data || '')
      const descricaoTexto = normalizarTextoBusca(t?.descricao || '')
      const documentoTexto = normalizarTextoBusca(t?.documento ?? t?.doc ?? t?.document ?? '')
      const valorTexto = formatarValorBusca(t)

      if (filtroData && !dataTexto.includes(filtroData)) return false
      if (filtroDescricao && !descricaoTexto.includes(filtroDescricao)) return false
      if (filtroDocumento && !documentoTexto.includes(filtroDocumento)) return false
      if (filtroValor && !valorTexto.includes(filtroValor)) return false

      return true
    })
  }

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

watch([() => filtrosColuna.data, () => filtrosColuna.descricao, () => filtrosColuna.documento, () => filtrosColuna.valor, ordemValor], () => {
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

.filter-input {
  height: 40px;
  border: 1px solid rgb(226 232 240);
  border-radius: 0.75rem;
  background: rgb(248 250 252);
  padding: 0 0.75rem;
  font-size: 0.75rem;
  color: rgb(51 65 85);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.filter-input::placeholder {
  color: rgb(148 163 184);
}

.filter-input:focus {
  border-color: rgb(36 75 119);
  background: #fff;
  box-shadow: 0 0 0 2px rgba(139, 181, 222, 0.35);
}
</style>
