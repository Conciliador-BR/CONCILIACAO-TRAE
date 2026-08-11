<template>
  <div class="min-h-[560px] rounded-[28px] bg-gradient-to-b from-white to-[#F7FAFC] p-3 sm:p-4">
    <div class="space-y-4">
      <article
        v-for="(taxa, index) in taxas"
        :key="taxa.id || index"
        class="overflow-visible rounded-[24px] border border-[#DCE7F3] bg-white shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <div class="border-b border-[#E3ECF5] bg-gradient-to-r from-[#F8FBFE] via-white to-[#F4F8FC] px-4 py-3">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center rounded-full bg-[#E8F1FB] px-3 py-1 text-xs font-semibold text-[#1f4f77]">
                Registro {{ index + 1 }}
              </span>
              <span v-if="taxa.empresa" class="inline-flex items-center rounded-full border border-[#D5E3F1] bg-white px-3 py-1 text-xs text-[#486581]">
                {{ taxa.empresa }}
              </span>
              <span v-if="taxa.ec" class="inline-flex items-center rounded-full border border-[#D5E3F1] bg-white px-3 py-1 text-xs text-[#486581]">
                EC {{ taxa.ec }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <BotaoEditar @click="$emit('editar-taxa', index)" />
              <button
                @click="confirmarRemocao(index)"
                class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-gradient-to-b from-white to-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:from-red-50 hover:to-red-100 hover:text-red-800 hover:shadow-md"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
                Remover
              </button>
            </div>
          </div>
        </div>

        <div class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <div v-for="column in cardFields" :key="column" class="relative rounded-2xl border border-[#E3ECF5] bg-[#FBFDFF] p-3">
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#829AB1]">
              {{ columnTitles[column] }}
            </p>

            <div v-if="column === 'id'" class="text-sm font-semibold text-[#102A43]">
              {{ index + 1 }}
            </div>

            <div v-else-if="column === 'empresa'" class="text-sm font-medium text-[#334E68]">
              {{ taxa.empresa || '—' }}
            </div>

            <div v-else-if="column === 'ec'" class="text-sm font-medium text-[#334E68]">
              {{ taxa.ec ?? '—' }}
            </div>

            <input
              v-else-if="column === 'taxa'"
              type="number"
              step="0.01"
              min="0"
              max="100"
              :value="taxa.percentualTaxa || 0"
              @input="$emit('update-taxa', index, 'percentualTaxa', parseFloat($event.target.value) || 0)"
              class="w-full rounded-lg border border-[#D5E3F1] bg-white px-3 py-2.5 text-sm text-[#102A43] shadow-sm outline-none transition-colors focus:border-[#8bb5de] focus:ring-2 focus:ring-[#d9e8f5] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
              :disabled="isEditing !== index"
              placeholder="Ex: 2.5"
            />

            <input
              v-else-if="['parcelas', 'dataCorte'].includes(column)"
              type="number"
              :step="1"
              :min="1"
              :value="taxa[column] || 1"
              @input="$emit('update-taxa', index, column, parseInt($event.target.value) || 1)"
              class="w-full rounded-lg border border-[#D5E3F1] bg-white px-3 py-2.5 text-sm text-[#102A43] shadow-sm outline-none transition-colors focus:border-[#8bb5de] focus:ring-2 focus:ring-[#d9e8f5] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
              :disabled="isEditing !== index"
            />

            <div v-else-if="isMulti(column)" class="relative">
              <button
                type="button"
                class="w-full rounded-lg border border-[#D5E3F1] bg-white px-3 py-2.5 text-left text-sm text-[#102A43] shadow-sm transition-colors hover:border-[#BFD3E6] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
                :disabled="isEditing !== index"
                @click="toggleMultiMenu(index, column)"
              >
                <span v-if="getMultiValue(taxa[column]).length === 0" class="text-sm text-[#9AA5B1]">Selecione...</span>
                <div v-else class="flex flex-wrap gap-1.5">
                  <span
                    v-for="tag in getMultiValue(taxa[column])"
                    :key="tag"
                    class="rounded-full bg-[#E8F1FB] px-2 py-1 text-[11px] font-medium text-[#1f4f77]"
                  >
                    {{ tag }}
                  </span>
                </div>
              </button>

              <div
                v-if="isMenuOpen(index, column)"
                class="absolute left-0 top-full z-20 mt-2 overflow-auto rounded-xl border border-[#D5E3F1] bg-white shadow-xl"
                :style="{ width: getDropdownSize(column).width + 'px', maxHeight: getDropdownSize(column).height + 'px' }"
              >
                <div class="sticky top-0 border-b border-[#E3ECF5] bg-white px-3 py-3">
                  <input
                    type="text"
                    class="w-full rounded-lg border border-[#D5E3F1] px-3 py-2 text-sm text-[#102A43] outline-none focus:border-[#8bb5de] focus:ring-2 focus:ring-[#d9e8f5]"
                    placeholder="Buscar..."
                    v-model="multiSearch"
                  />
                </div>
                <ul class="py-2">
                  <li
                    v-for="option in filteredOptions(column, taxa)"
                    :key="option"
                    class="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-[#334E68] hover:bg-[#F4F8FC]"
                    @click="toggleOption(index, column, option)"
                  >
                    <input type="checkbox" :checked="optionSelected(taxa, column, option)" />
                    <span>{{ option }}</span>
                  </li>
                </ul>
                <div class="flex justify-end gap-2 border-t border-[#E3ECF5] bg-[#F8FBFE] px-3 py-3">
                  <button class="rounded-lg bg-[#1f4f77] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#163a5a]" @click="confirmMulti()">OK</button>
                  <button class="rounded-lg bg-[#E8EEF5] px-3 py-1.5 text-xs font-semibold text-[#486581] hover:bg-[#DCE7F3]" @click="closeMultiMenu()">Cancelar</button>
                </div>
                <div class="resize-handle" @mousedown="startDropdownResize($event, column)">
                  <span class="resize-dot" style="bottom:2px; right:2px"></span>
                  <span class="resize-dot" style="bottom:2px; right:6px"></span>
                  <span class="resize-dot" style="bottom:6px; right:2px"></span>
                </div>
              </div>
            </div>

            <select
              v-else
              :value="taxa[column]"
              @change="$emit('update-taxa', index, column, $event.target.value)"
              class="w-full rounded-lg border border-[#D5E3F1] bg-white px-3 py-2.5 text-sm text-[#102A43] shadow-sm outline-none transition-colors focus:border-[#8bb5de] focus:ring-2 focus:ring-[#d9e8f5] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
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
          </div>
        </div>
      </article>

      <div
        v-if="taxas.length === 0"
        class="flex min-h-[240px] items-center justify-center rounded-[24px] border border-dashed border-[#C7D7E8] bg-white text-sm text-[#627D98]"
      >
        Nenhum registro de taxa nesta pagina.
      </div>
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

const BANDEIRAS_DEBITO = [
  'VISA DEBITO',
  'MASTER DEBITO',
  'ELO DEBITO',
  'BANESCARD DEBITO',
  'CABAL DEBITO'
]
const BANDEIRAS_CREDITO = [
  'VISA CREDITO',
  'MASTER CREDITO',
  'ELO CREDITO',
  'AMEX',
  'HIPERCARD',
  'BANESCARD CREDITO',
  'SORO CREDITO',
  'DINERS CREDITO',
  'CABAL CREDITO'
]
const BANDEIRAS_VOUCHER = [
  'PLUXEE ALIMENTACAO',
  'PLUXEE REFEICAO',
  'PLUXEE GIFT',
  'PLUXEE PREMIUM',
  'TICKET ALIMENTACAO',
  'TICKET RESTAURANTE',
  'TICKET FLEX',
  'VR ALIMENTACAO',
  'VR REFEICAO',
  'ALELO ALIMENTACAO',
  'ALELO REFEICAO',
  'ALELO BENEFICIOS',
  'COMPROCARD',
  'LECARD',
  'UP BRASIL',
  'EXC CARD',
  'FN CARD',
  'BEN VISA',
  'GOOD CARD',
  'BIG CARD',
  'GREEN CARD',
  'CABAL VOUCHER',
  'FACECARD',
  'VEROCARD',
  'VALECARD',
  'NAIP',
  'NUTRICASH'
]

const preferredOrder = ['id', 'empresa', 'ec', 'adquirente', 'bandeira', 'modalidade', 'vouchers', 'parcelas', 'taxa', 'dataCorte']

const cardFields = computed(() => {
  const visible = Array.isArray(props.visibleColumns) && props.visibleColumns.length
    ? props.visibleColumns
    : preferredOrder

  return preferredOrder.filter(column => visible.includes(column))
})

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
      return [...BANDEIRAS_DEBITO, ...BANDEIRAS_CREDITO, ...BANDEIRAS_VOUCHER]
    case 'modalidade':
      return ['DEBITO', 'PRE-PAGO DEBITO', 'CREDITO', 'PRE-PAGO CREDITO', 'PARCELADO', 'PIX', 'VOUCHERS']
    case 'vouchers':
      return [
        'ALELO ALIMENT',
        'ALELO REFEICAO',
        'ALELO MULTI',
        'NAIP',
        'TICKET ALIMENT',
        'TICKET RESTAURANTE',
        'TICKET FLEX',
        'PLUXEE ALIMENT',
        'PLUXEE REFEICAO',
        'PLUXEE GIFT',
        'PLUXEE PREMIUM',
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

const multiColumns = ['adquirente', 'bandeira', 'modalidade', 'vouchers']
const isMulti = (column) => multiColumns.includes(column)

const getMultiValue = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  return String(val).split(',').map(v => v.trim()).filter(Boolean)
}

const openMenuIndex = ref(-1)
const openMenuColumn = ref('')
const multiSearch = ref('')

const toggleMultiMenu = (index, column) => {
  if (openMenuIndex.value === index && openMenuColumn.value === column) {
    openMenuIndex.value = -1
    openMenuColumn.value = ''
    multiSearch.value = ''
    return
  }

  openMenuIndex.value = index
  openMenuColumn.value = column
  multiSearch.value = ''
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

const confirmMulti = () => {
  closeMultiMenu()
}

const filteredOptions = (column, taxaRow) => {
  let all = getOptionsForColumn(column)

  if (column === 'bandeira') {
    const mods = getMultiValue(taxaRow?.modalidade)
    const wantsDebito = mods.some(m => m.includes('DEBITO'))
    const wantsCredito = mods.some(m => m.includes('CREDITO') || m.includes('PARCELADO'))
    const wantsVoucher = mods.some(m => m.includes('VOUCHERS'))
    const pool = []

    if (wantsDebito) pool.push(...BANDEIRAS_DEBITO)
    if (wantsCredito) pool.push(...BANDEIRAS_CREDITO)
    if (wantsVoucher) pool.push(...BANDEIRAS_VOUCHER)

    if (pool.length) {
      all = Array.from(new Set(pool))
    }
  }

  const q = multiSearch.value.trim().toLowerCase()
  if (!q) return all
  return all.filter(o => String(o).toLowerCase().includes(q))
}

const dropdownSizes = ref({})

const getDropdownSize = (column) => {
  const saved = dropdownSizes.value[column]
  return {
    width: saved?.width || 320,
    height: saved?.height || 260
  }
}

const resizingDropdown = ref(false)
const resizeColumn = ref('')
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

const startDropdownResize = (event, column) => {
  event.preventDefault()
  event.stopPropagation()

  const size = getDropdownSize(column)
  resizingDropdown.value = true
  resizeColumn.value = column
  resizeStart.value = { x: event.clientX, y: event.clientY, width: size.width, height: size.height }

  document.addEventListener('mousemove', onDropdownResize)
  document.addEventListener('mouseup', stopDropdownResize)
  document.body.style.cursor = 'se-resize'
  document.body.style.userSelect = 'none'
}

const onDropdownResize = (event) => {
  if (!resizingDropdown.value || !resizeColumn.value) return

  const dx = event.clientX - resizeStart.value.x
  const dy = event.clientY - resizeStart.value.y

  dropdownSizes.value[resizeColumn.value] = {
    width: Math.max(240, resizeStart.value.width + dx),
    height: Math.max(180, resizeStart.value.height + dy)
  }
  dropdownSizes.value = { ...dropdownSizes.value }
}

const stopDropdownResize = () => {
  if (!resizingDropdown.value) return

  resizingDropdown.value = false
  resizeColumn.value = ''

  document.removeEventListener('mousemove', onDropdownResize)
  document.removeEventListener('mouseup', stopDropdownResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''

  if (import.meta.client) {
    localStorage.setItem('taxas-dropdown-sizes', JSON.stringify(dropdownSizes.value))
  }
}

onMounted(() => {
  const saved = import.meta.client ? localStorage.getItem('taxas-dropdown-sizes') : null
  if (saved) {
    dropdownSizes.value = JSON.parse(saved)
  }
})

const confirmarRemocao = (index) => {
  if (!import.meta.client) return
  const confirmado = window.confirm('Deseja realmente remover este cadastro?')
  if (confirmado) {
    emit('remover-taxa', index)
  }
}
</script>

<style scoped>
.resize-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  right: 4px;
  bottom: 4px;
  cursor: se-resize;
}

.resize-dot {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #9ca3af;
  border-radius: 1px;
}
</style>
