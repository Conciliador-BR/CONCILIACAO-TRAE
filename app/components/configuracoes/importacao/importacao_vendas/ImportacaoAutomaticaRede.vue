<template>
  <div
    v-if="visivel"
    class="bg-white rounded-lg shadow-md p-6 mb-6"
  >
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-xl font-semibold">4. Importacao Automatica da Rede</h2>
        <p class="text-sm text-gray-600 mt-1">
          O sistema usa a empresa selecionada, a EC da matriz e o periodo do filtro global para localizar a integracao correta e puxar as vendas.
        </p>
      </div>

      <button
        type="button"
        class="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="disabled || carregando"
        @click="$emit('executar')"
      >
        {{ carregando ? 'Puxando vendas...' : 'Puxar vendas da Rede' }}
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
      <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-gray-500">Periodo</div>
        <div class="text-sm font-medium text-gray-800 mt-1">
          {{ dataInicial || '-' }} ate {{ dataFinal || '-' }}
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-gray-500">Empresa</div>
        <div class="text-sm font-medium text-gray-800 mt-1">
          {{ nomeEmpresa || '-' }}
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-gray-500">EC Matriz</div>
        <div class="text-sm font-medium text-gray-800 mt-1">
          {{ ecEmpresa || '-' }}
        </div>
      </div>
    </div>

    <div
      v-if="integracao"
      class="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <div class="font-semibold">Integracao localizada</div>
      <div class="mt-1">
        {{ integracao.nome_empresa || '-' }} | Matriz: {{ integracao.matriz || '-' }} | EC API: {{ integracao.ec_adquirente || integracao.matriz || '-' }}
      </div>
      <div class="mt-1">
        Ambiente: {{ integracao.ambiente || '-' }} | Status: {{ integracao.status_integracao || '-' }}
      </div>
    </div>

    <div
      v-if="mensagemErro"
      class="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ mensagemErro }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  visivel: {
    type: Boolean,
    default: false
  },
  carregando: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  dataInicial: {
    type: String,
    default: ''
  },
  dataFinal: {
    type: String,
    default: ''
  },
  nomeEmpresa: {
    type: String,
    default: ''
  },
  ecEmpresa: {
    type: String,
    default: ''
  },
  integracao: {
    type: Object,
    default: null
  },
  mensagemErro: {
    type: String,
    default: ''
  }
})

defineEmits(['executar'])
</script>
