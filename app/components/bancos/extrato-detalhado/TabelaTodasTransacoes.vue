<template>
  <div class="flex-1 flex flex-col w-full max-w-none bg-white">
    <div class="border-b border-gray-200 p-3 lg:p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{{ transacoesFiltradas.length }}</div>
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

    <div class="px-3 lg:px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-4">
      <div class="text-sm text-gray-700">
        <span class="font-medium">Selecionadas:</span>
        <span class="ml-1 font-bold">{{ selecionadas.size }}</span>
      </div>
      <div class="text-sm text-gray-700">
        <span class="font-medium">Total Selecionado:</span>
        <span class="ml-1 font-bold text-green-600">{{ formatarMoeda(totalSelecionadas) }}</span>
      </div>
    </div>

    <div ref="scrollContainer" class="flex-1 overflow-auto" @scroll.passive="handleScroll">
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
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider relative">
              <div class="flex items-center justify-end gap-1 cursor-pointer select-none" @click.stop="toggleMenuValor">
                <span>Valor</span>
                <svg v-if="ordemValor === 'asc'" class="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
                <svg v-else-if="ordemValor === 'desc'" class="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                <svg v-else class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
              </div>
              <div v-if="menuValorAberto" class="absolute right-2 top-full mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
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
            </th>
          </tr>
          <tr class="bg-white">
            <th class="px-6 py-3">
              <input
                v-model="filtrosColuna.data"
                type="text"
                placeholder="Filtrar data..."
                class="filter-input w-full"
              />
            </th>
            <th class="px-6 py-3">
              <input
                v-model="filtrosColuna.banco"
                type="text"
                placeholder="Filtrar banco..."
                class="filter-input w-full"
              />
            </th>
            <th class="px-6 py-3">
              <input
                v-model="filtrosColuna.descricao"
                type="text"
                placeholder="Filtrar descrição..."
                class="filter-input w-full"
              />
            </th>
            <th class="px-6 py-3">
              <input
                v-model="filtrosColuna.documento"
                type="text"
                placeholder="Filtrar documento..."
                class="filter-input w-full"
              />
            </th>
            <th class="px-6 py-3">
              <input
                v-model="filtrosColuna.valor"
                type="text"
                placeholder="Filtrar valor..."
                class="filter-input w-full text-right"
              />
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="topSpacerHeight > 0">
            <td colspan="5" class="p-0 border-0" :style="{ height: `${topSpacerHeight}px` }"></td>
          </tr>
          <tr
            v-for="item in transacoesVisiveis"
            :key="`${item.transacao?.id || item.transacao?.documento || 'transacao'}-${item.index}`"
            class="hover:bg-gray-50 cursor-pointer"
            :class="selecionadas.has(item.index) ? 'bg-green-100' : 'bg-white'"
            @click="toggleSelecao(item.index)"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ item.transacao.data_formatada || formatarData(item.transacao.data) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ item.transacao.banco?.replace('_', ' ') || 'N/A' }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
              {{ item.transacao.descricao || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ item.transacao.documento || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium"
                :class="obterValor(item.transacao) >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatarMoeda(obterValor(item.transacao)) }}
            </td>
          </tr>
          <tr v-if="bottomSpacerHeight > 0">
            <td colspan="5" class="p-0 border-0" :style="{ height: `${bottomSpacerHeight}px` }"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

// Props
const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

const ordemValor = ref(null)
const menuValorAberto = ref(false)
const selecionadas = ref(new Set())
const scrollContainer = ref(null)
const scrollTop = ref(0)
const containerHeight = ref(720)
const debouncedFiltros = reactive({
  data: '',
  banco: '',
  descricao: '',
  documento: '',
  valor: ''
})
const filtrosColuna = reactive({
  data: '',
  banco: '',
  descricao: '',
  documento: '',
  valor: ''
})
const ROW_HEIGHT = 57
const OVERSCAN = 12
let filtroDebounceTimeout = null
let resizeObserver = null

const obterValor = (transacao) => {
  return Number(transacao?.valorNumerico ?? transacao?.valor ?? 0) || 0
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
    formatarMoeda(valor),
    formatarMoeda(absoluto),
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
  let resultado = props.transacoes || []

  const filtroData = normalizarTextoBusca(debouncedFiltros.data)
  const filtroBanco = normalizarTextoBusca(debouncedFiltros.banco)
  const filtroDescricao = normalizarTextoBusca(debouncedFiltros.descricao)
  const filtroDocumento = normalizarTextoBusca(debouncedFiltros.documento)
  const filtroValor = normalizarTextoBusca(debouncedFiltros.valor)

  if (filtroData || filtroBanco || filtroDescricao || filtroDocumento || filtroValor) {
    resultado = resultado.filter((t) => {
      const dataTexto = normalizarTextoBusca(t?.data_formatada || formatarData(t?.data))
      const bancoTexto = normalizarTextoBusca(t?.banco?.replace('_', ' ') || '')
      const descricaoTexto = normalizarTextoBusca(t?.descricao || '')
      const documentoTexto = normalizarTextoBusca(t?.documento || '')
      const valorTexto = formatarValorBusca(t)

      if (filtroData && !dataTexto.includes(filtroData)) return false
      if (filtroBanco && !bancoTexto.includes(filtroBanco)) return false
      if (filtroDescricao && !descricaoTexto.includes(filtroDescricao)) return false
      if (filtroDocumento && !documentoTexto.includes(filtroDocumento)) return false
      if (filtroValor && !valorTexto.includes(filtroValor)) return false

      return true
    })
  }

  if (ordemValor.value) {
    resultado = [...resultado].sort((a, b) => {
      const va = obterValor(a)
      const vb = obterValor(b)
      return ordemValor.value === 'asc' ? va - vb : vb - va
    })
  }

  return resultado
})

const totalLinhas = computed(() => transacoesFiltradas.value.length)
const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - OVERSCAN))
const visibleCount = computed(() => Math.ceil(containerHeight.value / ROW_HEIGHT) + (OVERSCAN * 2))
const endIndex = computed(() => Math.min(totalLinhas.value, startIndex.value + visibleCount.value))
const topSpacerHeight = computed(() => startIndex.value * ROW_HEIGHT)
const bottomSpacerHeight = computed(() => Math.max(0, (totalLinhas.value - endIndex.value) * ROW_HEIGHT))
const transacoesVisiveis = computed(() => (
  transacoesFiltradas.value
    .slice(startIndex.value, endIndex.value)
    .map((transacao, offset) => ({
      transacao,
      index: startIndex.value + offset
    }))
))

