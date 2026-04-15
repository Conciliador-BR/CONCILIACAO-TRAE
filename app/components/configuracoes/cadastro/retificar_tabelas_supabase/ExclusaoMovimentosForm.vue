<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div class="md:col-span-4">
        <label class="block text-xs font-medium text-gray-700">Mês de referência</label>
        <input
          :value="mesReferencia"
          type="month"
          class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900"
          @input="$emit('update:mesReferencia', $event.target.value)"
        />
      </div>
      <div class="md:col-span-4">
        <label class="block text-xs font-medium text-gray-700">Tipo para excluir</label>
        <div class="mt-2 space-y-1">
          <label class="inline-flex items-center gap-2 text-sm text-gray-700 mr-4">
            <input type="checkbox" :checked="tipos.includes('vendas')" @change="$emit('toggle-tipo', 'vendas', $event.target.checked)" />
            Vendas
          </label>
          <label class="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" :checked="tipos.includes('recebimento')" @change="$emit('toggle-tipo', 'recebimento', $event.target.checked)" />
            Recebimentos
          </label>
          <label class="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" :checked="tipos.includes('vouchers')" @change="$emit('toggle-tipo', 'vouchers', $event.target.checked)" />
            Vouchers
          </label>
        </div>
      </div>
      <div class="md:col-span-4">
        <label class="block text-xs font-medium text-gray-700">Adquirentes (lista)</label>
        <p class="mt-2 text-xs text-gray-600">Escolha quais adquirentes serão retificados.</p>
      </div>
    </div>

    <div class="max-h-44 overflow-auto border border-gray-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      <label v-for="item in opcoesAdquirentes" :key="item" class="inline-flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" :checked="adquirentesSelecionados.includes(item)" @change="$emit('toggle-adquirente', item, $event.target.checked)" />
        {{ item }}
      </label>
    </div>

    <div class="flex justify-end">
      <button
        type="button"
        :disabled="disabled || loading"
        class="bg-amber-600 text-white px-5 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="$emit('excluir')"
      >
        {{ loading ? 'Retificando...' : 'Excluir Movimentos do Mês' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  mesReferencia: { type: String, default: '' },
  tipos: { type: Array, default: () => [] },
  opcoesAdquirentes: { type: Array, default: () => [] },
  adquirentesSelecionados: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

defineEmits([
  'update:mesReferencia',
  'toggle-tipo',
  'toggle-adquirente',
  'excluir'
])
</script>
