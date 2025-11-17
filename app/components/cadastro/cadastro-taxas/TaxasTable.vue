<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="(column, index) in visibleColumns"
            :key="column"
            scope="col"
            class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            :style="{ width: responsiveColumnWidths[column] + 'px' }"
            draggable="true"
            @dragstart="onDragStart($event, column, index)"
            @dragover="onDragOver"
            @drop="onDrop($event, index)"
            @dragend="onDragEnd"
          >
            <div class="flex items-center justify-between">
              <span>{{ columnTitles[column] }}</span>
              <div 
                class="w-1 h-full cursor-col-resize"
                @mousedown="startResize($event, column)"
              ></div>
            </div>
          </th>
          <th scope="col" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Ações
          </th>
        </tr>
      </thead>
  <tbody class="bg-white divide-y divide-gray-200">
    <tr v-for="(taxa, index) in taxas" :key="taxa.id || index">
      <td v-for="column in visibleColumns" :key="column" class="px-4 py-2 whitespace-nowrap">
        <div v-if="column === 'id'" class="text-center font-medium text-gray-700">
          {{ index + 1 }}
        </div>
        <div v-else-if="column === 'empresa'" class="text-gray-900">
          {{ selectedEmpresaNome }}
        </div>
        <div v-else-if="column === 'ec'" class="text-gray-900">
          {{ (taxa.ec ?? selectedEmpresaEC) || '' }}
        </div>
        <input 
          v-else-if="column === 'taxa'"
          type="number"
          step="0.01"
          min="0"
              max="100"
              :value="taxa.percentualTaxa || 0"
              @input="$emit('update-taxa', index, 'percentualTaxa', parseFloat($event.target.value) || 0)"
              class="w-full p-1 border rounded text-right"
              :disabled="isEditing !== index"
              placeholder="Ex: 2.5"
            />
            <input 
              v-else-if="['parcelas', 'dataCorte'].includes(column)"
              type="number"
              :step="column === 'parcelas' ? '1' : '1'"
              :min="column === 'parcelas' ? '1' : '1'"
              :value="taxa[column] || (column === 'parcelas' ? 1 : 1)"
              @input="$emit('update-taxa', index, column, parseInt($event.target.value) || (column === 'parcelas' ? 1 : 1))"
              class="w-full p-1 border rounded text-right"
              :disabled="isEditing !== index"
            />
            <select 
              v-else
              :value="column === 'empresa' ? selectedEmpresaNome : taxa[column]"
              @change="$emit('update-taxa', index, column, $event.target.value)"
              class="w-full p-1 border rounded"
              :disabled="isEditing !== index || column === 'empresa'"
            >
              <option value="">Selecione...</option>
              <option 
                v-for="option in getOptionsForColumn(column)" 
                :key="column === 'empresa' ? option.id : option" 
                :value="column === 'empresa' ? option.nome : option"
              >
                {{ column === 'empresa' ? option.nome : option }}
              </option>
            </select>
          </td>
          <td class="px-4 py-2 whitespace-nowrap text-sm font-medium">
            <BotaoEditar @click="$emit('editar-taxa', index)" />
            <button @click="$emit('remover-taxa', index)" class="text-red-600 hover:text-red-900 ml-4">
              Remover
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import BotaoEditar from './BotaoEditar.vue'

const props = defineProps({
  taxas: Array,
  visibleColumns: Array,
  columnTitles: Object,
  responsiveColumnWidths: Object,
  draggedColumn: String,
  columnOrder: Array,
  empresas: Array,
  isEditing: Number,
  selectedEmpresaNome: String,
  selectedEmpresaEC: String,
})

const emit = defineEmits([
  'update-taxa', 
  'remover-taxa', 
  'editar-taxa',
  'drag-start', 
  'drag-over', 
  'drag-drop', 
  'drag-end', 
  'start-resize'
])

// Função para obter opções para cada coluna
const getOptionsForColumn = (column) => {
  switch (column) {
    case 'empresa':
      return props.empresas || []
    case 'adquirente':
      return ['Cielo', 'Rede', 'Getnet', 'Stone', 'PagSeguro', 'Mercado Pago', 'UNICA']
    case 'bandeira':
      return [
        'VISA CREDITO',
        'VISA DEBITO',
        'MASTER CREDITO',
        'MASTER DEBITO',
        'ELO DEBITO',
        'ELO CREDITO',
        'AMEX',
        'HIPERCARD',
        'BANESCARD CREDITO',
        'BANESCARD DEBITO',
        'SORO CREDITO',
        'DINERS CREDITO',
        'CABAL CREDITO',
        'CABAL DEBITO',
      ]
    case 'modalidade':
      return ['CREDITO', 'DEBITO', 'PARCELADO', 'PIX']
    default:
      return []
  }
}

// Handlers para os eventos de drag and drop
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

<style scoped>
/* Estilizar barras de rolagem */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>