<template>
  <div class="min-h-[560px] rounded-[28px] bg-gradient-to-b from-white to-[#F7FAFC] p-3 sm:p-4">
    <div class="space-y-4">
      <article
        v-for="(senha, index) in senhas"
        :key="senha.id || index"
        class="overflow-hidden rounded-[24px] border border-[#DCE7F3] bg-white shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <div class="border-b border-[#E3ECF5] bg-gradient-to-r from-[#F8FBFE] via-white to-[#F4F8FC] px-4 py-3">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center rounded-full bg-[#E8F1FB] px-3 py-1 text-xs font-semibold text-[#1f4f77]">
                Registro {{ index + 1 }}
              </span>
              <span v-if="senha.empresa" class="inline-flex items-center rounded-full border border-[#D5E3F1] bg-white px-3 py-1 text-xs text-[#486581]">
                {{ senha.empresa }}
              </span>
              <span v-if="senha.ec" class="inline-flex items-center rounded-full border border-[#D5E3F1] bg-white px-3 py-1 text-xs text-[#486581]">
                EC {{ senha.ec }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <BotaoEditar @click="$emit('editar-senha', index)" />
              <button
                @click="$emit('remover-senha', index)"
                class="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-800"
              >
                Remover
              </button>
            </div>
          </div>
        </div>

        <div class="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <div v-for="column in cardFields" :key="column" class="rounded-2xl border border-[#E3ECF5] bg-[#FBFDFF] p-3">
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#829AB1]">
              {{ columnTitles[column] }}
            </p>

            <div v-if="column === 'id'" class="text-sm font-semibold text-[#102A43]">
              {{ index + 1 }}
            </div>

            <div v-else-if="column === 'empresa'" class="text-sm font-medium text-[#334E68]">
              {{ senha.empresa || '—' }}
            </div>

            <div v-else-if="column === 'ec'" class="text-sm font-medium text-[#334E68]">
              {{ senha.ec ?? '—' }}
            </div>

            <div v-else-if="column === 'portal' && isEditing !== index" class="text-sm font-medium text-[#334E68] break-all">
              <a
                v-if="senha[column]"
                :href="ensureHttp(senha[column])"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 underline"
              >
                {{ senha[column] }}
              </a>
              <span v-else class="text-gray-400">—</span>
            </div>

            <input
              v-else
              type="text"
              :value="senha[column] || ''"
              @input="$emit('update-senha', index, column, $event.target.value)"
              class="w-full rounded-lg border border-[#D5E3F1] bg-white px-3 py-2.5 text-sm text-[#102A43] shadow-sm outline-none transition-colors placeholder:text-[#9AA5B1] focus:border-[#8bb5de] focus:ring-2 focus:ring-[#d9e8f5] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
              :disabled="isEditing !== index"
              autocomplete="off"
              :placeholder="getPlaceholder(column)"
            />
          </div>
        </div>
      </article>

      <div
        v-if="senhas.length === 0"
        class="flex min-h-[240px] items-center justify-center rounded-[24px] border border-dashed border-[#C7D7E8] bg-white text-sm text-[#627D98]"
      >
        Nenhum registro de senha nesta pagina.
      </div>
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

defineEmits([
  'update-senha',
  'remover-senha',
  'editar-senha',
  'drag-start',
  'drag-over',
  'drag-drop',
  'drag-end',
  'start-resize'
])

const preferredOrder = ['id', 'empresa', 'ec', 'adquirente', 'portal', 'login', 'senha', 'banco', 'agencia', 'conta']

const cardFields = computed(() => {
  const visible = Array.isArray(props.visibleColumns) && props.visibleColumns.length
    ? props.visibleColumns
    : preferredOrder

  return preferredOrder.filter(column => visible.includes(column))
})

const getPlaceholder = (column) => {
  switch (column) {
    case 'adquirente':
      return 'Digite o adquirente...'
    case 'portal':
      return 'Digite o portal...'
    case 'login':
      return 'Digite o login...'
    case 'senha':
      return 'Digite a senha...'
    case 'banco':
      return 'Digite o banco...'
    case 'agencia':
      return 'Digite a agencia...'
    case 'conta':
      return 'Digite a conta...'
    default:
      return 'Digite o valor...'
  }
}

const ensureHttp = (u) => {
  if (!u) return ''
  return /^https?:\/\//i.test(u) ? u : `https://${u}`
}
</script>
