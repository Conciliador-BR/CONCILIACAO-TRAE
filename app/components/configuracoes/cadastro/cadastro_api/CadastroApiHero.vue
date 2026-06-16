<template>
  <div class="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-5 sm:py-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Cadastro de API</h2>
        <p class="mt-1 text-xs sm:text-sm text-gray-600">
          Cadastre o vinculo da empresa com a adquirente, acompanhe o status da integracao e mantenha o historico tecnico em um unico lugar.
        </p>
      </div>

      <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 max-w-xl">
        Para a REDE, `Client ID` e `Client Secret` agora ficam na tabela global `credenciais_adquirente`. Aqui voce salva somente a EC/PV da empresa.
      </div>
    </div>
  </div>
</template>
