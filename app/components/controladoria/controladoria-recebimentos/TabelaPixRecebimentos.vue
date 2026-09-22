<template>
  <TabelaPixManualBase
    variant="recebimentos"
    title="PIX (Recebimentos)"
    subtitle="Tabela manual de recebimentos PIX"
    :controller="controller"
    :empresa-selecionada="empresaSelecionada"
    @totais-change="emit('totais-change', $event)"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import TabelaPixManualBase from '~/components/controladoria/pix_manual_shared/TabelaPixManualBase.vue'
import { usePixRecebimentosManual } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_pix_recebimentos/usePixRecebimentosManual'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

const emit = defineEmits(['totais-change'])
const { filtrosGlobais } = useGlobalFilters()
const filtroAtivo = ref(null)
const controller = usePixRecebimentosManual(filtroAtivo)

const empresaSelecionada = computed(() => Boolean(filtrosGlobais.empresaSelecionada))

watch(
  () => [filtrosGlobais.empresaSelecionada, filtrosGlobais.dataInicial, filtrosGlobais.dataFinal],
  () => {
    if (empresaSelecionada.value) {
      controller.fetchPix()
    }
  },
  { immediate: true }
)
</script>
