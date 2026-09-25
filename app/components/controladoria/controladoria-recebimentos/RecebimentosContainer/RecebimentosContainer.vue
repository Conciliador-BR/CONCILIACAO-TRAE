<template>
  <RecebimentosAdquirenteLista :grupos-por-adquirente="gruposPorAdquirente" />
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
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
const { classificarBandeira, determinarModalidade, normalizeString } = useControladoriaVendas({ somenteClassificacao: true })
const { transacoes, buscarTransacoesBancarias } = useExtratoDetalhado()

const normalizarTexto = (valor = '') => String(valor || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

const isPrimeiroDiaMes = (valor) => {
  const texto = String(valor || '').trim()
  if (/^\d{4}-\d{2}-01/.test(texto)) return true
  if (/^01\/\d{2}\/\d{4}/.test(texto)) return true
  return false
}

const isLancamentoManualControladoria = (registro = {}) => {
  const sourceTable = String(registro?.sourceTable || '').toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (sourceTable.startsWith('recebimento_pix_')) return true
  if (registro?.__manual_entry === true || registro?.manualPeriod != null || registro?.manual_period != null) return true

  const nsuVazio = !String(registro?.nsu || '').trim()
  const modalidadeVoucher = normalizarTexto(registro?.modalidade).includes('voucher')
  const dataVendaMensal = isPrimeiroDiaMes(registro?.dataVenda || registro?.data_venda)
  const dataRecebimento = String(registro?.dataRecebimento || registro?.dataPgto || registro?.data_recebimento || registro?.data_pgto || '').trim()
  const dataRecebimentoMensalOuVazia = !dataRecebimento || isPrimeiroDiaMes(dataRecebimento)

  return nsuVazio && modalidadeVoucher && dataVendaMensal && dataRecebimentoMensalOuVazia
}

const recebimentosSemLancamentosManuais = computed(() => {
  return (recebimentos.value || []).filter((registro) => !isLancamentoManualControladoria(registro))
})

const { gruposPorAdquirente } = useRecebimentosGrupos({
  recebimentos: recebimentosSemLancamentosManuais,
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
  removerListener = escutarEvento('filtrar-controladoria-recebimentos', async (contexto = {}) => {
    if (contexto?.__fromGlobalFilter && contexto?.__preloaded?.recebimentos && contexto?.__preloaded?.extrato) {
      return
    }

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
