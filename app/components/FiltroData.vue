<template>
  <div ref="filtroRef" class="relative w-full min-w-[340px] max-w-[680px]">
    <div class="rounded-2xl border-2 border-[#244b77] bg-white p-3 shadow-lg transition-all duration-300 hover:shadow-xl">
      <button
        type="button"
        class="grid w-full grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center"
        @click="abrirCalendario"
      >
        <div class="date-summary-card text-left">
          <span class="date-summary-icon">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
          </span>
          <div>
            <p class="date-summary-label">Inicio</p>
            <p class="date-summary-value">{{ formatarDataExibicao(dataInicial) }}</p>
          </div>
        </div>

        <div class="date-summary-card text-left">
          <span class="date-summary-icon">
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
          </span>
          <div>
            <p class="date-summary-label">Fim</p>
            <p class="date-summary-value">{{ formatarDataExibicao(dataFinal) }}</p>
          </div>
        </div>

        <span class="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#244b77] md:mx-0">
          <svg class="h-5 w-5 transition-transform duration-200" :class="{ 'rotate-180': calendarioAberto }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" />
          </svg>
        </span>
      </button>
    </div>

    <transition name="calendar-popover">
      <div
        v-if="calendarioAberto"
        class="absolute left-0 top-[calc(100%+0.85rem)] z-50 w-full rounded-[28px] border border-[#244b77] bg-white p-4 shadow-2xl ring-1 ring-slate-100"
      >
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="date-summary-card date-summary-card--active">
            <span class="date-summary-icon">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
            </span>
            <div>
              <p class="date-summary-label">Inicio</p>
              <p class="date-summary-value">{{ formatarDataExibicao(draftInicial) }}</p>
            </div>
          </div>

          <div class="date-summary-card date-summary-card--active">
            <span class="date-summary-icon">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
            </span>
            <div>
              <p class="date-summary-label">Fim</p>
              <p class="date-summary-value">{{ formatarDataExibicao(draftFinal) }}</p>
            </div>
          </div>
        </div>

        <div class="mt-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
          <div class="mb-4 flex items-center justify-between">
            <button type="button" class="calendar-nav-button" @click="mudarMes(-1)">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m15 19-7-7 7-7" />
              </svg>
            </button>

            <div class="text-center">
              <p class="text-base font-semibold text-[#163a5a]">{{ formatarMesAno(mesVisivel) }}</p>
              <p class="text-[11px] uppercase tracking-[0.18em] text-slate-400">Selecione o intervalo</p>
            </div>

            <button type="button" class="calendar-nav-button" @click="mudarMes(1)">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7" />
              </svg>
            </button>
          </div>

          <div class="mb-2 grid grid-cols-7 gap-1 text-center">
            <span v-for="dia in diasSemana" :key="dia" class="py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {{ dia }}
            </span>
          </div>

          <div class="grid grid-cols-7 gap-1">
            <button
              v-for="dia in diasCalendario"
              :key="`${dia.dataCompleta}-${dia.mesAtual}`"
              type="button"
              class="calendar-day"
              :class="{
                'calendar-day--muted': !dia.mesAtual,
                'calendar-day--selected-start': dia.dataCompleta === draftInicial,
                'calendar-day--selected-end': dia.dataCompleta === draftFinal,
                'calendar-day--in-range': dia.estaNoIntervalo,
                'calendar-day--today': dia.hoje && !dia.estaSelecionado
              }"
              @click="selecionarData(dia.dataCompleta)"
            >
              {{ dia.dia }}
            </button>
          </div>

          <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <button type="button" class="calendar-action-link" @click="limparRascunho">Limpar</button>
            <div class="flex items-center gap-2">
              <button type="button" class="calendar-action-secondary" @click="fecharSemSalvar">Cancelar</button>
              <button type="button" class="calendar-action-primary" @click="confirmarSelecao">OK</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

// Manter compatibilidade com props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      dataInicial: '',
      dataFinal: ''
    })
  }
})

