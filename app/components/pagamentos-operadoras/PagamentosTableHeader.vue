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
        class="relative px-3 py-3"
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="filter-trigger-button"
            :class="{ 'filter-trigger-button--active': hasActiveFilter(column) }"
            @click.stop="toggleDropdown(column)"
          >
            <span class="truncate">
              {{ getFilterSummary(column) }}
            </span>
            <svg class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <button
            v-if="column === visibleColumns[0]"
            type="button"
            class="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            @click.stop="$emit('clear-filters')"
            title="Limpar todos os filtros"
          >
            Limpar
          </button>
        </div>

        <div
          v-if="openColumn === column"
          class="filter-popover"
          @click.stop
        >
          <input
            v-model="filterModel(column).optionsSearch"
            type="text"
            placeholder="Buscar valor..."
            class="filter-input-base mb-3"
          />

          <div class="mb-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <button type="button" class="hover:text-slate-700" @click="selectAllVisibleOptions(column)">
              Marcar visíveis
            </button>
            <button type="button" class="hover:text-slate-700" @click="clearSelectedValues(column)">
              Limpar seleção
            </button>
          </div>

          <div class="filter-options-list">
            <label
              v-for="option in getVisibleOptions(column)"
              :key="option.value"
              class="filter-option-item"
            >
              <input
                :checked="isValueSelected(column, option.value)"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-[#244b77] focus:ring-[#8bb5de]"
                @change="toggleOptionValue(column, option.value)"
              />
              <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
              <span class="shrink-0 text-[10px] text-slate-400">{{ option.count }}</span>
            </label>
            <p v-if="getVisibleOptions(column).length === 0" class="px-2 py-3 text-xs text-slate-400">
              Nenhum valor encontrado.
            </p>
          </div>

          <div class="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              @click="clearColumnFilter(column)"
            >
              Limpar coluna
            </button>
            <button
              type="button"
              class="rounded-lg bg-[#244b77] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#163a5a]"
              @click="closeDropdown()"
            >
              Fechar
            </button>
          </div>
        </div>
      </th>
    </tr>
  </thead>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

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
  },
  filterOptions: {
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

const openColumn = ref('')

const filterModel = (column) => props.columnFilters[column] || {}

const hasActiveFilter = (column) => {
  const filter = filterModel(column)
  if (!filter) return false

  return Array.isArray(filter.selectedValues) && filter.selectedValues.length > 0
}

const getVisibleOptions = (column) => {
  const filter = filterModel(column)
  const options = props.filterOptions?.[column] || []
  const search = String(filter?.optionsSearch || '').trim().toLowerCase()

  if (!search) return options
  return options.filter((option) => String(option.label || '').toLowerCase().includes(search))
}

const isValueSelected = (column, value) => {
  return (filterModel(column).selectedValues || []).includes(value)
}

const toggleOptionValue = (column, value) => {
  const selectedValues = new Set(filterModel(column).selectedValues || [])
  if (selectedValues.has(value)) {
    selectedValues.delete(value)
  } else {
    selectedValues.add(value)
  }
  filterModel(column).selectedValues = Array.from(selectedValues)
}

const clearSelectedValues = (column) => {
  filterModel(column).selectedValues = []
}

const selectAllVisibleOptions = (column) => {
  filterModel(column).selectedValues = getVisibleOptions(column).map((option) => option.value)
}

const clearColumnFilter = (column) => {
  const filter = filterModel(column)
  if (!filter) return

  filter.mode = 'values'
  filter.optionsSearch = ''
  filter.selectedValues = []
  filter.conditionValue = ''
  filter.conditionValueTo = ''
}

const getFilterSummary = (column) => {
  const filter = filterModel(column)
  if (!filter || !hasActiveFilter(column)) {
    return 'Todos'
  }

  const count = (filter.selectedValues || []).length
  return count === 1 ? '1 valor' : `${count} valores`
}

const closeDropdown = () => {
  openColumn.value = ''
}

const toggleDropdown = (column) => {
  openColumn.value = openColumn.value === column ? '' : column
}

const handleClickOutside = (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest('.filter-popover') || target.closest('.filter-trigger-button')) return
  closeDropdown()
}

onMounted(() => {
  if (process.client) {
    document.addEventListener('click', handleClickOutside)
  }
})

onBeforeUnmount(() => {
  if (process.client) {
    document.removeEventListener('click', handleClickOutside)
  }
})

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

.filter-trigger-button {
  display: inline-flex;
  height: 2.5rem;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  padding: 0 0.875rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.filter-trigger-button:hover {
  background: #f8fafc;
}

.filter-trigger-button--active {
  border-color: rgba(36, 75, 119, 0.35);
  background: #eff6ff;
  color: #163a5a;
  box-shadow: 0 0 0 2px rgba(139, 181, 222, 0.18);
}

.filter-popover {
  position: absolute;
  left: 0.75rem;
  top: calc(100% - 0.25rem);
  z-index: 40;
  width: min(20rem, calc(100vw - 2rem));
  border-radius: 1rem;
  border: 1px solid #d9e2ec;
  background: #ffffff;
  padding: 0.875rem;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
}

.filter-options-list {
  max-height: 15rem;
  overflow-y: auto;
  border-radius: 0.875rem;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0.35rem;
}

.filter-option-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border-radius: 0.75rem;
  padding: 0.55rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
}

.filter-option-item:hover {
  background: rgba(226, 232, 240, 0.75);
}
</style>
