<template>
  <div class="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h4 class="text-base font-semibold text-orange-900">Configuracao da REDE</h4>
        <p class="mt-1 text-xs text-orange-800">
          Para a REDE, a credencial fica global na tabela `credenciais_adquirente`. Nesta integracao, voce cadastra apenas a EC/PV da empresa.
        </p>
      </div>
      <div class="rounded-full border border-orange-300 bg-white px-3 py-1 text-xs font-semibold text-orange-700">
        Suportado agora
      </div>
    </div>

    <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">EC da adquirente *</label>
        <input
          v-model="form.ec_adquirente"
          type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="Ex: 13381369"
        />
        <p class="mt-1 text-xs text-gray-500">Essa EC/PV sera usada na tela de teste, na importacao e como base do opt-in.</p>
      </div>

      <div class="rounded-xl border border-orange-200 bg-white px-4 py-4 text-sm text-orange-900">
        <p class="font-semibold">Credencial global</p>
        <p class="mt-2 text-xs leading-5 text-orange-800">
          `Client ID` e `Client Secret` nao sao mais digitados por empresa. O backend da REDE busca automaticamente a credencial global ativa em `credenciais_adquirente` no ambiente `producao`.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true }
})
</script>
