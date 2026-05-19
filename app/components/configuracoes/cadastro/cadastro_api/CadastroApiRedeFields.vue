<template>
  <div class="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h4 class="text-base font-semibold text-orange-900">Configuracao da REDE</h4>
        <p class="mt-1 text-xs text-orange-800">
          Para a REDE, usamos `Client ID`, `Client Secret`, `ec_adquirente` e o PV solicitante do opt-in.
        </p>
      </div>
      <div class="rounded-full border border-orange-300 bg-white px-3 py-1 text-xs font-semibold text-orange-700">
        Suportado agora
      </div>
    </div>

    <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Client ID *</label>
        <input v-model="form.client_id" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ form.id ? 'Novo Client Secret' : 'Client Secret *' }}
        </label>
        <input
          v-model="form.client_secret"
          type="password"
          autocomplete="new-password"
          class="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
        <p class="mt-1 text-xs text-gray-500">
          {{ form.id ? 'Deixe em branco para manter o valor salvo.' : 'Use esta tela apenas para administracao da integracao.' }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">EC da adquirente *</label>
        <input
          v-model="form.ec_adquirente"
          type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="Ex: 13381369"
        />
        <p class="mt-1 text-xs text-gray-500">Essa EC sera usada na tela de teste e no opt-in.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">PV solicitante do opt-in</label>
        <input
          v-model="form.request_company_number"
          type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2"
          placeholder="Ex: 60693983"
        />
        <p class="mt-1 text-xs text-gray-500">Opcional no cadastro, mas necessario na solicitacao de opt-in.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true }
})
</script>
