<template>
  <div class="overflow-hidden rounded-2xl border border-gray-100 shadow-lg bg-white">
    <div class="overflow-auto min-h-[560px] max-h-[840px] bg-gradient-to-b from-white to-gray-50/30">
    <table class="w-full table-fixed">
      <thead class="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 sticky top-0 z-10 shadow-md">
        <tr>
          <th
            v-for="(column, index) in visibleColumns"
            :key="column"
            scope="col"
            class="group relative px-6 py-6 text-center cursor-pointer transition-all duration-300 hover:bg-white/5"
            :style="{ width: responsiveColumnWidths[column] + 'px' }"
            draggable="true"
            @dragstart="onDragStart($event, column, index)"
            @dragover="onDragOver"
            @drop="onDrop($event, index)"
            @dragend="onDragEnd"
          >
            <div class="flex items-center justify-between">
              <span class="text-lg font-bold text-white tracking-wide">{{ columnTitles[column] }}</span>
              <div 
                class="w-1 h-full cursor-col-resize"
                @mousedown="startResize($event, column)"
              ></div>
            </div>
          </th>
          <th scope="col" class="group relative px-6 py-6 text-center cursor-pointer transition-all duration-300 hover:bg-white/5 text-white" :style="{ width: responsiveColumnWidths['acoes'] + 'px' }">
            <span class="text-lg font-bold text-white tracking-wide">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody class="bg-transparent divide-y divide-gray-200/60">
        <tr v-for="(taxa, index) in taxas" :key="taxa.id || index" 
            class="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 relative" 
            :class="index % 2 === 0 ? 'bg-white/80' : 'bg-gray-50/50'">
          <td v-for="column in visibleColumns" :key="column" class="px-6 py-6 text-center border-b border-gray-200/50 group-hover:border-blue-200/70 transition-all duration-300" :style="{ width: responsiveColumnWidths[column] + 'px' }">
        <div v-if="column === 'id'" :class="getCellClasses('id')">
          {{ index + 1 }}
        </div>
        <div v-else-if="column === 'empresa'" :class="getCellClasses('empresa')">
          {{ selectedEmpresaNome }}
        </div>
        <div v-else-if="column === 'ec'" :class="getCellClasses('ec')">
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
              class="w-full p-1 border rounded text-right text-xl"
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
              class="w-full p-1 border rounded text-right text-xl"
              :disabled="isEditing !== index"
            />
            <div v-else-if="isMulti(column)" class="relative">
              <button 
                type="button"
                class="w-full px-3 py-2 border rounded text-left bg-white hover:bg-gray-50"
                :disabled="isEditing !== index"
                @click="toggleMultiMenu(index, column)"
              >
                <span v-if="getMultiValue(taxa[column]).length === 0" class="text-gray-500">Selecione...</span>
                <div v-else class="flex flex-wrap gap-1">
                  <span v-for="tag in getMultiValue(taxa[column])" :key="tag" class="px-2 py-1 text-sm rounded-full bg-blue-100 text-blue-700">
                    {{ tag }}
                  </span>
                </div>
              </button>
              <div 
                v-if="isMenuOpen(index, column)" 
                class="absolute mt-2 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg z-20"
              >
                <div class="px-2 py-2 sticky top-0 bg-white border-b">
                  <input 
                    type="text" 
                    class="w-full px-2 py-1 border rounded text-sm" 
                    placeholder="Buscar..."
                    v-model="multiSearch"
                  />
                </div>
                <ul class="py-2">
                  <li 
                    v-for="option in filteredOptions(column)" 
                    :key="option" 
                    class="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
                    @click="toggleOption(index, column, option)"
                  >
                    <input type="checkbox" :checked="optionSelected(taxa, column, option)" />
                    <span class="text-sm">{{ option }}</span>
                  </li>
                </ul>
                <div class="px-3 py-2 border-t bg-gray-50 flex justify-end gap-2">
                  <button class="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700" @click="confirmMulti(index, column)">OK</button>
                  <button class="px-3 py-1 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300" @click="closeMultiMenu()">Cancelar</button>
                </div>
              </div>
            </div>
            <select 
              v-else
              :value="column === 'empresa' ? selectedEmpresaNome : taxa[column]"
              @change="$emit('update-taxa', index, column, $event.target.value)"
              class="w-full p-2 border rounded text-lg"
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
      <tbody>
        <tr v-for="n in fillerRows" :key="'filler-'+n" :class="n % 2 === 0 ? 'bg-white/80' : 'bg-gray-50/50'" class="group">
          <td :colspan="visibleColumns.length + 1" class="px-6 py-6">&nbsp;</td>
        </tr>
      </tbody>
    </table>
  </div>
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
  renderCount: {
    type: Number,
    default: 10
  }
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
      return [
        'UNICA',
        'CIELO',
        'PAGBANK',
        'STONE',
        'AZULZINHA',
        'REDE',
        'SICREDI',
        'GETNET',
        'MERCADO PAGO',
        'BIN',
        'TRICARD',
        'BRASILCARD'
      ]
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
      return [
        'DEBITO',
        'PRE-PAGO DEBITO',
        'CREDITO',
        'PRE-PAGO CREDITO',
        'PARCELADO',
        'PIX'
      ]
    case 'vouchers':
      return [
        'ALELO ALIMENT',
        'ALELO REFEICAO',
        'ALELO MULTI',
        'NAIP',
        'TICKET ALIMENT',
        'TICKET RESTAURANTE',
        'TICKET FLEX',
        'PLUXE ALIMENT',
        'PLUXE REFEICAO',
        'PLUXE GIFT',
        'PLUXE PREMIUM',
        'VR ALIMENT',
        'VR REFEICAO',
        'UP BRASIL',
        'LECARD',
        'GREEN CARD',
        'VEROCARD',
        'CABAL ALIMENTACAO',
        'GOOD CARD',
        'BIG CARD',
        'VALE CARD',
        'BK CARD',
        'BEN VISA',
        'SINONCARD'
      ]
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

