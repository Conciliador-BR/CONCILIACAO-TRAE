<template>
  <RecebimentosAdquirenteLista :grupos-por-adquirente="gruposPorAdquirente" />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/useRecebimentos'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useControladoriaVendas } from '~/composables/PageControladoria/useControladoriaVendas'
import { useExtratoDetalhado } from '~/composables/PageBancos/useExtratoDetalhado'
import RecebimentosAdquirenteLista from './RecebimentosAdquirenteLista.vue'
import { useRecebimentosGrupos } from '~/composables/PageControladoria/controladoria-recebimentos/recebimentoscontainer/useRecebimentosGrupos'

const { initializeResponsive } = useResponsiveColumns()

const { recebimentos, fetchRecebimentos } = useRecebimentos()
const { filtrosGlobais, escutarEvento } = useGlobalFilters()
const { classificarBandeira, determinarModalidade, normalizeString } = useControladoriaVendas()
const { transacoes, buscarTransacoesBancarias } = useExtratoDetalhado()

const { gruposPorAdquirente } = useRecebimentosGrupos({
  recebimentos,
  transacoes,
  classificarBandeira,
  determinarModalidade,
  normalizeString
})

const atualizarDados = async () => {
  await buscarTransacoesBancarias({
    bancoSelecionado: 'TODOS',
    dataInicial: filtrosGlobais.dataInicial || '',
    dataFinal: filtrosGlobais.dataFinal || ''
  }, true)
}

onMounted(async () => {
  initializeResponsive()
  removerListener = escutarEvento('filtrar-controladoria-recebimentos', async () => {
    await Promise.all([
      fetchRecebimentos(),
      atualizarDados()
    ])
  })
})

let removerListener

onUnmounted(() => {
  if (removerListener) removerListener()
})
</script>
