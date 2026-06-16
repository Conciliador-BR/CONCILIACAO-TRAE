<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
      <h3 class="text-2xl font-bold text-gray-900">Configurar Solicitacao REDE</h3>
      <p class="text-sm text-gray-600 mt-1">Selecione a integracao da REDE e envie o opt-in com os ECs desejados.</p>
    </div>

    <form class="p-8 space-y-6" @submit.prevent="$emit('executar')">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Integracao REDE *</label>
          <select
            :value="form.integrationId"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
            @change="$emit('selecionar-integracao', $event.target.value)"
          >
            <option value="">Selecione uma integracao</option>
            <option v-for="integracao in integracoes" :key="integracao.id" :value="integracao.id">
              {{ formatarIntegracao(integracao) }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">PV / EC solicitante *</label>
          <input
            v-model="form.requestCompanyNumber"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Ex: 60693983"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
          <input
            v-model="form.timeoutMs"
            type="number"
            min="3000"
            max="60000"
            step="1000"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">ECs para companyNumbers *</label>
          <textarea
            v-model="form.companyNumbersText"
            rows="6"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Um EC por linha ou separado por virgula"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">requestType</label>
          <input v-model="form.requestType" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50" readonly />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">permissions</label>
          <input v-model="form.permissions" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50" readonly />
        </div>
      </div>

      <div v-if="erros.length" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-sm font-semibold text-red-700 mb-2">Corrija os pontos abaixo:</p>
        <ul class="text-sm text-red-700 list-disc pl-5">
          <li v-for="erro in erros" :key="erro">{{ erro }}</li>
        </ul>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
          @click="$emit('limpar')"
        >
          Limpar
        </button>
        <button
          type="submit"
          :disabled="executando"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ executando ? 'Enviando solicitacao...' : 'Solicitar Opt-In REDE' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true },
  erros: { type: Array, default: () => [] },
  integracoes: { type: Array, default: () => [] },
  executando: { type: Boolean, default: false }
})

defineEmits(['executar', 'limpar', 'selecionar-integracao'])

const formatarIntegracao = (integracao) => {
  const nomeEmpresa = String(integracao?.nome_empresa || '').trim()
  const adquirente = String(integracao?.adquirente || '').trim().toUpperCase()

  if (nomeEmpresa && adquirente) return `${nomeEmpresa} - ${adquirente}`
  if (nomeEmpresa) return nomeEmpresa
  if (adquirente) return adquirente
  return 'Integracao sem identificacao'
}
</script>