// Classes de célula com fontes maiores, exceto empresa e EC
const getCellClasses = (column) => {
  const large = 'text-xl text-center font-medium transition-colors duration-200'
  const normal = 'text-lg text-center font-medium transition-colors duration-200'
  if (['empresa', 'ec'].includes(column)) {
    return normal + ' text-gray-700 group-hover:text-gray-800'
  }
  return large + ' text-gray-700 group-hover:text-gray-800'
}

// Multi-select helpers
const multiColumns = ['adquirente', 'bandeira', 'modalidade', 'vouchers']
const isMulti = (column) => multiColumns.includes(column)
const getMultiValue = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  return String(val).split(',').map(v => v.trim()).filter(Boolean)
}
const onMultiChange = (event, index, column) => {
  const values = Array.from(event.target.selectedOptions).map(opt => opt.value)
  emit('update-taxa', index, column, values)
}

// Modern multi-select dropdown state
const openMenuIndex = ref(-1)
const openMenuColumn = ref('')
const multiSearch = ref('')
const toggleMultiMenu = (index, column) => {
  if (openMenuIndex.value === index && openMenuColumn.value === column) {
    openMenuIndex.value = -1
    openMenuColumn.value = ''
    multiSearch.value = ''
  } else {
    openMenuIndex.value = index
    openMenuColumn.value = column
    multiSearch.value = ''
  }
}
const closeMultiMenu = () => {
  openMenuIndex.value = -1
  openMenuColumn.value = ''
  multiSearch.value = ''
}
const isMenuOpen = (index, column) => openMenuIndex.value === index && openMenuColumn.value === column
const optionSelected = (taxaRow, column, option) => {
  const list = getMultiValue(taxaRow[column])
  return list.includes(option)
}
const toggleOption = (index, column, option) => {
  const current = getMultiValue(props.taxas[index][column])
  const exists = current.includes(option)
  const next = exists ? current.filter(v => v !== option) : [...current, option]
  emit('update-taxa', index, column, next)
}
const confirmMulti = (index, column) => {
  closeMultiMenu()
}
const filteredOptions = (column) => {
  const all = getOptionsForColumn(column)
  const q = multiSearch.value.trim().toLowerCase()
  if (!q) return all
  return all.filter(o => String(o).toLowerCase().includes(q))
}
const fillerRows = computed(() => {
  const count = props.renderCount - (props.taxas?.length || 0)
  return count > 0 ? Array.from({ length: count }, (_, i) => i + 1) : []
})
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