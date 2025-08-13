<template>
  <tr class="hover:bg-blue-50 transition-colors duration-200">
    <td v-for="column in columnOrder" :key="column" class="px-6 py-4 border-r border-gray-200">
      <VendasCellEditor
        :model-value="venda[column]"
        @update:model-value="updateField(column, $event)"
        :column-type="getColumnType(column)"
        :empresas="empresas"
        :adquirentes="adquirentes"
        :bandeiras="bandeiras"
        :modalidades="modalidades"
        :readonly="isReadonly(column)"
        :placeholder="getPlaceholder(column)"
        @change="handleChange(column)"
        @blur="handleBlur(column)"
      />
    </td>
    
    <!-- Coluna de Ações -->
    <td class="px-6 py-4">
      <button 
        @click="$emit('remover-linha')"
        class="text-red-600 hover:text-red-800 transition-colors p-2"
        title="Remover linha"
      >
        🗑️
      </button>
    </td>
  </tr>
</template>

<script setup>
import VendasCellEditor from './VendasCellEditor.vue'

const props = defineProps({
  venda: {
    type: Object,
    required: true
  },
  columnOrder: {
    type: Array,
    required: true
  },
  empresas: {
    type: Array,
    default: () => []
  },
  adquirentes: {
    type: Array,
    default: () => []
  },
  bandeiras: {
    type: Array,
    default: () => []
  },
  modalidades: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update-venda', 'remover-linha'])

// Mapear tipos de coluna
const getColumnType = (column) => {
  const typeMap = {
    empresa: 'empresa',
    adquirente: 'adquirente', 
    bandeira: 'bandeira',
    modalidade: 'modalidade',
    parcelas: 'parcelas',
    dataVenda: 'date',
    cancelamento: 'date',
    previsaoPagamento: 'date',
    vendaBruto: 'number',
    taxaMdr: 'number',
    valorTaxa: 'number',
    vendaLiquido: 'number',
    nsu: 'text'
  }
  return typeMap[column] || 'text'
}

// Verificar se é readonly
const isReadonly = (column) => {
  return ['valorTaxa', 'vendaLiquido'].includes(column)
}

// Obter placeholder
const getPlaceholder = (column) => {
  const placeholderMap = {
    parcelas: '1',
    vendaBruto: '0,00',
    taxaMdr: '0,00',
    valorTaxa: '0,00',
    vendaLiquido: '0,00',
    nsu: 'NSU'
  }
  return placeholderMap[column] || ''
}

// Atualizar campo
const updateField = (column, value) => {
  const updatedVenda = { ...props.venda, [column]: value }
  emit('update-venda', updatedVenda)
}

// Eventos de mudança e blur
const handleChange = (column) => {
  emit('update-venda', props.venda, 'change', column)
}

const handleBlur = (column) => {
  emit('update-venda', props.venda, 'blur', column)
}
</script>