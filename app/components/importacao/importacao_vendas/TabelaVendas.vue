<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6" v-if="vendas.length > 0">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">4. Vendas Processadas</h2>
      <div class="flex space-x-4">
        <span class="text-sm text-gray-600">
          Total: {{ vendas.length }} vendas
        </span>
        <span class="text-sm text-gray-600">
          Valor Bruto: {{ formatCurrency(valorBrutoTotal) }}
        </span>
        <span class="text-sm text-gray-600 text-red-600">
          Valor de Despesa: {{ formatCurrency(valorDespesaTotal) }}
        </span>
        <span class="text-sm text-gray-600 font-semibold text-green-600">
          Valor Líquido: {{ formatCurrency(valorLiquidoTotal) }}
        </span>
        <span v-if="adquirenteExibir" class="text-sm text-gray-600">
          Adquirente: {{ adquirenteExibir }}
        </span>
      </div>
    </div>
  <PrevisaoFilterCards
    :predicted-count="predictedCount"
    :unpredicted-count="unpredictedCount"
    @filter="applyFilter"
  />
  
  <!-- Tabela de Vendas -->
  <div class="overflow-x-auto">
      <table class="min-w-full table-auto text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-2 py-2 text-left text-xs font-medium">ID</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Data Venda</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Modalidade</th>
            <th class="px-2 py-2 text-left text-xs font-medium">NSU</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Bruto</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Líquido</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Taxa MDR</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Despesa MDR</th>
            <th class="px-2 py-2 text-center text-xs font-medium">Nº Parcelas</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Bandeira</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Antecipação</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Despesa Antecipação</th>
            <th class="px-2 py-2 text-right text-xs font-medium">Valor Líquido Antecipação</th>
            <th class="px-2 py-2 text-center text-xs font-medium text-blue-600">Previsão PGTO</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Adquirente</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Empresa</th>
            <th class="px-2 py-2 text-left text-xs font-medium">Matriz</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(venda, index) in paginatedVendas" 
            :key="index"
            :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
          >
            <td class="px-2 py-2 text-xs">{{ venda.id || '-' }}</td>
            <td class="px-2 py-2 text-xs">{{ formatDate(venda.data_venda) }}</td>
            <td class="px-2 py-2 text-xs">{{ String(venda.modalidade || '').toUpperCase() }}</td>
            <td class="px-2 py-2 text-xs font-mono">{{ venda.nsu }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium">{{ formatCurrency(venda.valor_bruto) }}</td>
            <td class="px-2 py-2 text-xs text-right font-medium text-green-600">{{ formatCurrency(venda.valor_liquido) }}</td>
            <!-- EDIT: exibir MDR como porcentagem normalizada -->
            <td class="px-2 py-2 text-xs text-right">{{ formatPercent(venda.taxa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.despesa_mdr) }}</td>
            <td class="px-2 py-2 text-xs text-center">{{ (venda.parcela_atual && (venda.numero_parcelas || 0) > 1) ? `${venda.parcela_atual} de ${venda.numero_parcelas}` : (venda.numero_parcelas || 1) }}</td>
            <td class="px-2 py-2 text-xs">{{ String(venda.bandeira || '').toUpperCase() }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.valor_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.despesa_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-right">{{ formatCurrency(venda.valor_liquido_antecipacao) }}</td>
            <td class="px-2 py-2 text-xs text-center font-medium text-blue-600">{{ venda.previsao_exibir }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.adquirente }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.empresa }}</td>
            <td class="px-2 py-2 text-xs">{{ venda.matriz }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Componente de Paginação -->
    <VendasPagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-items="totalItems"
      :items-per-page="itemsPerPage"
      @update:currentPage="setPage"
      @update:itemsPerPage="setItemsPerPage"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { usePrevisaoPagamento } from '~/composables/importacao/Envio_vendas/usePrevisaoPagamento'
import VendasPagination from './VendasPagination.vue'
import PrevisaoFilterCards from './PrevisaoFilterCards.vue'

const props = defineProps({
  vendas: {
    type: Array,
    default: () => []
  },
  adquirente: {
    type: String,
    default: ''
  }
})

// Estados para paginação
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Usar o composable centralizado para cálculo de previsões
const { calcularPrevisaoVenda, carregarTaxas, limparCacheParcelas, taxas } = usePrevisaoPagamento()

// Computed para paginação
const totalItems = computed(() => props.vendas.length)
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))

