<template>
  <div
    v-if="visivel"
    class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6"
  >
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <h2 class="text-2xl font-bold text-gray-900">3. Escolha o Modelo do Arquivo Safra</h2>
      <p class="text-sm text-gray-600 mt-1">
        A Safra agora possui layout antigo e novo. Escolha o modelo antes de carregar o arquivo de vendas.
      </p>
    </div>

    <div class="p-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          :disabled="disabled"
          :class="getCardClass('antigo')"
          @click="$emit('modelo-selecionado', 'antigo')"
        >
          <div class="text-left">
            <div class="text-lg font-semibold text-gray-900">Modelo Antigo</div>
            <p class="mt-2 text-sm text-gray-600">
              Usa o layout historico da Safra, com as colunas ja processadas hoje pelo sistema.
            </p>
          </div>
        </button>

        <button
          type="button"
          :disabled="disabled"
          :class="getCardClass('novo')"
          @click="$emit('modelo-selecionado', 'novo')"
        >
          <div class="text-left">
            <div class="text-lg font-semibold text-gray-900">Modelo Novo</div>
            <p class="mt-2 text-sm text-gray-600">
              Usa o novo layout da Safra, com coluna <span class="font-mono">PL</span> para parcelas e taxa MDR em percentual.
            </p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visivel: {
    type: Boolean,
    default: false
  },
  modeloSelecionado: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['modelo-selecionado'])

const getCardClass = (modelo) => {
  const selecionado = props.modeloSelecionado === modelo

  return [
    'w-full rounded-xl border-2 p-5 text-left transition-all duration-200',
    props.disabled
      ? 'cursor-not-allowed border-gray-200 bg-gray-100 opacity-60'
      : selecionado
        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
  ]
}
</script>
