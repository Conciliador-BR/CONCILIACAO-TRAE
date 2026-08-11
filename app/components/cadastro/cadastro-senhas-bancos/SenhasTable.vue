<template>
  <div class="w-full max-w-none overflow-hidden rounded-[28px] border border-[#DCE7F3] bg-white shadow-[0_16px_35px_rgba(16,42,67,0.08)]">
    <div class="w-full overflow-x-auto overflow-y-auto min-h-[560px] max-h-[840px] bg-gradient-to-b from-white to-gray-50/20">
    <table class="w-full min-w-[1680px] table-fixed">
      <thead class="sticky top-0 z-10 bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] shadow-md">
        <tr>
          <th
            v-for="(column, index) in visibleColumns"
            :key="column"
            scope="col"
            class="group relative px-4 sm:px-5 py-4 text-center cursor-pointer transition-all duration-300 hover:bg-white/5"
            :style="{ width: responsiveColumnWidths[column] + 'px' }"
            draggable="true"
            @dragstart="onDragStart($event, column, index)"
            @dragover="onDragOver"
            @drop="onDrop($event, index)"
            @dragend="onDragEnd"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm sm:text-base font-semibold text-white tracking-wide">{{ columnTitles[column] }}</span>
              <div 
                class="w-1 h-full cursor-col-resize"
                @mousedown="startResize($event, column)"
              ></div>
            </div>
          </th>
          <th scope="col" class="group relative px-4 sm:px-5 py-4 text-center cursor-pointer transition-all duration-300 hover:bg-white/5 text-white" :style="{ width: responsiveColumnWidths['acoes'] + 'px' }">
            <span class="text-sm sm:text-base font-semibold text-white tracking-wide">Ações</span>
          </th>
        </tr>
      </thead>
      <tbody class="bg-transparent divide-y divide-gray-200/60">
        <tr v-for="(senha, index) in senhas" :key="senha.id || index" 
            class="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 relative" 
            :class="index % 2 === 0 ? 'bg-white/80' : 'bg-gray-50/50'">
          <td v-for="column in visibleColumns" :key="column" class="px-3 sm:px-4 py-3 text-center border-b border-gray-200/50 group-hover:border-blue-200/70 transition-all duration-300 align-top" :style="{ width: responsiveColumnWidths[column] + 'px' }">
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
              class="w-full rounded-lg border border-[#D5E3F1] bg-[#FBFDFF] px-2.5 py-2 text-xs text-[#102A43] shadow-sm outline-none transition-colors placeholder:text-[#9AA5B1] focus:border-[#8bb5de] focus:bg-white focus:ring-2 focus:ring-[#d9e8f5] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
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
              class="w-full rounded-lg border border-[#D5E3F1] bg-[#FBFDFF] px-2.5 py-2 text-xs text-[#102A43] shadow-sm outline-none transition-colors placeholder:text-[#9AA5B1] focus:border-[#8bb5de] focus:bg-white focus:ring-2 focus:ring-[#d9e8f5] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
              :disabled="isEditing !== index"
              placeholder="Digite o portal..."
            />
            <input 
              v-else-if="column === 'banco'"
              type="text"
              :value="senha[column] || ''"
              @input="$emit('update-senha', index, column, $event.target.value)"
              class="w-full rounded-lg border border-[#D5E3F1] bg-[#FBFDFF] px-2.5 py-2 text-xs text-[#102A43] shadow-sm outline-none transition-colors placeholder:text-[#9AA5B1] focus:border-[#8bb5de] focus:bg-white focus:ring-2 focus:ring-[#d9e8f5] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
              :disabled="isEditing !== index"
              placeholder="Digite o banco..."
            />
            <input 
              v-else-if="column === 'agencia'"
              type="text"
              :value="senha[column] || ''"
              @input="$emit('update-senha', index, column, $event.target.value)"
              class="w-full rounded-lg border border-[#D5E3F1] bg-[#FBFDFF] px-2.5 py-2 text-xs text-[#102A43] shadow-sm outline-none transition-colors placeholder:text-[#9AA5B1] focus:border-[#8bb5de] focus:bg-white focus:ring-2 focus:ring-[#d9e8f5] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
              :disabled="isEditing !== index"
              placeholder="Digite a agência..."
            />
            <input 
              v-else-if="column === 'conta'"
              type="text"
              :value="senha[column] || ''"
              @input="$emit('update-senha', index, column, $event.target.value)"
              class="w-full rounded-lg border border-[#D5E3F1] bg-[#FBFDFF] px-2.5 py-2 text-xs text-[#102A43] shadow-sm outline-none transition-colors placeholder:text-[#9AA5B1] focus:border-[#8bb5de] focus:bg-white focus:ring-2 focus:ring-[#d9e8f5] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
              :disabled="isEditing !== index"
              placeholder="Digite a conta..."
            />
            <input 
              v-else-if="['login', 'senha'].includes(column)"
              type="text"
              :value="senha[column] || ''"
              @input="$emit('update-senha', index, column, $event.target.value)"
              class="w-full rounded-lg border border-[#D5E3F1] bg-[#FBFDFF] px-2.5 py-2 text-xs text-[#102A43] shadow-sm outline-none transition-colors placeholder:text-[#9AA5B1] focus:border-[#8bb5de] focus:bg-white focus:ring-2 focus:ring-[#d9e8f5] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
              :disabled="isEditing !== index"
              autocomplete="off"
              :placeholder="column === 'login'
                ? 'Digite o login...'
                : 'Digite a senha...'"
            />
          </td>
          <td class="px-3 sm:px-4 py-3 whitespace-nowrap text-center align-top">
            <div class="flex items-center justify-center gap-2">
              <BotaoEditar @click="$emit('editar-senha', index)" />
              <button
                @click="$emit('remover-senha', index)"
                class="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-800"
              >
              Remover
              </button>
            </div>
          </td>
        </tr>
      </tbody>
      <tbody>
        <tr v-for="n in fillerRows" :key="'filler-'+n" :class="n % 2 === 0 ? 'bg-white/80' : 'bg-gray-50/50'" class="group">
          <td :colspan="visibleColumns.length + 1" class="px-3 sm:px-4 py-3">&nbsp;</td>
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

// Classes de célula com foco em leitura limpa na tabela de senhas
const getCellClasses = (column) => {
  const large = 'text-xs lg:text-sm leading-relaxed text-center font-medium transition-colors duration-200'
  const normal = 'text-xs lg:text-sm text-center font-medium transition-colors duration-200'
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
.overflow-x-auto::-webkit-scrollbar,
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track,
.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb,
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover,
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
