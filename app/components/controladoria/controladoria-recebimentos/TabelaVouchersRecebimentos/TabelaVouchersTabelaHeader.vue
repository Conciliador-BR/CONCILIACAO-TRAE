<template>
  <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
    <tr>
      <th class="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Adquirente</th>
      <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Bruto</th>
      <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Despesas MDR</th>
      <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Líquido</th>
      <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Despesas C/ antecipação</th>
      <th class="px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Valor Previsto</th>
      <PagamentoDeBancoHeader />
      <th class="col-acoes-pdf px-8 py-5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Ação</th>
    </tr>
  </thead>
</template>

<script setup>
import PagamentoDeBancoHeader from '~/components/controladoria/analise-de-recebimentos/pagamento_de_banco/PagamentoDeBancoHeader.vue'
</script>
