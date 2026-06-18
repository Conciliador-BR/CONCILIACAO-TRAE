<template>
  <thead class="bg-gradient-to-br from-white via-[#fcfefc] to-[#f5fbf6]">
    <tr class="border-b border-[#244b77]/20">
      <th v-for="(column, index) in visibleColumns" 
          :key="column" 
          class="group relative cursor-pointer px-5 py-4 text-left transition-colors duration-200 hover:bg-[#f4fbf5]"
          :class="{ 'bg-[#effbf1]': draggedColumn === column }"
          draggable="true"
          @dragstart="onDragStart($event, column, index)"
          @dragover="onDragOver($event)"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd">

        <div class="relative flex items-center gap-2">
          <div class="vendas-header-title text-xs font-semibold uppercase tracking-[0.18em] text-[#244b77] transition-colors duration-200 group-hover:text-[#163a5a]">
            {{ columnTitles[column] }}
          </div>
          <div class="opacity-0 transition-opacity duration-200 group-hover:opacity-50">
            <svg class="h-3.5 w-3.5 text-[#73c77d]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
            </svg>
          </div>
        </div>

        <div 
          class="absolute bottom-0 right-0 top-0 z-10 w-2 cursor-col-resize opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-[#effbf1]"
          @mousedown="startResize($event, column)"
          @click.stop
        ></div>
      </th>
    </tr>
    <tr class="bg-white/95">
      <th :colspan="visibleColumns.length" class="p-0">
        <div class="h-1.5 bg-gradient-to-r from-[#73c77d] via-[#7ece89] to-[#8ad795]"></div>
      </th>
    </tr>
    <tr class="border-b border-[#244b77]/15 bg-white/90">
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
            class="filter-input-base"
          />
          <input
            v-else-if="isNumericColumn(column)"
            v-model="columnFilters[column]"
            type="number"
            step="0.01"
            placeholder=">= valor"
            class="filter-input-base"
          />
          <input
            v-else
            v-model="columnFilters[column]"
            type="text"
            placeholder="Buscar..."
            class="filter-input-base"
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

<style scoped>
.vendas-header-title {
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.95), 0 1px 2px rgba(36, 75, 119, 0.14);
}

.filter-input-base {
  height: 2.5rem;
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 0 0.875rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.filter-input-base::placeholder {
  color: #94a3b8;
  font-weight: 600;
}

.filter-input-base:focus {
  border-color: #cbd5e1;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.18);
}

.filter-input-base[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.filter-input-base[type='number']::-webkit-outer-spin-button,
.filter-input-base[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
