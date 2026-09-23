<template>
  <section class="calendar-shell overflow-hidden rounded-[32px] border border-[#DCE7F3] bg-white shadow-[0_20px_48px_rgba(16,42,67,0.08)]">
    <header class="border-b border-[#E7EFF8] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] p-5 lg:p-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[#5e92cb]">
            Calendario de Recebimentos
          </p>
          <h3 class="mt-2 text-3xl font-black tracking-tight text-[#102A43]">
            {{ monthLabel }}
          </h3>
          <p class="mt-2 max-w-2xl text-sm text-slate-500">
            Visao mensal consolidada com cards por dia, totais do periodo e detalhamento por adquirente ao selecionar uma data.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-2xl border border-[#D7E6F5] bg-white px-3 py-2 text-sm font-bold text-[#244B77] transition hover:-translate-y-0.5 hover:border-[#8bb5de] hover:bg-[#F7FBFF]"
            aria-label="Mes anterior"
            @click="goToPreviousMonth"
          >
            &lt;
          </button>
          <button
            type="button"
            class="rounded-2xl border border-[#D7E6F5] bg-white px-4 py-2 text-sm font-bold text-[#244B77] transition hover:-translate-y-0.5 hover:border-[#8bb5de] hover:bg-[#F7FBFF]"
            @click="goToCurrentMonth"
          >
            Hoje
          </button>
          <button
            type="button"
            class="rounded-2xl border border-[#D7E6F5] bg-white px-3 py-2 text-sm font-bold text-[#244B77] transition hover:-translate-y-0.5 hover:border-[#8bb5de] hover:bg-[#F7FBFF]"
            aria-label="Proximo mes"
            @click="goToNextMonth"
          >
            &gt;
          </button>
          <button
            type="button"
            class="rounded-2xl bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-4 py-2 text-sm font-black text-white shadow-[0_12px_28px_rgba(36,75,119,0.2)] transition hover:-translate-y-0.5"
            @click="emit('export', exportRecords)"
          >
            Exportar
          </button>
        </div>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Previsto no mes</p>
          <p class="mt-2 text-2xl font-black text-emerald-700">{{ formatCurrency(monthTotals.previsto) }}</p>
        </div>
        <div class="rounded-[24px] border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Depositado</p>
          <p class="mt-2 text-2xl font-black text-sky-700">{{ formatCurrency(monthTotals.deposito) }}</p>
        </div>
        <div class="rounded-[24px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Debitos</p>
          <p class="mt-2 text-2xl font-black text-orange-700">{{ formatCurrency(monthTotals.debitos) }}</p>
        </div>
        <div class="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Saldo</p>
          <p class="mt-2 text-2xl font-black" :class="monthTotals.saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'">
            {{ formatCurrency(monthTotals.saldo) }}
          </p>
        </div>
      </div>
    </header>

    <div class="border-b border-[#E7EFF8] bg-[#FAFCFF] px-5 py-3">
      <div class="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]">
        <span class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">Ja recebi</span>
        <span class="rounded-full border border-[#D8E4F1] bg-[#F4F8FC] px-3 py-1 text-[#5F7892]">Previsto</span>
        <span class="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">Divergente</span>
        <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-500">Nada a receber</span>
      </div>
    </div>

    <div class="overflow-x-auto bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4">
      <div class="min-w-[1040px] rounded-[28px] border border-[#E6EEF7] bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div class="grid grid-cols-7 gap-3">
          <div
            v-for="day in weekDays"
            :key="day"
            class="rounded-2xl bg-[#F5F9FD] px-3 py-3 text-center text-xs font-black uppercase tracking-[0.2em] text-[#5f7f9f]"
          >
            {{ day }}
          </div>
        </div>

        <div class="mt-3 grid grid-cols-7 gap-3">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            type="button"
            class="relative min-h-[196px] rounded-[26px] border p-4 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#8bb5de]"
            :class="[
              day.isCurrentMonth ? statusClasses(day.status.key).card : 'border-transparent bg-slate-50 text-slate-300',
              day.records.length > 0 ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(36,75,119,0.12)]' : 'cursor-default'
            ]"
            @click="openDayDetails(day)"
          >
            <div
              v-if="day.isCurrentMonth"
              class="absolute inset-x-4 top-0 h-1 rounded-b-full"
              :class="statusClasses(day.status.key).accent"
            />
            <div v-if="day.isToday && day.isCurrentMonth" class="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-[#5e92cb]" />

            <div class="flex items-start justify-between gap-3">
              <div class="min-w-[46px]">
                <p class="tabular-nums text-[2.05rem] font-black leading-none tracking-[-0.045em] text-[#102A43]">
                  {{ day.dayNumber }}
                </p>
                <p class="mt-1 text-[11px] font-extrabold uppercase tracking-[0.18em]" :class="day.isCurrentMonth ? 'text-[#75879b]' : 'text-slate-300'">
                  {{ day.weekday }}
                </p>
              </div>

              <span
                v-if="day.isCurrentMonth"
                class="rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em]"
                :class="statusClasses(day.status.key).badge"
              >
                {{ day.status.label }}
              </span>
            </div>

            <div v-if="day.isCurrentMonth" class="mt-5 space-y-2.5">
              <div class="rounded-2xl border border-[#E9EEF4] bg-white/92 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A4B5]">Previsto</p>
                <strong class="mt-1 block tabular-nums text-[1.42rem] font-black leading-none tracking-[-0.03em] text-[#16324f]">{{ formatCurrency(day.totalPrevisto) }}</strong>
              </div>
              <div class="rounded-2xl border border-[#E9EEF4] bg-white/92 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A4B5]">Deposito</p>
                <strong class="mt-1 block tabular-nums text-[1.42rem] font-black leading-none tracking-[-0.03em] text-[#16324f]">{{ formatCurrency(day.totalDeposito) }}</strong>
              </div>
              <p v-if="day.records.length > 0" class="pt-0.5 text-[11px] font-semibold text-[#7f8fa1]">
                {{ day.records.length }} registro{{ day.records.length > 1 ? 's' : '' }} no dia
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="selectedDate"
      class="fixed inset-0 z-50 flex bg-slate-950/35 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      @click.self="closeDayDetails"
    >
      <aside class="ml-auto flex h-full w-full max-w-5xl flex-col overflow-hidden border-l border-[#DCE7F3] bg-[#F9FBFE] shadow-2xl">
        <header class="border-b border-[#E5EEF8] bg-white p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.24em] text-[#5e92cb]">Detalhamento do dia</p>
              <h3 class="mt-1 text-2xl font-black text-[#102A43]">{{ formatDisplayDate(selectedDate.key) }}</h3>
              <p class="mt-1 text-sm text-slate-500">
                {{ selectedDayRows.length }} linha{{ selectedDayRows.length > 1 ? 's' : '' }} por bandeira
                · {{ selectedDayDepositos.length }} deposito{{ selectedDayDepositos.length > 1 ? 's' : '' }} identificado{{ selectedDayDepositos.length > 1 ? 's' : '' }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-2xl border border-[#D7E6F5] bg-white px-4 py-2 text-sm font-bold text-[#244B77] transition hover:bg-[#F7FBFF]"
              @click="closeDayDetails"
            >
              Fechar
            </button>
          </div>
        </header>

        <div class="grid gap-3 border-b border-[#E5EEF8] bg-[#FAFCFF] p-4 sm:grid-cols-4">
          <div class="rounded-[22px] border border-emerald-100 bg-white p-3">
            <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Previsto</p>
            <p class="mt-1 text-lg font-black text-emerald-700">{{ formatCurrency(selectedDate.totalPrevisto) }}</p>
          </div>
          <div class="rounded-[22px] border border-sky-100 bg-white p-3">
            <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Deposito</p>
            <p class="mt-1 text-lg font-black text-sky-700">{{ formatCurrency(selectedDate.totalDeposito) }}</p>
          </div>
          <div class="rounded-[22px] border border-orange-100 bg-white p-3">
            <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Debitos</p>
            <p class="mt-1 text-lg font-black text-orange-700">{{ formatCurrency(selectedDate.totalDebitos) }}</p>
          </div>
          <div class="rounded-[22px] border border-slate-200 bg-white p-3">
            <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Saldo</p>
            <p class="mt-1 text-lg font-black" :class="selectedDate.totalSaldo >= 0 ? 'text-emerald-700' : 'text-rose-700'">
              {{ formatCurrency(selectedDate.totalSaldo) }}
            </p>
          </div>
        </div>

        <div class="flex-1 overflow-auto p-5">
          <div class="mb-4 flex flex-wrap gap-2 rounded-[22px] border border-[#DCE7F3] bg-white p-2 shadow-sm">
            <button
              v-for="tab in detailTabs"
              :key="tab.key"
              type="button"
              class="rounded-2xl px-4 py-2 text-sm font-black transition"
              :class="activeDetailTab === tab.key ? 'bg-[#102A43] text-white shadow-[0_10px_24px_rgba(16,42,67,0.18)]' : 'text-[#52708f] hover:bg-[#F4F8FC]'"
              @click="activeDetailTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <div v-if="activeDetailTab === 'bandeiras'" class="overflow-x-auto rounded-[24px] border border-[#DCE7F3] bg-white shadow-sm">
            <table class="w-full min-w-[1060px] text-sm">
              <thead class="bg-[#F8FBFF]">
                <tr>
                  <th class="px-4 py-3 text-left font-black uppercase tracking-[0.14em] text-slate-500">Adquirente</th>
                  <th class="px-4 py-3 text-left font-black uppercase tracking-[0.14em] text-slate-500">Bandeira / Modalidade</th>
                  <th class="px-4 py-3 text-right font-black uppercase tracking-[0.14em] text-slate-500">Valor Previsto</th>
                  <th class="px-4 py-3 text-right font-black uppercase tracking-[0.14em] text-slate-500">Debitos / Taxas</th>
                  <th class="px-4 py-3 text-right font-black uppercase tracking-[0.14em] text-slate-500">Valor Depositado</th>
                  <th class="px-4 py-3 text-right font-black uppercase tracking-[0.14em] text-slate-500">Saldo / Divergencia</th>
                  <th class="px-4 py-3 text-center font-black uppercase tracking-[0.14em] text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, index) in selectedDayRows"
                  :key="row.key"
                  class="border-t border-[#EEF3F8]"
                  :class="index % 2 === 0 ? 'bg-white' : 'bg-[#FBFDFF]'"
                >
                  <td class="px-4 py-3 font-bold text-[#102A43]">{{ row.adquirente }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full border border-[#DCE7F3] bg-[#F7FBFF] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#244B77]">
                      {{ row.bandeira }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right font-bold text-emerald-700">{{ formatCurrency(row.previsto) }}</td>
                  <td class="px-4 py-3 text-right font-bold text-orange-700">{{ formatCurrency(row.debitos) }}</td>
                  <td class="px-4 py-3 text-right font-bold text-[#244B77]">{{ formatCurrency(row.deposito) }}</td>
                  <td class="px-4 py-3 text-right font-bold" :class="row.saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'">
                    {{ formatCurrency(row.saldo) }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="rounded-full border px-3 py-1 text-xs font-black" :class="statusClasses(row.status.key).badge">
                      {{ row.status.label }}
                    </span>
                  </td>
                </tr>
                <tr v-if="selectedDayRows.length === 0">
                  <td colspan="7" class="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                    Nenhuma bandeira encontrada para este dia.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="overflow-x-auto rounded-[24px] border border-[#DCE7F3] bg-white shadow-sm">
            <table class="w-full min-w-[980px] text-sm">
              <thead class="bg-[#F8FBFF]">
                <tr>
                  <th class="px-4 py-3 text-left font-black uppercase tracking-[0.14em] text-slate-500">Adquirente</th>
                  <th class="px-4 py-3 text-left font-black uppercase tracking-[0.14em] text-slate-500">Bandeira / Modalidade</th>
                  <th class="px-4 py-3 text-left font-black uppercase tracking-[0.14em] text-slate-500">Banco / Agencia / Conta</th>
                  <th class="px-4 py-3 text-left font-black uppercase tracking-[0.14em] text-slate-500">Nomenclatura Encontrada</th>
                  <th class="px-4 py-3 text-right font-black uppercase tracking-[0.14em] text-slate-500">Valor do Deposito</th>
                  <th class="px-4 py-3 text-left font-black uppercase tracking-[0.14em] text-slate-500">NSU / Comprovante / ID</th>
                  <th class="px-4 py-3 text-center font-black uppercase tracking-[0.14em] text-slate-500">Status Bancario</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(deposito, index) in selectedDayDepositos"
                  :key="deposito.key"
                  class="border-t border-[#EEF3F8]"
                  :class="index % 2 === 0 ? 'bg-white' : 'bg-[#FBFDFF]'"
                >
                  <td class="px-4 py-3 font-bold text-[#102A43]">{{ deposito.adquirente }}</td>
                  <td class="px-4 py-3">
                    <span class="rounded-full border border-[#DCE7F3] bg-[#F7FBFF] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[#244B77]">
                      {{ deposito.bandeira || '-' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-semibold text-slate-600">{{ deposito.bancoConta }}</td>
                  <td class="px-4 py-3">
                    <div class="font-bold text-[#244B77]">{{ deposito.nomenclaturaBanco || '-' }}</div>
                    <div v-if="deposito.nomenclaturaBase && deposito.nomenclaturaBase !== deposito.nomenclaturaBanco" class="text-xs font-semibold text-slate-500">
                      Base: {{ deposito.nomenclaturaBase }}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right font-bold text-[#244B77]">{{ formatCurrency(deposito.valor) }}</td>
                  <td class="px-4 py-3 font-mono text-xs font-bold text-slate-500">{{ deposito.comprovante || '-' }}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                      {{ deposito.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="selectedDayDepositos.length === 0">
                  <td colspan="7" class="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                    Nenhum deposito identificado no extrato para este dia.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['export'])

const weekDays = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']
const detailTabs = [
  { key: 'bandeiras', label: 'Resumo por Bandeira' },
  { key: 'depositos', label: 'Extrato de Depositos' }
]
const selectedDate = ref(null)
const currentMonth = ref(new Date())
const activeDetailTab = ref('bandeiras')

const groupedRecords = computed(() => groupDataByDate(props.records))
const selectedDayRows = computed(() => buildRowsByBandeira(selectedDate.value?.records || []))
const selectedDayDepositos = computed(() => buildDepositosExtrato(selectedDate.value?.records || []))

const monthLabel = computed(() => {
  return currentMonth.value.toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric'
  }).replace('.', '').replace(/^./, (char) => char.toUpperCase())
})

const monthTotals = computed(() => {
  return calendarDays.value
    .filter(day => day.isCurrentMonth)
    .reduce((totals, day) => {
      totals.previsto += day.totalPrevisto
      totals.deposito += day.totalDeposito
      totals.debitos += day.totalDebitos
      totals.saldo += day.totalSaldo
      return totals
    }, { previsto: 0, deposito: 0, debitos: 0, saldo: 0 })
})

const exportRecords = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  return props.records.filter(record => {
    const date = parseRecordDate(record.data)
    return date && date.getFullYear() === year && date.getMonth() === month
  })
})

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  const firstDate = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0)
  const firstWeekday = normalizeWeekday(firstDate.getDay())
  const totalSlots = Math.ceil((firstWeekday + lastDate.getDate()) / 7) * 7
  const startDate = new Date(year, month, 1 - firstWeekday)

  return Array.from({ length: totalSlots }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)

    const key = toDateKey(date)
    const grouped = groupedRecords.value[key] || createEmptyGroup(key)
    const isCurrentMonth = date.getMonth() === month
    const day = {
      ...grouped,
      date,
      dayNumber: date.getDate(),
      weekday: weekDays[normalizeWeekday(date.getDay())],
      isCurrentMonth,
      isToday: key === toDateKey(new Date())
    }

    day.status = getConsolidatedStatus(day)
    return day
  })
})

watch(
  () => props.records,
  (records) => {
    if (!records?.length) return

    const currentMonthHasData = records.some(record => {
      const date = parseRecordDate(record.data)
      return date &&
        date.getFullYear() === currentMonth.value.getFullYear() &&
        date.getMonth() === currentMonth.value.getMonth()
    })

    if (currentMonthHasData) return

    const firstDate = records.map(record => parseRecordDate(record.data)).find(Boolean)
    if (firstDate) {
      currentMonth.value = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
    }
  },
  { immediate: true }
)

function groupDataByDate(records = []) {
  return records.reduce((groups, record) => {
    const key = toDateKey(record.data)
    if (!key) return groups

    if (!groups[key]) {
      groups[key] = createEmptyGroup(key)
    }

    groups[key].records.push(record)
    groups[key].totalPrevisto += Number(record.previsto || 0)
    groups[key].totalDeposito += Number(record.deposito || 0)
    groups[key].totalDebitos += getRecordDebitos(record)
    groups[key].totalSaldo += Number(record.saldoConciliacao || 0)

    return groups
  }, {})
}

function createEmptyGroup(key) {
  return {
    key,
    records: [],
    totalPrevisto: 0,
    totalDeposito: 0,
    totalDebitos: 0,
    totalSaldo: 0
  }
}

function getConsolidatedStatus(day) {
  const hasValue = Math.abs(day.totalPrevisto) > 0.01 ||
    Math.abs(day.totalDeposito) > 0.01 ||
    Math.abs(day.totalSaldo) > 0.01
  const isFuture = day.key > toDateKey(new Date())

  if (!hasValue) {
    return { key: 'empty', label: 'NADA A RECEBER' }
  }

  if (isFuture && day.totalPrevisto > 0 && day.totalDeposito <= 0) {
    return { key: 'forecast', label: 'PREVISTO' }
  }

  if (Math.abs(day.totalPrevisto - day.totalDeposito) > 0.01 || Math.abs(day.totalSaldo) > 0.01) {
    return { key: 'divergent', label: 'DIVERGENTE' }
  }

  if (day.totalDeposito > 0) {
    return { key: 'received', label: 'JA RECEBI' }
  }

  return { key: 'forecast', label: 'PREVISTO' }
}

function getRecordStatus(record) {
  const status = String(record?.status || '').toLowerCase()
  if (status === 'consistente' || status === 'conciliado') return { key: 'received', label: 'Conciliado' }
  if (status === 'inconsistente' || status === 'divergente') return { key: 'divergent', label: 'Divergente' }

  const previsto = Number(record?.previsto || 0)
  const deposito = Number(record?.deposito || 0)
  const saldo = Number(record?.saldoConciliacao || 0)

  if (!previsto && !deposito && !saldo) return { key: 'empty', label: 'Sem valor' }
  if (Math.abs(previsto - deposito) > 0.01 || Math.abs(saldo) > 0.01) return { key: 'divergent', label: 'Divergente' }
  if (deposito > 0) return { key: 'received', label: 'Conciliado' }
  return { key: 'forecast', label: 'Previsto' }
}

function getRowStatus(row) {
  if (!row.previsto && !row.deposito && !row.debitos) return { key: 'empty', label: 'Sem valor' }
  if (!row.deposito && row.previsto > 0) return { key: 'forecast', label: 'Pendente' }
  if (Math.abs(row.saldo) <= 0.50) return { key: 'received', label: 'Conciliado' }
  return { key: 'divergent', label: 'Divergente' }
}

function buildRowsByBandeira(records = []) {
  const rows = {}

  records.forEach((record) => {
    const adquirente = record?.adquirente || 'Sem adquirente'
    const previstas = normalizeBandeiraMap(record?.previstoPorBandeira || {})
    const debitosRecebimentos = normalizeBandeiraMap(record?.debitosPorBandeira || {})
    const debitosExtrato = normalizeBandeiraMap(record?.debitosExtratoPorBandeira || {})
    const depositos = normalizeBandeiraMap(record?.depositosPorBandeira || {})
    const bandeiras = new Set([
      ...Object.keys(previstas),
      ...Object.keys(debitosRecebimentos),
      ...Object.keys(debitosExtrato),
      ...Object.keys(depositos)
    ])

    if (bandeiras.size === 0) {
      bandeiras.add('SEM BANDEIRA')
    }

    bandeiras.forEach((bandeira) => {
      const key = `${adquirente}__${bandeira}`
      if (!rows[key]) {
        rows[key] = {
          key,
          adquirente,
          bandeira: resolveBandeiraLabel(
            bandeira,
            previstas[bandeira]?.label,
            depositos[bandeira]?.label,
            debitosRecebimentos[bandeira]?.label,
            debitosExtrato[bandeira]?.label
          ),
          previsto: 0,
          debitos: 0,
          deposito: 0,
          saldo: 0,
          status: { key: 'empty', label: 'Sem valor' }
        }
      }

      rows[key].previsto += Number(previstas[bandeira]?.value || 0)
      rows[key].debitos += Number(debitosRecebimentos[bandeira]?.value || 0) + Number(debitosExtrato[bandeira]?.value || 0)
      rows[key].deposito += Number(depositos[bandeira]?.value || 0)
    })

    if (bandeiras.size === 1 && bandeiras.has('SEM BANDEIRA')) {
      const key = `${adquirente}__SEM BANDEIRA`
      rows[key].previsto += Number(record?.previsto || 0)
      rows[key].debitos += getRecordDebitos(record)
      rows[key].deposito += Number(record?.deposito || 0)
    }
  })

  return Object.values(rows)
    .map((row) => {
      row.saldo = row.deposito - row.previsto - row.debitos
      row.status = getRowStatus(row)
      return row
    })
    .sort((a, b) => {
      const adqCompare = a.adquirente.localeCompare(b.adquirente, 'pt-BR')
      if (adqCompare !== 0) return adqCompare
      return b.previsto + b.deposito - (a.previsto + a.deposito)
    })
}

function normalizeBandeiraKey(value) {
  return String(value || 'SEM BANDEIRA')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'SEM BANDEIRA'
}

function normalizeBandeiraMap(source = {}) {
  return Object.entries(source).reduce((acc, [key, value]) => {
    const normalizedKey = normalizeBandeiraKey(key)
    if (!acc[normalizedKey]) {
      acc[normalizedKey] = {
        value: 0,
        label: String(key || 'SEM BANDEIRA').trim() || 'SEM BANDEIRA'
      }
    }

    acc[normalizedKey].value += Number(value || 0)

    if (acc[normalizedKey].label === 'SEM BANDEIRA' && key) {
      acc[normalizedKey].label = String(key).trim()
    }

    return acc
  }, {})
}

function resolveBandeiraLabel(normalizedKey, ...labels) {
  const firstLabel = labels.find(label => String(label || '').trim())
  return firstLabel || normalizedKey
}

function buildDepositosExtrato(records = []) {
  return records.flatMap((record, recordIndex) => {
    const adquirenteFallback = record?.adquirente || 'Sem adquirente'
    return (record?.lancamentosBanco || []).map((lancamento, index) => {
      const conciliacao = lancamento?.conciliacao || {}
      return {
        key: `${record?.id || recordIndex}-${lancamento?.id || lancamento?.documento || index}`,
        adquirente: conciliacao.adquirente || adquirenteFallback,
        bandeira: conciliacao.bandeira || conciliacao.nomenclaturaBanco || '',
        bancoConta: formatBancoConta(conciliacao, lancamento),
        nomenclaturaBanco: conciliacao.nomenclaturaBanco || conciliacao.bandeira || '',
        nomenclaturaBase: conciliacao.nomenclaturaBase || '',
        valor: Number(conciliacao.valor ?? lancamento?.valorNumerico ?? lancamento?.valor ?? 0),
        comprovante: conciliacao.comprovante || lancamento?.documento || lancamento?.nsu || lancamento?.id || '',
        status: conciliacao.status || getRecordStatus(record).label
      }
    })
  })
}

function formatBancoConta(conciliacao = {}, lancamento = {}) {
  const banco = conciliacao.banco || lancamento?.banco || lancamento?.nome_banco || 'Banco nao informado'
  const agencia = conciliacao.agencia || lancamento?.agencia || ''
  const conta = conciliacao.conta || lancamento?.conta || lancamento?.numero_conta || ''
  const detalhes = [agencia && `Ag. ${agencia}`, conta && `Conta ${conta}`].filter(Boolean).join(' / ')

  return detalhes ? `${banco} · ${detalhes}` : banco
}

function statusClasses(statusKey) {
  const classes = {
    received: {
      card: 'border-[#DDEBDD] bg-[linear-gradient(180deg,#ffffff_0%,#fbfefb_100%)] text-slate-800',
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      accent: 'bg-emerald-500'
    },
    forecast: {
      card: 'border-[#DFE8F2] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfe_100%)] text-slate-800',
      badge: 'border-[#D8E4F1] bg-[#F4F8FC] text-[#5F7892]',
      accent: 'bg-[#8AA8C5]'
    },
    divergent: {
      card: 'border-[#F3DFCF] bg-[linear-gradient(180deg,#fffdfb_0%,#fff8f3_100%)] text-slate-800',
      badge: 'border-orange-200 bg-orange-50 text-orange-700',
      accent: 'bg-orange-400'
    },
    empty: {
      card: 'border-[#E5EBF1] bg-[linear-gradient(180deg,#fbfcfd_0%,#f8fafc_100%)] text-slate-600',
      badge: 'border-slate-200 bg-slate-50 text-slate-500',
      accent: 'bg-slate-300'
    }
  }

  return classes[statusKey] || classes.empty
}

function openDayDetails(day) {
  if (!day.isCurrentMonth || day.records.length === 0) return
  activeDetailTab.value = 'bandeiras'
  selectedDate.value = day
}

function closeDayDetails() {
  selectedDate.value = null
  activeDetailTab.value = 'bandeiras'
}

function goToPreviousMonth() {
  const nextDate = new Date(currentMonth.value)
  nextDate.setMonth(nextDate.getMonth() - 1)
  currentMonth.value = nextDate
  closeDayDetails()
}

function goToNextMonth() {
  const nextDate = new Date(currentMonth.value)
  nextDate.setMonth(nextDate.getMonth() + 1)
  currentMonth.value = nextDate
  closeDayDetails()
}

function goToCurrentMonth() {
  const today = new Date()
  currentMonth.value = new Date(today.getFullYear(), today.getMonth(), 1)
  closeDayDetails()
}

function normalizeWeekday(day) {
  return day === 0 ? 6 : day - 1
}

function toDateKey(value) {
  const date = value instanceof Date ? value : parseRecordDate(value)
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseRecordDate(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value

  if (typeof value === 'string') {
    const brDate = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (brDate) {
      return new Date(Number(brDate[3]), Number(brDate[2]) - 1, Number(brDate[1]))
    }

    const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (isoDate) {
      return new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]))
    }
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getRecordDebitos(record) {
  return Number(record?.debitosAntecipacao || 0) + Number(record?.debitos || 0)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}

function formatDisplayDate(key) {
  const date = parseRecordDate(key)
  if (!date) return key

  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}
</script>

<style scoped>
.calendar-shell {
  background-image:
    radial-gradient(circle at top right, rgba(139, 181, 222, 0.12), transparent 24%),
    radial-gradient(circle at left bottom, rgba(36, 75, 119, 0.07), transparent 26%);
}
</style>
