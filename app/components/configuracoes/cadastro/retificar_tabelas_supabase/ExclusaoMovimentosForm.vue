<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
      <div class="md:col-span-4">
        <label class="block text-xs font-medium text-gray-700">Mês de referência (múltiplo)</label>
        <div class="mt-1 flex gap-2">
          <input
          :value="mesReferenciaAtual"
          type="month"
          class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900"
          @input="$emit('update:mesReferenciaAtual', $event.target.value)"
          />
          <button
            type="button"
            class="rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-4 py-2 text-sm font-medium hover:bg-blue-100"
            @click="$emit('adicionar-mes')"
          >
            Adicionar
          </button>
        </div>
        <div v-if="mesesSelecionados.length > 0" class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="mes in mesesSelecionados"
            :key="mes"
            class="inline-flex items-center gap-2 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs text-gray-700"
          >
            {{ mes }}
            <button type="button" class="text-red-600" @click="$emit('remover-mes', mes)">x</button>
          </span>
        </div>
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
            <input type="checkbox" :checked="tipos.includes('voucher_vendas')" @change="$emit('toggle-tipo', 'voucher_vendas', $event.target.checked)" />
            Voucher Vendas
          </label>
          <label class="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" :checked="tipos.includes('voucher_recebimentos')" @change="$emit('toggle-tipo', 'voucher_recebimentos', $event.target.checked)" />
            Voucher Recebimentos
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
        {{ loading ? 'Retificando...' : 'Excluir Movimentos dos Meses' }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  mesReferenciaAtual: { type: String, default: '' },
  mesesSelecionados: { type: Array, default: () => [] },
  tipos: { type: Array, default: () => [] },
  opcoesAdquirentes: { type: Array, default: () => [] },
  adquirentesSelecionados: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})

defineEmits([
  'update:mesReferenciaAtual',
  'adicionar-mes',
  'remover-mes',
  'toggle-tipo',
  'toggle-adquirente',
  'excluir'
])
</script>
