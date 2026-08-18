<template>
  <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h4 class="text-base font-semibold text-emerald-900">Configuracao da VR</h4>
        <p class="mt-1 text-xs text-emerald-800">
          Para a VR, o nome do arquivo remoto sera salvo na coluna <span class="font-mono">client_id</span> da tabela de credenciais.
        </p>
      </div>
      <div class="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
        Suportado agora
      </div>
    </div>

    <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-1">Nome do arquivo VR *</label>
        <input
          v-model="form.client_id"
          type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
          placeholder="Ex: VR_ECONOMICCARD_10478994000100.txt"
          autocomplete="off"
        />
        <p class="mt-1 text-xs text-gray-500">
          Esse valor sera usado pelo download da VR e gravado na coluna <span class="font-mono">client_id</span>.
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
        <input
          :value="form.empresas || form.nome_empresa || ''"
          type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
          readonly
        />
        <p class="mt-1 text-xs text-gray-500">Valor enviado para a coluna <span class="font-mono">empresas</span>.</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">EC</label>
        <input
          :value="form.ec || form.ec_adquirente || ''"
          type="text"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
          readonly
        />
        <p class="mt-1 text-xs text-gray-500">Valor enviado para a coluna <span class="font-mono">ec</span>.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  form: { type: Object, required: true }
})
</script>
