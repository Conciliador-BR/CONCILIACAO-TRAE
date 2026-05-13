<template>
  <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
    <div class="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
      <h3 class="text-lg font-semibold text-gray-900">Ajuda Rapida Sandbox</h3>
      <p class="mt-1 text-xs text-gray-600">Atalhos com exemplos documentados pela REDE para acelerar seu primeiro teste.</p>
    </div>

    <div class="p-6 space-y-4">
      <div class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
        <p class="text-sm font-semibold text-gray-900">Preset 1: Consultar Vendas</p>
        <p class="mt-1 text-xs text-gray-600">Usa a rota `/merchant-statement/v1/sales` com `parentCompanyNumber` sandbox.</p>
        <button
          type="button"
          class="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          @click="$emit('preset-vendas')"
        >
          Aplicar Preset de Vendas
        </button>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
        <p class="text-sm font-semibold text-gray-900">Preset 2: Consultar Vendas por NSU</p>
        <p class="mt-1 text-xs text-gray-600">Usa a URL sandbox nova `payments-apisandbox` com o exemplo da documentacao.</p>
        <button
          type="button"
          class="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          @click="$emit('preset-nsu')"
        >
          Aplicar Preset de NSU
        </button>
      </div>

      <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs text-amber-900">
        <p class="font-semibold">Valores sandbox conhecidos</p>
        <ul class="mt-2 space-y-1">
          <li>- `parentCompanyNumber`: `13381369` ou `22523510`</li>
          <li>- `companyNumber` para NSU: `1254405`</li>
          <li>- `brands`: `1` ou `14` em cenarios documentados</li>
          <li>- `modalities`: `CREDIT` ou `DEBIT`</li>
          <li>- `status`: `APPROVED` ou `PENDING` conforme a rota</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['preset-vendas', 'preset-nsu'])
</script>
