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
        <tr v-for="(senha, index) in senhas" :key="senha.id || index" 
            class="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 relative" 
            :class="index % 2 === 0 ? 'bg-white/80' : 'bg-gray-50/50'">
          <td v-for="column in visibleColumns" :key="column" class="px-6 py-6 text-center border-b border-gray-200/50 group-hover:border-blue-200/70 transition-all duration-300" :style="{ width: responsiveColumnWidths[column] + 'px' }">
            <div v-if="column === 'id'" :class="getCellClasses('id')">
              {{ index + 1 }}
            </div>
            <div v-else-if="column === 'empresa'" :class="getCellClasses('empresa')">
              {{ senha.empresa || '' }}
            </div>
            <div v-else-if="column === 'ec'" :class="getCellClasses('ec')">
              {{ senha.ec ?? '' }}
            </div>
            <input 
              v-else-if="column === 'adquirente'"
              type="text"
              :value="senha[column] || ''"
              @input="$emit('update-senha', index, column, $event.target.value)"
              class="w-full p-2 border rounded text-lg"
              :disabled="isEditing !== index"
              placeholder="Digite o adquirente..."
            />
            <div v-else-if="column === 'portal' && isEditing !== index" :class="getCellClasses('portal')">
              <a v-if="senha[column]" :href="ensureHttp(senha[column])" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline break-all">
                {{ senha[column] }}
              </a>
              <span v-else class="text-gray-400">—</span>
            </div>
            <input 
              v-else-if="column === 'portal'"
              type="text"
              :value="senha[column] || ''"
              @input="$emit('update-senha', index, column, $event.target.value)"
              class="w-full p-2 border rounded text-lg"
              :disabled="isEditing !== index"
              placeholder="Digite o portal..."
            />
            <input 
              v-else-if="column === 'banco'"
              type="text"
              :value="senha[column] || ''"
              @input="$emit('update-senha', index, column, $event.target.value)"
              class="w-full p-2 border rounded text-lg"
              :disabled="isEditing !== index"
              placeholder="Digite o banco..."
            />
            <input 
              v-else-if="column === 'agencia'"
              type="text"
              :value="senha[column] || ''"
              @input="$emit('update-senha', index, column, $event.target.value)"
              class="w-full p-2 border rounded text-lg"
              :disabled="isEditing !== index"
              placeholder="Digite a agência..."
            />
            <input 
              v-else-if="column === 'conta'"
              type="text"
              :value="senha[column] || ''"
              @input="$emit('update-senha', index, column, $event.target.value)"
              class="w-full p-2 border rounded text-lg"
              :disabled="isEditing !== index"
              placeholder="Digite a conta..."
            />
            <input 
              v-else-if="['login', 'senha'].includes(column)"
              type="text"
              :value="senha[column] || ''"
              @input="$emit('update-senha', index, column, $event.target.value)"
              class="w-full p-2 border rounded text-lg"
              :disabled="isEditing !== index"
              :placeholder="column === 'login' ? 'Digite o login...' : 'Digite a senha...'"
            />
          </td>
          <td class="px-4 py-2 whitespace-nowrap text-sm font-medium">
            <BotaoEditar @click="$emit('editar-senha', index)" />
            <button @click="$emit('remover-senha', index)" class="text-red-600 hover:text-red-900 ml-4">
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
import BotaoEditar from '../cadastro-taxas/BotaoEditar.vue'

const props = defineProps({
  senhas: Array,
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
  'update-senha', 
  'remover-senha', 
  'editar-senha',
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
    default:
      return []
  }
}

// Handlers para os eventos de drag and drop
const onDragStart = (event, column, index) => {
  emit('drag-start', event, column, index)
}

const onDragOver = (event) => {
  emit('drag-over', event)
}

const onDragDrop = (event, targetIndex) => {
  emit('drag-drop', event, targetIndex)
}

const onDragEnd = () => {
  emit('drag-end')
}

const startResize = (event, column) => {
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

const fillerRows = computed(() => {
  const count = props.renderCount - (props.senhas?.length || 0)
  return count > 0 ? Array.from({ length: count }, (_, i) => i + 1) : []
})

const ensureHttp = (u) => {
  if (!u) return ''
  return /^https?:\/\//i.test(u) ? u : `https://${u}`
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