const atualizarAlturaContainer = () => {
  const altura = scrollContainer.value?.clientHeight || 720
  if (altura > 0) {
    containerHeight.value = altura
  }
}

const handleScroll = () => {
  scrollTop.value = scrollContainer.value?.scrollTop || 0
}

const toggleMenuValor = () => {
  menuValorAberto.value = !menuValorAberto.value
}

const ordenar = (direcao) => {
  ordemValor.value = direcao
  menuValorAberto.value = false
}

const fecharMenu = () => {
  if (menuValorAberto.value) menuValorAberto.value = false
}

watch(menuValorAberto, (aberto) => {
  if (aberto) {
    setTimeout(() => document.addEventListener('click', fecharMenu), 0)
  } else {
    document.removeEventListener('click', fecharMenu)
  }
})

watch(
  () => ({ ...filtrosColuna }),
  (novosFiltros) => {
    clearTimeout(filtroDebounceTimeout)
    filtroDebounceTimeout = setTimeout(() => {
      Object.assign(debouncedFiltros, novosFiltros)
    }, 180)
  },
  { deep: true, immediate: true }
)

watch([() => debouncedFiltros.data, () => debouncedFiltros.banco, () => debouncedFiltros.descricao, () => debouncedFiltros.documento, () => debouncedFiltros.valor, ordemValor], () => {
  selecionadas.value.clear()
  scrollTop.value = 0
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0
  }
})

onMounted(() => {
  atualizarAlturaContainer()

  if (process.client && typeof ResizeObserver !== 'undefined' && scrollContainer.value) {
    resizeObserver = new ResizeObserver(() => {
      atualizarAlturaContainer()
    })
    resizeObserver.observe(scrollContainer.value)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', fecharMenu)
  clearTimeout(filtroDebounceTimeout)
  resizeObserver?.disconnect()
})

const toggleSelecao = (idx) => {
  const set = new Set(selecionadas.value)
  if (set.has(idx)) set.delete(idx)
  else set.add(idx)
  selecionadas.value = set
}

const totalCreditos = computed(() => {
  return transacoesFiltradas.value
    .filter(t => obterValor(t) > 0)
    .reduce((sum, t) => sum + obterValor(t), 0)
})

const totalDebitos = computed(() => {
  return transacoesFiltradas.value
    .filter(t => obterValor(t) < 0)
    .reduce((sum, t) => sum + Math.abs(obterValor(t)), 0)
})

const saldoTotal = computed(() => {
  return transacoesFiltradas.value.reduce((sum, t) => sum + obterValor(t), 0)
})

const totalSelecionadas = computed(() => {
  let total = 0
  selecionadas.value.forEach(i => {
    const t = transacoesFiltradas.value[i]
    if (t) total += obterValor(t)
  })
  return total
})

const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined) return 'R$ 0,00'
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

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

<style scoped>
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
