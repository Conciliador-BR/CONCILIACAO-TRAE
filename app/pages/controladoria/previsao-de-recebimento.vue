<template>
  <div id="previsao-de-recebimento-root" class="space-y-8" :data-export-loading="loading ? 'true' : 'false'">
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Carregando dados...</span>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <template v-else>
      <PrevisaoDeRecebimentoHeader
        :adquirentes-count="gruposPorAdquirente.length"
        :valor-liquido="totaisGerais.valorLiquido"
      />

      <PrevisaoDeRecebimentoStats
        :totais="totaisGerais"
        :meses="meses"
      />

      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-md">
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Detalhamento por Adquirente</h3>
          <p class="text-sm text-gray-600 mt-1">Previsão futura dos recebimentos agrupada por bandeira e modalidade</p>
        </div>
      </div>

      <div v-if="gruposPorAdquirente.length > 0" class="space-y-8">
        <PrevisaoDeRecebimentoTableComplete
          v-for="grupo in gruposPorAdquirente"
          :key="grupo.adquirente"
          :previsoes-data="grupo.previsoesData"
          :totais="grupo.totais"
          :adquirente="grupo.adquirente"
          :meses="meses"
        />
      </div>

      <div v-else class="bg-slate-50 border border-slate-200 rounded-lg p-6 text-slate-600">
        Nenhuma previsão de recebimento foi encontrada para os filtros atuais.
      </div>

      <TabelaVouchersPrevisaoManual :meses="meses" />
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import PrevisaoDeRecebimentoHeader from '~/components/controladoria/previsao-de-recebimento/PrevisaoDeRecebimentoHeader.vue'
import PrevisaoDeRecebimentoStats from '~/components/controladoria/previsao-de-recebimento/PrevisaoDeRecebimentoStats.vue'
import PrevisaoDeRecebimentoTableComplete from '~/components/controladoria/previsao-de-recebimento/PrevisaoDeRecebimentoTableComplete.vue'
import TabelaVouchersPrevisaoManual from '~/components/controladoria/previsao-de-recebimento/TabelaVouchersPrevisaoManual.vue'
import { usePrevisaoDeRecebimento } from '~/composables/PageControladoria/previsao-de-recebimento/usePrevisaoDeRecebimento'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

useHead({
  title: 'Controladoria - Previsão de Recebimento | MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Previsão de recebimento por adquirente, bandeira e modalidade' }
  ]
})

const registrarVisitaPrevisao = () => {
  if (process.client) {
    localStorage.setItem('controladoria_ultima_aba', 'previsao-recebimento')
  }
}

const { escutarEvento } = useGlobalFilters()
let removerListenerFiltros = null

const {
  meses,
  loading,
  error,
  gruposPorAdquirente,
  totaisGerais,
  buscarPrevisoes
} = usePrevisaoDeRecebimento()

onMounted(async () => {
  await buscarPrevisoes()
  removerListenerFiltros = escutarEvento('filtrar-controladoria-vendas', async () => {
    await buscarPrevisoes({ forceReload: true })
  })
  registrarVisitaPrevisao()
})

onUnmounted(() => {
  if (typeof removerListenerFiltros === 'function') {
    removerListenerFiltros()
  }
})
</script>
