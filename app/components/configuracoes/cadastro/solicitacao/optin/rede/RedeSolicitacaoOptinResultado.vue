<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
      <h3 class="text-lg font-semibold text-gray-900">Resultado da Solicitacao REDE</h3>
      <p class="mt-1 text-xs text-gray-600">Veja o retorno do token e do endpoint de opt-in.</p>
    </div>

    <div class="p-6 space-y-4">
      <div
        v-if="mensagem"
        class="rounded-lg border px-4 py-3 text-sm"
        :class="sucesso ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'"
      >
        {{ mensagem }}
      </div>

      <div v-if="resultado" class="space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <p class="text-sm font-semibold text-gray-900">Autenticacao</p>
            <pre class="mt-3 overflow-auto rounded-xl bg-white border border-gray-200 p-3 text-xs text-gray-800">{{ formatJson(resultado.auth) }}</pre>
          </div>

          <div class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
            <p class="text-sm font-semibold text-gray-900">Solicitacao enviada</p>
            <pre class="mt-3 overflow-auto rounded-xl bg-white border border-gray-200 p-3 text-xs text-gray-800">{{ formatJson(resultado.request?.payload) }}</pre>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
          <p class="text-sm font-semibold text-gray-900">Resposta do endpoint</p>
          <pre class="mt-3 max-h-[520px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{{ formatJson(resultado.request?.response) }}</pre>
        </div>
      </div>

      <div v-else class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Selecione uma integracao e envie a solicitacao para visualizar o retorno do opt-in.
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  resultado: { type: Object, default: null },
  mensagem: { type: String, default: '' },
  sucesso: { type: Boolean, default: false }
})

const formatJson = (value) => {
  if (value === null || value === undefined || value === '') return '--'

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
</script>
