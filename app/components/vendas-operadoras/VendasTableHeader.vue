<template>
  <thead class="bg-slate-100">
    <tr class="border-b border-slate-200">
      <th v-for="(column, index) in visibleColumns" 
          :key="column" 
          class="group relative cursor-pointer px-5 py-4 text-left transition-colors duration-200 hover:bg-slate-100"
          :class="{ 'bg-blue-50': draggedColumn === column }"
          draggable="true"
          @dragstart="onDragStart($event, column, index)"
          @dragover="onDragOver($event)"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd">

        <div class="relative flex items-center gap-2">
          <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition-colors duration-200 group-hover:text-slate-900">
            {{ columnTitles[column] }}
          </div>
          <div class="opacity-0 transition-opacity duration-200 group-hover:opacity-50">
            <svg class="h-3.5 w-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
            </svg>
          </div>
        </div>

        <div 
          class="absolute bottom-0 right-0 top-0 z-10 w-2 cursor-col-resize opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-blue-100"
          @mousedown="startResize($event, column)"
          @click.stop
        ></div>
      </th>
    </tr>
    <tr class="bg-white">
      <th :colspan="visibleColumns.length" class="p-0">
        <div class="h-1.5 bg-gradient-to-r from-[#73c77d] via-[#7ece89] to-[#8ad795]"></div>
      </th>
    </tr>
    <tr class="border-b border-slate-200 bg-white">
      <th
        v-for="column in visibleColumns"
        :key="`filter-${column}`"
        class="px-3 py-3"
      >
        <div class="flex items-center gap-2">
          <input
            v-if="isDateColumn(column)"
            v-model="columnFilters[column]"
            type="date"
            class="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none transition-colors focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <input
            v-else-if="isNumericColumn(column)"
            v-model="columnFilters[column]"
            type="number"
            step="0.01"
            placeholder=">= valor"
            class="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <input
            v-else
            v-model="columnFilters[column]"
            type="text"
            placeholder="Buscar..."
            class="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <button
            v-if="column === visibleColumns[0]"
            type="button"
            class="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            @click="$emit('clear-filters')"
            title="Limpar todos os filtros"
          >
            Limpar
          </button>
        </div>
      </th>
    </tr>
  </thead>
</template>

<script setup>
const props = defineProps({
  visibleColumns: {
    type: Array,
    required: true
  },
  columnTitles: {
    type: Object,
    required: true
  },
  draggedColumn: {
    type: String,
    default: ''
  },
  columnFilters: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'drag-start', 
  'drag-over', 
  'drag-drop', 
  'drag-end',
  'start-resize',
  'clear-filters'
])

const dateColumns = new Set(['dataVenda'])
const numericColumns = new Set([
  'vendaBruta',
  'vendaLiquida',
  'taxaMdr',
  'despesaMdr',
  'numeroParcelas',
  'valorAntecipado',
  'despesasAntecipacao',
  'valorLiquidoAntec'
])
const isDateColumn = (column) => dateColumns.has(column)
const isNumericColumn = (column) => numericColumns.has(column)

// Eventos de drag and drop
const onDragStart = (event, column, index) => {
  emit('drag-start', event, column, index)
}

const onDragOver = (event) => {
  emit('drag-over', event)
}

const onDrop = (event, targetIndex) => {
  emit('drag-drop', event, targetIndex)
}

const onDragEnd = () => {
  emit('drag-end')
}

// Evento de redimensionamento
const startResize = (event, column) => {
  emit('start-resize', event, column)
}
</script>
