<template>
  <div class="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h4 class="text-base font-semibold text-orange-900">Configuracao da REDE</h4>
        <p class="mt-1 text-xs text-orange-800">
          A REDE agora aceita credencial por empresa, no mesmo estilo operacional das outras integracoes. Se preferir, ainda da para manter o fallback global da tabela `credenciais_adquirente`.
        </p>
      </div>
      <div class="rounded-full border border-orange-300 bg-white px-3 py-1 text-xs font-semibold text-orange-700">
        Suportado agora
      </div>
    </div>

    <div class="mt-5 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="rounded-xl border border-orange-200 bg-white px-4 py-4 text-sm text-orange-900">
          <span class="flex items-center gap-3">
            <input
              v-model="form.credential_mode"
              type="radio"
              value="empresa"
              class="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-200"
            />
            <span>
              <span class="block font-semibold">Credencial por empresa</span>
              <span class="mt-1 block text-xs text-orange-800">Salva `Client ID` e `Client Secret` nesta integracao.</span>
            </span>
          </span>
        </label>

        <label class="rounded-xl border border-orange-200 bg-white px-4 py-4 text-sm text-orange-900">
          <span class="flex items-center gap-3">
            <input
              v-model="form.credential_mode"
              type="radio"
              value="global"
              class="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-200"
            />
            <span>
              <span class="block font-semibold">Fallback global</span>
              <span class="mt-1 block text-xs text-orange-800">Usa a credencial ativa da tabela `credenciais_adquirente`.</span>
            </span>
          </span>
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          class="rounded-xl border border-transparent px-0 py-0 text-sm text-orange-900"
        >
          <label class="block text-sm font-medium text-gray-700 mb-1">EC da adquirente *</label>
          <input
            v-model="form.ec_adquirente"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Ex: 13381369"
          />
          <p class="mt-1 text-xs text-gray-500">Essa EC/PV sera usada na tela de teste, na importacao e como base do opt-in.</p>
        </div>

        <div
          class="rounded-xl border border-orange-200 bg-white px-4 py-4 text-sm text-orange-900"
        >
          <template v-if="form.credential_mode === 'empresa'">
            <p class="font-semibold">Credencial por empresa</p>
            <p class="mt-2 text-xs leading-5 text-orange-800">
              O segredo e criptografado no backend. Ao editar, deixe o `Client Secret` em branco para manter o valor atual.
            </p>
          </template>
          <template v-else>
            <p class="font-semibold">Fallback global</p>
            <p class="mt-2 text-xs leading-5 text-orange-800">
              Quando este modo estiver ativo, a integracao usa automaticamente a credencial global ativa em `credenciais_adquirente` no ambiente `producao`.
            </p>
          </template>
        </div>
      </div>

      <div v-if="form.credential_mode === 'empresa'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Client ID *</label>
          <input
            v-model="form.client_id"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Ex: rede-client-id"
            autocomplete="off"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Client Secret {{ form.has_company_credentials ? '(opcional para manter o atual)' : '*' }}
          </label>
          <input
            v-model="form.client_secret"
            type="password"
            class="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Digite apenas se quiser salvar ou trocar o segredo"
            autocomplete="new-password"
          />
          <p class="mt-1 text-xs text-gray-500">
            {{ form.has_company_credentials ? 'Ja existe um segredo salvo para esta integracao.' : 'O segredo sera criptografado antes de ser salvo.' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true }
})
</script>
