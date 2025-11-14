<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Analytics Financeiro</h2>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Análise consolidada de indicadores</p>
        </div>
      </div>
    </div>

    <!-- tabela com as colunas solicitadas + Pago + Auditoria -->
    <div class="bg-white/50 backdrop-blur-sm">
      <!-- Estado de carregamento -->
      <div v-if="isLoading" class="px-8 py-16 text-center bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
          <svg class="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </div>
        <p class="text-gray-700 font-semibold text-lg mb-2">Conciliando vendas e recebimentos...</p>
        <p class="text-sm text-gray-600">Aguarde enquanto processamos os dados</p>
      </div>

      <!-- Estado de erro -->
      <div v-else-if="hasError" class="px-8 py-16 text-center bg-gradient-to-br from-red-50/50 to-rose-50/50">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-6 shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <p class="text-red-700 font-semibold text-lg mb-2">Erro ao conciliar dados</p>
        <p class="text-sm text-gray-600 mb-6">{{ hasError }}</p>
        <button @click="recarregar" class="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          Tentar novamente
        </button>
      </div>

      <!-- Tabela de dados -->
      <div v-else class="overflow-auto max-h-[2000px] border border-gray-200 rounded-lg" style="scrollbar-width: thin;">
        <div class="min-w-full">
          <table class="w-full table-fixed">
            <colgroup>
              <col v-for="column in visibleColumns" :key="column" :style="{ width: responsiveColumnWidths[column] + 'px' }">
            </colgroup>
            <thead class="bg-gradient-to-r from-gray-50 to-white">
              <tr class="border-b border-blue-700/50">
                <th v-for="(column, index) in visibleColumns" :key="column" class="group relative px-6 py-4 text-left">
                  <div class="text-sm font-bold text-gray-700 tracking-wide uppercase">
                    {{ columnTitles[column] }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(item, idx) in sampleData" :key="idx" class="hover:bg-gray-50">
                <td v-for="col in visibleColumns" :key="col" class="px-6 py-4 text-sm text-gray-900">
                  {{ formatCell(item[col], col) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-200">
      <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 text-sm text-gray-600">Resumo e indicadores financeiros</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useConciliacaoVendasRecebimentos } from '~/composables/analytics-financeiro/useConciliacaoVendasRecebimentos'
import { useFormatacaoTabelaFinanceira } from '~/composables/analytics-financeiro/formatacaoTabela'
const props = defineProps({ somenteNaoConciliadas: { type: Boolean, default: false } })

// colunas exatas da tabela de vendas + Pago + Auditoria
const visibleColumns = ref([
  'empresa',
  'matriz',
  'adquirente',
  'dataVenda',
  'dataPagamento',
  'modalidade',
  'nsu',
  'vendaBruta',
  'vendaLiquida',
  'despesaMdr',
  'numeroParcelas',
  'bandeira',
  'previsaoPgto',
  'auditoria'
])

// títulos das colunas (igual ao VendasTable + novas)
const columnTitles = ref({
  empresa: 'Empresa',
  matriz: 'Matriz',
  adquirente: 'Adquirente',
  dataVenda: 'Data Venda',
  dataPagamento: 'Data Pagamento',
  modalidade: 'Modalidade',
  nsu: 'NSU',
  vendaBruta: 'Venda Bruta',
  vendaLiquida: 'Venda Líquida',
  despesaMdr: 'Despesa MDR',
  numeroParcelas: 'Número Parcelas',
  bandeira: 'Bandeira',
  previsaoPgto: 'Previsão PGTO',
  auditoria: 'Auditoria'
})

// larguras das colunas (iguais ao VendasTable + novas)
const responsiveColumnWidths = ref({
  empresa: 150,
  matriz: 100,
  adquirente: 120,
  dataVenda: 120,
  dataPagamento: 140,
  modalidade: 130,
  nsu: 100,
  vendaBruta: 120,
  vendaLiquida: 120,
  despesaMdr: 120,
  numeroParcelas: 120,
  bandeira: 100,
  previsaoPgto: 130,
  auditoria: 120
})

// Dados conciliados vindos do composable
const { conciliados, loading, error, recarregar } = useConciliacaoVendasRecebimentos()

// Computed para usar na tabela
const sampleData = computed(() => {
  const rows = conciliados.value || []
  if (props.somenteNaoConciliadas) return rows.filter(r => r.auditoria !== 'Conciliado')
  return rows
})

// Estados de carregamento e erro
const isLoading = computed(() => loading.value)
const hasError = computed(() => error.value)

const { formatCell } = useFormatacaoTabelaFinanceira()
</script>
