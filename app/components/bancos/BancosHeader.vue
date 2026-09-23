<template>
  <div class="overflow-hidden rounded-[28px] border border-[#DCE7F3] bg-white shadow-[0_16px_40px_rgba(16,42,67,0.08)]">
    <div class="border-b border-[#E7EFF8] bg-gradient-to-r from-[#F8FBFF] to-white px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-12">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-[#102A43] sm:text-3xl lg:text-3xl xl:text-4xl">Movimentações Financeiras</h2>
          <p class="mt-1 text-xs text-slate-500 sm:text-sm lg:text-sm xl:text-base">Conciliação e controle das movimentações</p>
        </div>
        <div class="flex items-center space-x-4">
          <div class="rounded-xl border border-[#D5E6F7] bg-[#F4FAFF] px-4 py-2 text-sm font-semibold text-[#244B77]">
            {{ totalMovimentacoes }} Movimentações
          </div>
          <div class="rounded-xl border px-4 py-2 text-sm font-semibold" :class="saldoTotal >= 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'">
            {{ formatCurrency(saldoTotal) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['dados-atualizados', 'erro-atualizacao'])

const props = defineProps({
  totalMovimentacoes: { type: Number, default: 0 },
  saldoTotal: { type: Number, default: 0 }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}
</script>