const emit = defineEmits(['update:modelValue'])
const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const criarDataLocal = (valor) => {
  if (!valor) return null
  const [ano, mes, dia] = String(valor).split('-').map(Number)
  if (!ano || !mes || !dia) return null
  return new Date(ano, mes - 1, dia)
}

const formatarDataIso = (data) => {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const hoje = new Date()
const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
const filtroRef = ref(null)
const calendarioAberto = ref(false)
const mesVisivel = ref(inicioMesAtual)
const draftInicial = ref(props.modelValue?.dataInicial || '')
const draftFinal = ref(props.modelValue?.dataFinal || '')

const dataInicial = computed({
  get: () => props.modelValue?.dataInicial || '',
  set: (value) => {
    emit('update:modelValue', {
      dataInicial: value,
      dataFinal: props.modelValue?.dataFinal || ''
    })
  }
})

const dataFinal = computed({
  get: () => props.modelValue?.dataFinal || '',
  set: (value) => {
    emit('update:modelValue', {
      dataInicial: props.modelValue?.dataInicial || '',
      dataFinal: value
    })
  }
})

const formatarDataExibicao = (valor) => {
  if (!valor) return 'Selecionar data'
  const data = criarDataLocal(valor)
  return data ? data.toLocaleDateString('pt-BR') : 'Selecionar data'
}

const formatarMesAno = (data) => {
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

const ordenarIntervalo = (inicio, fim) => {
  if (!inicio || !fim) return { inicio, fim }
  return inicio <= fim ? { inicio, fim } : { inicio: fim, fim: inicio }
}

const diasCalendario = computed(() => {
  const dataBase = mesVisivel.value
  const ano = dataBase.getFullYear()
  const mes = dataBase.getMonth()
  const primeiroDiaMes = new Date(ano, mes, 1)
  const ultimoDiaMes = new Date(ano, mes + 1, 0)
  const inicioGrid = new Date(primeiroDiaMes)
  inicioGrid.setDate(inicioGrid.getDate() - inicioGrid.getDay())

  const fimGrid = new Date(ultimoDiaMes)
  fimGrid.setDate(fimGrid.getDate() + (6 - fimGrid.getDay()))

  const dias = []
  const cursor = new Date(inicioGrid)
  const hojeIso = formatarDataIso(hoje)

  while (cursor <= fimGrid) {
    const dataCompleta = formatarDataIso(cursor)
    const estaNoIntervalo = Boolean(
      draftInicial.value &&
      draftFinal.value &&
      dataCompleta >= draftInicial.value &&
      dataCompleta <= draftFinal.value
    )

    dias.push({
      dia: cursor.getDate(),
      dataCompleta,
      mesAtual: cursor.getMonth() === mes,
      hoje: dataCompleta === hojeIso,
      estaNoIntervalo,
      estaSelecionado: dataCompleta === draftInicial.value || dataCompleta === draftFinal.value
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return dias
})

const mudarMes = (direcao) => {
  mesVisivel.value = new Date(mesVisivel.value.getFullYear(), mesVisivel.value.getMonth() + direcao, 1)
}

const sincronizarRascunho = () => {
  draftInicial.value = props.modelValue?.dataInicial || ''
  draftFinal.value = props.modelValue?.dataFinal || ''

  const base = criarDataLocal(draftFinal.value || draftInicial.value)
  mesVisivel.value = base ? new Date(base.getFullYear(), base.getMonth(), 1) : new Date(inicioMesAtual)
}

const abrirCalendario = () => {
  sincronizarRascunho()
  calendarioAberto.value = true
}

const selecionarData = (valor) => {
  if (!draftInicial.value || (draftInicial.value && draftFinal.value)) {
    draftInicial.value = valor
    draftFinal.value = ''
    return
  }

  const { inicio, fim } = ordenarIntervalo(draftInicial.value, valor)
  draftInicial.value = inicio
  draftFinal.value = fim
}

const limparRascunho = () => {
  draftInicial.value = ''
  draftFinal.value = ''
}

const fecharSemSalvar = () => {
  calendarioAberto.value = false
  sincronizarRascunho()
}

const confirmarSelecao = () => {
  dataInicial.value = draftInicial.value
  dataFinal.value = draftFinal.value
  calendarioAberto.value = false
}

const handleClickFora = (event) => {
  if (!filtroRef.value?.contains(event.target)) {
    calendarioAberto.value = false
    sincronizarRascunho()
  }
}

watch(
  () => props.modelValue,
  () => {
    if (!calendarioAberto.value) {
      sincronizarRascunho()
    }
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  if (process.client) {
    document.addEventListener('mousedown', handleClickFora)
  }
})

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('mousedown', handleClickFora)
  }
})
</script>

<style scoped>
.calendar-popover-enter-active,
.calendar-popover-leave-active {
  transition: all 0.18s ease;
}

.calendar-popover-enter-from,
.calendar-popover-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.date-summary-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  min-height: 4.5rem;
  border: 1px solid #dbe4ef;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  padding: 0.95rem 1rem;
  transition: all 0.2s ease;
}

.date-summary-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 10px 24px rgba(15, 109, 255, 0.08);
}

