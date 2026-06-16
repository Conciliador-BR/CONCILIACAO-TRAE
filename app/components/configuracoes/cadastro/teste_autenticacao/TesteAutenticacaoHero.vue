<template>
  <div class="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-5 sm:py-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Teste de Autenticacao</h2>
        <p class="mt-1 text-xs sm:text-sm text-gray-600">
          Valide o OAuth2 da REDE com a credencial global da conciliadora, consulte vendas e pagamentos com a EC cadastrada e confirme se os dados estao chegando no sistema.
        </p>
      </div>

      <div class="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-900 max-w-xl">
        Esta tela usa uma rota `server/api` no Nuxt para buscar a credencial global da REDE no backend e evitar expor o `Client Secret` no navegador.
      </div>
    </div>
  </div>
</template>
