<template>
  <div class="grid grid-cols-1 gap-4">
    <article
      v-for="item in items"
      :key="item.nome"
      class="rounded-2xl border border-[#DCE7F3] bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide" :class="getBadgeClass(item.categoria)">
              {{ item.categoria || 'Banco' }}
            </span>
            <span class="text-xs text-gray-500">{{ item.quantidade }} lancamentos</span>
          </div>
          <h3 class="mt-3 text-lg font-semibold text-gray-900">{{ item.nome }}</h3>
        </div>
        <div class="text-right">
          <p class="text-xs uppercase tracking-wide text-gray-500">PGTO BANCO</p>
          <p class="mt-1 text-lg font-semibold text-emerald-700">{{ formatCurrency(item.totalPgtoBanco) }}</p>
        </div>
      </div>

      <div class="mt-4 space-y-2">
        <div v-for="(nomenclatura, index) in item.nomenclaturas" :key="`${item.nome}-${index}`" class="rounded-xl border border-gray-200 bg-white px-4 py-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-[#486581]">Nomenclatura {{ index + 1 }}</p>
          <p class="mt-1 text-sm text-gray-700">{{ nomenclatura }}</p>
        </div>
      </div>
    </article>

    <div v-if="items.length === 0" class="rounded-2xl border border-dashed border-gray-300 bg-white/70 px-5 py-8 text-sm text-gray-500">
      Nenhuma nomenclatura de banco foi identificada no periodo.
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0))
}

const getBadgeClass = (categoria) => {
  const valor = String(categoria || '').toLowerCase()
  if (valor.includes('voucher')) return 'bg-violet-100 text-violet-700'
  if (valor.includes('pix')) return 'bg-emerald-100 text-emerald-700'
  if (valor.includes('debito operacional')) return 'bg-rose-100 text-rose-700'
  if (valor.includes('debito')) return 'bg-amber-100 text-amber-700'
  if (valor.includes('antecip')) return 'bg-indigo-100 text-indigo-700'
  if (valor.includes('credito')) return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-700'
}
</script>