.date-summary-card--active {
  border-color: #d8e7fb;
}

.date-summary-card.text-left {
  border-color: #dbe4ef;
  background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
}

.date-summary-card.text-left:hover {
  border-color: #93c5fd;
  box-shadow: 0 10px 24px rgba(15, 109, 255, 0.08);
}

.date-summary-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.95rem;
  background: #eaf3ff;
  color: #244b77;
  flex-shrink: 0;
}

.date-summary-card.text-left .date-summary-icon {
  background: #eaf3ff;
  color: #244b77;
}

.date-summary-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #94a3b8;
}

.date-summary-card.text-left .date-summary-label {
  color: #94a3b8;
}

.date-summary-value {
  margin-top: 0.2rem;
  font-size: 0.98rem;
  font-weight: 700;
  color: #163a5a;
}

.date-summary-card.text-left .date-summary-value {
  color: #163a5a;
}

.calendar-nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.9rem;
  background: #eff6ff;
  color: #244b77;
  transition: all 0.2s ease;
}

.calendar-nav-button:hover {
  background: #dbeafe;
}

.calendar-day {
  height: 2.35rem;
  border-radius: 0.9rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: #163a5a;
  transition: all 0.18s ease;
}

.calendar-day:hover {
  background: #eff6ff;
}

.calendar-day--muted {
  color: #94a3b8;
}

.calendar-day--in-range {
  background: linear-gradient(135deg, rgba(16, 42, 67, 0.14) 0%, rgba(31, 79, 119, 0.16) 100%);
  color: #163a5a;
}

.calendar-day--selected-start,
.calendar-day--selected-end {
  background: linear-gradient(135deg, #102a43 0%, #163a5a 55%, #1f4f77 100%);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(22, 58, 90, 0.28);
}

.calendar-day--selected-start:hover,
.calendar-day--selected-end:hover {
  background: linear-gradient(135deg, #102a43 0%, #163a5a 55%, #1f4f77 100%);
}

.calendar-day--today {
  border: 1px solid #93c5fd;
  background: #eff6ff;
}

.calendar-action-link {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2563eb;
  transition: color 0.18s ease;
}

.calendar-action-link:hover {
  color: #1d4ed8;
}

.calendar-action-primary {
  border-radius: 9999px;
  background: linear-gradient(135deg, #102a43 0%, #163a5a 55%, #1f4f77 100%);
  color: #ffffff;
  padding: 0.6rem 1.05rem;
  font-size: 0.85rem;
  font-weight: 700;
  transition: all 0.18s ease;
}

.calendar-action-primary:hover {
  box-shadow: 0 12px 24px rgba(22, 58, 90, 0.28);
}

.calendar-action-secondary {
  border-radius: 9999px;
  border: 1px solid #dbe4ef;
  background: #ffffff;
  color: #244b77;
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  transition: all 0.18s ease;
}

.calendar-action-secondary:hover {
  border-color: #93c5fd;
  background: #f8fbff;
}
</style>
