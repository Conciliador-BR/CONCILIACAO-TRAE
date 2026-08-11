<template>
  <div class="min-h-[560px] rounded-[28px] bg-gradient-to-b from-white to-[#F7FAFC] p-3 sm:p-4">
    <div class="space-y-5">
      <section
        v-for="group in groupedSenhas"
        :key="group.key"
        class="space-y-4"
      >
        <div class="rounded-[24px] border border-[#DCE7F3] bg-gradient-to-r from-[#F8FBFE] via-white to-[#F4F8FC] px-4 py-4 shadow-sm">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                  :class="group.key === 'AUTORIZADORA' ? 'bg-[#E8F1FB] text-[#1f4f77]' : 'bg-[#EAF7EE] text-[#1F7A35]'"
                >
                  {{ group.title }}
                </span>
                <span class="inline-flex items-center rounded-full border border-[#D5E3F1] bg-white px-3 py-1 text-xs text-[#486581]">
                  {{ group.items.length }} {{ group.items.length === 1 ? 'registro' : 'registros' }}
                </span>
              </div>
              <p class="mt-2 text-sm text-[#486581]">{{ group.description }}</p>
            </div>
          </div>
        </div>

        <article
          v-for="item in group.items"
          :key="item.senha.id || item.absoluteIndex"
          class="overflow-hidden rounded-[24px] border border-[#DCE7F3] bg-white shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <div class="border-b border-[#E3ECF5] bg-gradient-to-r from-[#F8FBFE] via-white to-[#F4F8FC] px-4 py-3">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center rounded-full bg-[#E8F1FB] px-3 py-1 text-xs font-semibold text-[#1f4f77]">
                    Registro {{ item.absoluteIndex + 1 }}
                  </span>
                  <span v-if="item.senha.empresa" class="inline-flex items-center rounded-full border border-[#D5E3F1] bg-white px-3 py-1 text-xs text-[#486581]">
                    {{ item.senha.empresa }}
                  </span>
                  <span v-if="item.senha.ec" class="inline-flex items-center rounded-full border border-[#D5E3F1] bg-white px-3 py-1 text-xs text-[#486581]">
                    EC {{ item.senha.ec }}
                  </span>
                </div>

                <div class="rounded-2xl border border-[#D5E3F1] bg-white px-4 py-3 shadow-sm">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#829AB1]">Adquirente em destaque</p>
                  <p class="mt-1 text-lg sm:text-xl font-bold tracking-tight text-[#102A43]">
                    {{ getAdquirenteDestaque(item.senha) }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <BotaoEditar @click="$emit('editar-senha', item.absoluteIndex)" />
                <button
                  @click="confirmarRemocao(item.absoluteIndex)"
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
            <div v-for="column in cardFields" :key="column" class="rounded-2xl border border-[#E3ECF5] bg-[#FBFDFF] p-3">
              <p class="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#829AB1]">
                {{ columnTitles[column] }}
              </p>

              <div v-if="column === 'id'" class="text-sm font-semibold text-[#102A43]">
                {{ item.absoluteIndex + 1 }}
              </div>

              <div v-else-if="column === 'empresa'" class="text-sm font-medium text-[#334E68]">
                {{ item.senha.empresa || '—' }}
              </div>

              <div v-else-if="column === 'ec'" class="text-sm font-medium text-[#334E68]">
                {{ item.senha.ec ?? '—' }}
              </div>

              <div v-else-if="column === 'portal' && isEditing !== item.absoluteIndex" class="text-sm font-medium text-[#334E68] break-all">
                <a
                  v-if="item.senha[column]"
                  :href="ensureHttp(item.senha[column])"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 underline"
                >
                  {{ item.senha[column] }}
                </a>
                <span v-else class="text-gray-400">—</span>
              </div>

              <input
                v-else
                type="text"
                :value="item.senha[column] || ''"
                @input="$emit('update-senha', item.absoluteIndex, column, $event.target.value)"
                class="w-full rounded-lg border border-[#D5E3F1] bg-white px-3 py-2.5 text-sm text-[#102A43] shadow-sm outline-none transition-colors placeholder:text-[#9AA5B1] focus:border-[#8bb5de] focus:ring-2 focus:ring-[#d9e8f5] disabled:bg-[#F4F7FB] disabled:text-[#7B8794]"
                :disabled="isEditing !== item.absoluteIndex"
                autocomplete="off"
                :placeholder="getPlaceholder(column)"
              />
            </div>
          </div>
        </article>
      </section>

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
  pageStartIndex: {
    type: Number,
    default: 0
  },
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

const preferredOrder = ['id', 'empresa', 'ec', 'adquirente', 'portal', 'login', 'senha', 'banco', 'agencia', 'conta']
const groupMeta = {
  AUTORIZADORA: {
    title: 'Autorizadoras',
    description: 'Acessos principais de adquirentes e operadoras.'
  },
  VOUCHERS: {
    title: 'Vouchers',
    description: 'Acessos separados para beneficios, vouchers e convenios.'
  }
}

const cardFields = computed(() => {
  const visible = Array.isArray(props.visibleColumns) && props.visibleColumns.length
    ? props.visibleColumns
    : preferredOrder

  return preferredOrder.filter(column => visible.includes(column))
})

const inferirGrupoCadastro = (senha) => {
  const grupo = String(senha?.grupoCadastro || '').trim().toUpperCase()
  if (grupo === 'AUTORIZADORA' || grupo === 'VOUCHERS') return grupo
  return 'AUTORIZADORA'
}

const groupedSenhas = computed(() => {
  const items = (props.senhas || []).map((senha, localIndex) => ({
    senha,
    localIndex,
    absoluteIndex: props.pageStartIndex + localIndex,
    group: inferirGrupoCadastro(senha)
  }))

  return ['AUTORIZADORA', 'VOUCHERS']
    .map(key => ({
      key,
      title: groupMeta[key].title,
      description: groupMeta[key].description,
      items: items.filter(item => item.group === key)
    }))
    .filter(group => group.items.length > 0)
})

const getAdquirenteDestaque = (senha) => {
  const adquirente = String(senha?.adquirente || '').trim()
  return adquirente || 'Nova credencial'
}

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

const confirmarRemocao = (index) => {
  if (!import.meta.client) return
  const confirmado = window.confirm('Deseja realmente remover este cadastro?')
  if (confirmado) {
    emit('remover-senha', index)
  }
}
</script>
