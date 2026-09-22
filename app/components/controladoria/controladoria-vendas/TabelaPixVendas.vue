<template>
  <TabelaPixManualBase
    variant="vendas"
    title="PIX"
    subtitle="Tabela manual de vendas PIX"
    :controller="controller"
    :empresa-selecionada="empresaSelecionada"
  />
</template>

<script setup>
import { computed, watch } from 'vue'
import TabelaPixManualBase from '~/components/controladoria/pix_manual_shared/TabelaPixManualBase.vue'
import { usePixVendasManual } from '~/composables/PageControladoria/controladoria-vendas/tabela_pix_vendas/usePixVendasManual'
import { useVendas } from '~/composables/useVendas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

const { filtroAtivo } = useVendas()
const { filtrosGlobais } = useGlobalFilters()
const controller = usePixVendasManual(filtroAtivo)

const empresaSelecionada = computed(() => Boolean(filtroAtivo.value?.empresa) || Boolean(filtrosGlobais.empresaSelecionada))

watch(
  () => [
    filtrosGlobais.empresaSelecionada,
    filtrosGlobais.dataInicial,
    filtrosGlobais.dataFinal,
    filtroAtivo.value?.empresa,
    filtroAtivo.value?.dataInicial,
    filtroAtivo.value?.dataFinal
  ],
  () => {
    if (empresaSelecionada.value) {
      controller.fetchPix()
    }
  },
  { immediate: true }
)
</script>
