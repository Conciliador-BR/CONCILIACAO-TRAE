<template>
  <div class="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-5 sm:py-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Solicitacao de Opt-In REDE</h2>
        <p class="mt-1 text-xs sm:text-sm text-gray-600">
          Gere o token da REDE e solicite o opt-in de `merchant-statement` com os PVs/ECs configurados na integracao.
        </p>
      </div>

      <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 max-w-xl">
        Esta configuracao segue o fluxo que funcionou no Python: token OAuth2 e depois `POST` em `/partner/v1/organizations/requests/features/merchant-statement`.
      </div>
    </div>
  </div>
</template>
