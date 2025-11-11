<template>
  <!-- Remover max-h-[600px] e usar h-full para ocupar todo o espaço disponível -->
  <div class="overflow-auto h-full w-full border border-gray-200">
    <table class="w-full table-fixed">
      <colgroup>
        <col v-for="column in visibleColumns" :key="column" :style="{ width: responsiveColumnWidths[column] + 'px' }">
      </colgroup>
      <PrevisaoPagamentosTableHeader 
        :visible-columns="visibleColumns"
        :column-titles="columnTitles"
        :dragged-column="draggedColumn"
        @drag-start="handleDragStart"
        @drag-over="handleDragOver"
        @drag-drop="handleDragDrop"
        @drag-end="handleDragEnd"
        @start-resize="handleStartResize"
      />
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="(venda, index) in vendas" :key="venda.id || index" class="hover:bg-gray-50">
          <td v-for="column in visibleColumns" :key="column" class="px-4 py-3 text-sm text-gray-900 border-b">
            <!-- Usar componente independente para coluna previsão -->
            <PrevisaoPgtoColumn 
              v-if="column === 'previsaoPgto'" 
              :venda="venda" 
              :debug="false"
            />
            <span v-else :class="getCellClasses(column)">
              {{ formatCellValue(column, venda[column]) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import PrevisaoPagamentosTableHeader from './PrevisaoPagamentosTableHeader.vue'
import PrevisaoPgtoColumn from './PrevisaoPgtoColumn.vue'
import { onMounted } from 'vue'
import { usePrevisaoColuna } from '~/composables/PagePagamentos/filtrar_tabelas_previsao/usePrevisaoColuna'

defineProps({
  vendas: Array,
  visibleColumns: Array,
  columnTitles: Object,
  responsiveColumnWidths: Object,
  draggedColumn: String,
  columnOrder: Array
})

const emit = defineEmits(['drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize'])
const { inicializar } = usePrevisaoColuna()

// Função para formatar valores das células (igual à página de vendas)
const formatCellValue = (column, value) => {
  if (value === null || value === undefined) return ''
  
  // Formatação para valores monetários
  if (['vendaBruta', 'vendaLiquida', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec'].includes(column)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Formatação para taxa MDR (porcentagem)
  if (column === 'taxaMdr') {
    return `${value}%`
  }
  
  // Formatação para data (igual à página de vendas)
  if (column === 'dataVenda' && value) {
    // 🔍 DEBUG: Investigar discrepância de datas
    console.log('🔍 [PREVISAO] DEBUG Data Venda:', {
      column,
      value,
      type: typeof value,
      isString: typeof value === 'string',
      matchesDDMMYYYY: typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/),
      originalValue: value
    })
    
    // Se a data já está no formato DD/MM/YYYY, retornar como está
    if (typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      console.log('✅ [PREVISAO] Data já formatada DD/MM/YYYY:', value)
      return value
    }
    
    // 🔧 CORREÇÃO: Se a data está no formato YYYY-MM-DD, converter de forma segura
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [ano, mes, dia] = value.split('-')
      const dataFormatada = `${dia}/${mes}/${ano}`
      
      console.log('🔄 [PREVISAO] Data YYYY-MM-DD convertida:', {
        original: value,
        formatted: dataFormatada
      })
      
      return dataFormatada
    }
    
    // Se a data está em outro formato, converter para DD/MM/YYYY usando criação segura
    try {
      let date
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Se está no formato YYYY-MM-DD, criar data local sem timezone
        const [ano, mes, dia] = value.split('-').map(Number)
        date = new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-11
      } else {
        date = new Date(value)
      }
      
      if (!isNaN(date.getTime())) {
        const dia = String(date.getDate()).padStart(2, '0')
        const mes = String(date.getMonth() + 1).padStart(2, '0')
        const ano = date.getFullYear()
        const dataFormatada = `${dia}/${mes}/${ano}`
        
        console.log('🔄 [PREVISAO] Data convertida:', {
          original: value,
          dateObject: date,
          formatted: dataFormatada
        })
        
        return dataFormatada
      }
    } catch (error) {
      console.error('❌ [PREVISAO] Erro ao formatar data:', error)
    }
    
    console.log('⚠️ [PREVISAO] Retornando valor original:', value)
    return value
  }
  
  return value
}

// Função para classes CSS das células (igual à página de vendas)
const getCellClasses = (column) => {
  const baseClasses = 'text-sm'
  
  // Alinhamento à direita para valores numéricos
  if (['vendaBruta', 'vendaLiquida', 'taxaMdr', 'despesaMdr', 'valorAntecipado', 'despesasAntecipacao', 'valorLiquidoAntec', 'numeroParcelas'].includes(column)) {
    return baseClasses + ' text-right font-medium'
  }
  
  return baseClasses
}

// Inicializar taxas ao montar o componente
onMounted(async () => {
  await inicializar()
})

// Handlers para eventos de drag and drop
const handleDragStart = (event, column, index) => {
  emit('drag-start', event, column, index)
}

const handleDragOver = (event) => {
  emit('drag-over', event)
}

const handleDragDrop = (event, targetIndex) => {
  emit('drag-drop', event, targetIndex)
}

const handleDragEnd = () => {
  emit('drag-end')
}

const handleStartResize = (event, column) => {
  emit('start-resize', event, column)
}
</script>