// Watcher para limpar cache quando vendas mudarem
watch(() => props.vendas, (novasVendas, vendasAnteriores) => {
  // Limpar cache apenas se as vendas realmente mudaram
  if (novasVendas !== vendasAnteriores) {
    limparCacheParcelas()
  }
}, { deep: true })

// Computed para calcular previsões uma única vez
const vendasComPrevisao = computed(() => {
  const _ = taxas.value
  return props.vendas.map(venda => {
    const isRede = String(venda.adquirente || '').trim().toUpperCase() === 'REDE'
    const previsao = isRede ? (venda.previsao_pgto || '') : (venda.previsao_pgto || calcularPrevisaoVenda(venda))
    return {
      ...venda,
      previsao_exibir: previsao
    }
  })
})

const predictedCount = computed(() => vendasComPrevisao.value.filter(v => !!v.previsao_exibir).length)
const unpredictedCount = computed(() => vendasComPrevisao.value.filter(v => !v.previsao_exibir).length)

const filterType = ref('')
const applyFilter = (type) => {
  filterType.value = type
}

const paginatedVendas = computed(() => {
  let base = vendasComPrevisao.value
  if (filterType.value === 'predicted') {
    base = base.filter(v => !!v.previsao_calculada)
  } else if (filterType.value === 'unpredicted') {
    base = base.filter(v => !v.previsao_calculada)
  }
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return base.slice(start, end)
})

// Métodos de paginação
const setPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const setItemsPerPage = (newSize) => {
  itemsPerPage.value = newSize
  currentPage.value = 1 // Reset para primeira página
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const valorBrutoTotal = computed(() => {
  return props.vendas.reduce((total, venda) => total + (venda.valor_bruto || 0), 0)
})

const valorLiquidoTotal = computed(() => {
  return props.vendas.reduce((total, venda) => total + (venda.valor_liquido || 0), 0)
})

const valorDespesaTotal = computed(() => {
  return props.vendas.reduce((total, venda) => {
    const dm = Number(venda.despesa_mdr || 0)
    const da = Number(venda.despesa_antecipacao || 0)
    if ((dm || 0) !== 0 || (da || 0) !== 0) {
      return total + dm + da
    }
    const vb = Number(venda.valor_bruto || 0)
    const vl = Number(venda.valor_liquido || 0)
    const diff = Math.abs(vb - vl)
    return total + diff
  }, 0)
})

const adquirenteExibir = computed(() => {
  return String(props.adquirente || '').trim().toUpperCase()
})

// ✅ Função para cores alternadas nas linhas
const getRowClasses = (index) => {
  const baseClasses = 'border-t hover:bg-blue-50 transition-colors duration-150'
  const isEven = index % 2 === 0
  return isEven ? baseClasses + ' bg-white' : baseClasses + ' bg-gray-50'
}



const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  
  // Função para criar data de forma segura (evita problemas de timezone)
  const criarDataSegura = (dataString) => {
    if (!dataString) return null
    
    // Se já é um objeto Date válido
    if (dataString instanceof Date && !isNaN(dataString.getTime())) {
      return new Date(dataString.getFullYear(), dataString.getMonth(), dataString.getDate())
    }
    
    const str = String(dataString).trim()
    
    // Formato YYYY-MM-DD (mais comum vindo do banco)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [ano, mes, dia] = str.split('-').map(Number)
      return new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-11
    }
    
    // Formato DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
      const [dia, mes, ano] = str.split('/').map(Number)
      return new Date(ano, mes - 1, dia)
    }
    
    return null
  }
  
  const data = criarDataSegura(dateString)
  if (!data || isNaN(data.getTime())) {
    console.warn('Data inválida para formatação:', dateString)
    return '-'
  }
  
  return data.toLocaleDateString('pt-BR')
}

// Carregar taxas quando o componente for montado
onMounted(async () => {
  await carregarTaxas()
})

const formatPercent = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (!Number.isFinite(n)) return '-'
  const abs = Math.abs(n)

  // Normaliza:
  // - 69 -> 0.69% (divide por 100)
  // - 0.0069 -> 0.69% (multiplica por 100)
  // - 0.69 -> 0.69% (mantém)
  let pct
  if (abs > 1) pct = n / 100
  else if (abs <= 0.05) pct = n * 100
  else pct = n

  return `${pct.toFixed(2)}%`
}
</script>
