<template>
  <article class="overflow-hidden rounded-2xl border border-[#DCE7F3] bg-white shadow-xl">
    <div class="border-b border-[#DCE7F3] bg-gradient-to-r from-[#102a43] via-[#244b77] to-[#102a43] px-6 py-5 text-white">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <span class="h-3 w-3 rounded-full" :class="colorClass"></span>
            <h3 class="truncate text-lg font-semibold">{{ grupo.adquirente }}</h3>
            <span class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {{ grupo.recebimentosData?.length || 0 }} linhas
            </span>
          </div>
          <p class="mt-2 text-sm text-blue-100">
            Resumo por bandeira/modalidade com previsto e custos consolidados.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3 lg:min-w-[420px] lg:grid-cols-4">
          <div class="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p class="text-xs uppercase tracking-wide text-blue-100">Valor Bruto</p>
            <p class="mt-1 text-sm font-semibold">{{ formatCurrency(grupo?.totais?.vendaBruta) }}</p>
          </div>
          <div class="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p class="text-xs uppercase tracking-wide text-blue-100">Valor Liquido</p>
            <p class="mt-1 text-sm font-semibold">{{ formatCurrency(grupo?.totais?.vendaLiquida) }}</p>
          </div>
          <div class="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p class="text-xs uppercase tracking-wide text-blue-100">Previsto</p>
            <p class="mt-1 text-sm font-semibold text-emerald-200">{{ formatCurrency(grupo?.totais?.valorPago) }}</p>
          </div>
          <div class="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p class="text-xs uppercase tracking-wide text-blue-100">Antecipacao</p>
            <p class="mt-1 text-sm font-semibold" :class="despesaCardClass">
              {{ formatCurrency(grupo?.totais?.despesaAntecipacao) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#486581]">Linha</th>
            <th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#486581]">Debito</th>
            <th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#486581]">Credito</th>
            <th v-if="mostrarVoucher" class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#486581]">Voucher</th>
            <th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#486581]">Bruto</th>
            <th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#486581]">Taxa</th>
            <th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#486581]">Liquido</th>
            <th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#486581]">Antecipacao</th>
            <th class="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#486581]">Previsto</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 bg-white">
          <tr
            v-for="(item, rowIndex) in grupo.recebimentosData"
            :key="`${grupo.adquirente}-${item.adquirente}-${rowIndex}`"
            :class="[rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/60', 'transition hover:bg-blue-50/70']"
          >
            <td class="px-5 py-4 text-sm font-semibold text-gray-900">
              <div class="flex items-center gap-3">
                <span class="h-2.5 w-2.5 rounded-full" :class="getColorByIndex(rowIndex)"></span>
                <span>{{ item.adquirente }}</span>
              </div>
            </td>
            <td class="px-5 py-4 text-right text-sm" :class="getEntradaClass(item.debito)">{{ formatCurrency(item.debito) }}</td>
            <td class="px-5 py-4 text-right text-sm" :class="getEntradaClass(creditoTotal(item))">{{ formatCurrency(creditoTotal(item)) }}</td>
            <td v-if="mostrarVoucher" class="px-5 py-4 text-right text-sm" :class="getVoucherClass(item.voucher)">{{ formatCurrency(item.voucher) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold text-gray-900">{{ formatCurrency(item.valor_bruto_total) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold" :class="getTaxaClass(item.despesa_mdr_total)">{{ formatCurrency(item.despesa_mdr_total) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold text-gray-900">{{ formatCurrency(item.valor_liquido_total) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold" :class="getTaxaClass(item.despesa_antecipacao_total)">{{ formatCurrency(item.despesa_antecipacao_total) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold text-gray-900">{{ formatCurrency(item.valor_pago_total) }}</td>
          </tr>
        </tbody>
        <tfoot class="bg-gradient-to-r from-[#244b77] to-[#102a43] text-white">
          <tr>
            <td class="px-5 py-4 text-sm font-semibold">TOTAL {{ grupo.adquirente }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold">{{ formatCurrency(grupo?.totais?.debito) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold">{{ formatCurrency(creditoTotal(grupo?.totais || {})) }}</td>
            <td v-if="mostrarVoucher" class="px-5 py-4 text-right text-sm font-semibold">{{ formatCurrency(grupo?.totais?.voucher) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold">{{ formatCurrency(grupo?.totais?.vendaBruta) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold text-rose-100">{{ formatCurrency(grupo?.totais?.despesaMdr) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold">{{ formatCurrency(grupo?.totais?.vendaLiquida) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold text-rose-100">{{ formatCurrency(grupo?.totais?.despesaAntecipacao) }}</td>
            <td class="px-5 py-4 text-right text-sm font-semibold">{{ formatCurrency(grupo?.totais?.valorPago) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  grupo: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    default: 0
  }
})

const colorPalette = [
  'bg-blue-400',
  'bg-emerald-400',
  'bg-violet-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-cyan-400',
  'bg-fuchsia-400',
  'bg-lime-400'
]

const colorClass = computed(() => colorPalette[props.index % colorPalette.length])

const mostrarVoucher = computed(() => {
  const totalVoucher = Number(props?.grupo?.totais?.voucher || 0)
  if (totalVoucher !== 0) return true
  return (props?.grupo?.recebimentosData || []).some(item => Number(item?.voucher || 0) !== 0)
})

const creditoTotal = (item = {}) => (
  Number(item.credito || 0) +
  Number(item.credito2x || 0) +
  Number(item.credito3x || 0) +
  Number(item.credito4x5x6x || 0)
)

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}

const getColorByIndex = (index) => colorPalette[index % colorPalette.length]
const getEntradaClass = (value) => Number(value || 0) > 0 ? 'font-medium text-[#244b77]' : 'text-gray-400'
const getVoucherClass = (value) => Number(value || 0) > 0 ? 'font-medium text-violet-700' : 'text-gray-400'
const getTaxaClass = (value) => Number(value || 0) !== 0 ? 'text-red-600' : 'text-gray-400'
const despesaCardClass = computed(() => Number(props?.grupo?.totais?.despesaAntecipacao || 0) > 0 ? 'text-rose-200' : 'text-blue-50')
</script>
