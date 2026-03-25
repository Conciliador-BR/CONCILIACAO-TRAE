<template>
  <div class="flex-1 flex flex-col bg-white">
    <div class="border-b border-gray-200 p-4">
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

    <div class="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-4">
      <div class="text-sm text-gray-700">
        <span class="font-medium">Selecionadas:</span>
        <span class="ml-1 font-bold">{{ selecionadas.size }}</span>
      </div>
      <div class="text-sm text-gray-700">
        <span class="font-medium">Total Selecionado:</span>
        <span class="ml-1 font-bold text-green-600">{{ formatarMoeda(totalSelecionadas) }}</span>
      </div>
    </div>

    <div class="px-4 py-3 border-b border-gray-200">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
        </div>
        <input
          v-model="filtroDescricao"
          type="text"
          placeholder="Filtrar por descrição..."
          class="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="(transacao, index) in transacoesFiltradas"
            :key="index"
            class="hover:bg-gray-50 cursor-pointer"
            :class="selecionadas.has(index) ? 'bg-green-100' : 'bg-white'"
            @click="toggleSelecao(index)"
          >
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
                :class="obterValor(transacao) >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatarMoeda(obterValor(transacao)) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

// Props
const props = defineProps({
  transacoes: {
    type: Array,
    default: () => []
  }
})

const filtroDescricao = ref('')
const ordemValor = ref(null)
const menuValorAberto = ref(false)
const selecionadas = ref(new Set())

const obterValor = (transacao) => {
  return Number(transacao?.valorNumerico ?? transacao?.valor ?? 0) || 0
}

const transacoesFiltradas = computed(() => {
  let resultado = props.transacoes || []

  if (filtroDescricao.value) {
    const termo = filtroDescricao.value.toLowerCase()
    resultado = resultado.filter(t => (t.descricao || '').toLowerCase().includes(termo))
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

watch(filtroDescricao, () => {
  selecionadas.value.clear()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', fecharMenu)
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
