<template>
  <div id="controladoria-recebimentos-root" class="space-y-6" :data-export-loading="carregandoExportacao ? 'true' : 'false'">
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div class="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Conciliações de Recebimentos</h1>
            <p class="text-gray-600">Análise detalhada por adquirente e modalidade de pagamento</p>
          </div>
          <div class="flex items-center gap-3">
            <ManualAutorizadaToggleButton
              :visible="autorizadaManualVisible"
              @toggle="toggleAutorizadaManual"
            />
            <ControladoriaExcelExportButton
              root-id="controladoria-recebimentos-root"
              file-name="controladoria-recebimentos"
              :disabled="carregandoExportacao"
            />
            <ControladoriaRecebimentosExportPdf />
          </div>
        </div>
      </div>
    </div>
    <ManualAutorizadaConfirmCard
      v-if="confirmandoOcultarAutorizada"
      title="Ocultar autorizada manual de recebimentos?"
      message="A tabela so sera ocultada depois da confirmacao."
      @cancel="cancelarOcultarAutorizada"
      @confirm="confirmarOcultarAutorizada"
    />
    <ResumoRecebimentos :resumo="resumoComCards" />
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-md">
      <div class="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800">Detalhamento por Adquirente</h3>
        <p class="text-sm text-gray-600 mt-1">Análise completa das transações por modalidade</p>
      </div>
    </div>
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <RecebimentosContainer />
    </div>
    <TabelaPixRecebimentos @totais-change="atualizarTotaisPix" />
    <TabelaVouchersRecebimentos @totais-change="atualizarTotaisVoucher" />
    <TabelaAutorizadaManualRecebimentos v-if="autorizadaManualVisible" />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/useRecebimentos'
import { useResumoRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/useResumoRecebimentos'
import ResumoRecebimentos from '~/components/controladoria/controladoria-recebimentos/ResumoRecebimentos.vue'
import RecebimentosContainer from '~/components/controladoria/controladoria-recebimentos/RecebimentosContainer/RecebimentosContainer.vue'
import TabelaPixRecebimentos from '~/components/controladoria/controladoria-recebimentos/TabelaPixRecebimentos.vue'
import TabelaVouchersRecebimentos from '~/components/controladoria/controladoria-recebimentos/TabelaVouchersRecebimentos/TabelaVouchersRecebimentos.vue'
import TabelaAutorizadaManualRecebimentos from '~/components/controladoria/controladoria-recebimentos/adquirente_manual_recebimentos/TabelaAutorizadaManualRecebimentos.vue'
import ControladoriaExcelExportButton from '~/components/controladoria/exportacao_excel/ControladoriaExcelExportButton.vue'
import ControladoriaRecebimentosExportPdf from '~/components/controladoria/exportacao_pdf/recebimentos/ControladoriaRecebimentosExportPdf.vue'
import ManualAutorizadaToggleButton from '~/components/controladoria/controladoria-recebimentos/adquirente_manual_recebimentos/ManualAutorizadaToggleButton.vue'
import ManualAutorizadaConfirmCard from '~/components/controladoria/controladoria-recebimentos/adquirente_manual_recebimentos/ManualAutorizadaConfirmCard.vue'
import { useManualAutorizadaVisibility } from '~/composables/PageControladoria/controladoria-recebimentos/adquirente_manual_recebimentos/useManualAutorizadaVisibility'

useHead({
  title: 'Controladoria - Recebimentos - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de recebimentos' }
  ]
})

const registrarVisitaRecebimentos = () => {
  if (process.client) {
    localStorage.setItem('controladoria_ultima_aba', 'recebimentos')
  }
}

const { escutarEvento } = useGlobalFilters()
const { recebimentos, fetchRecebimentos } = useRecebimentos()
const { resumoCalculado } = useResumoRecebimentos(recebimentos)
const totalBrutoPixManual = ref(0)
const totalLiquidoPixManual = ref(0)
const totalMdrPixManual = ref(0)
const totalBrutoVoucherManual = ref(0)
const totalLiquidoVoucherManual = ref(0)
const totalMdrVoucherManual = ref(0)
const carregandoExportacao = ref(true)
const {
  visible: autorizadaManualVisible,
  confirmandoOcultar: confirmandoOcultarAutorizada,
  onToggle: toggleAutorizadaManual,
  cancelarOcultar: cancelarOcultarAutorizada,
  confirmarOcultar: confirmarOcultarAutorizada
} = useManualAutorizadaVisibility('controladoria:recebimentos:autorizada-manual:visible')

const atualizarTotaisPix = (totais = {}) => {
  totalBrutoPixManual.value = Number(totais?.valor_bruto || 0)
  totalLiquidoPixManual.value = Number(totais?.valor_liquido || 0)
  totalMdrPixManual.value = Number(totais?.despesa_mdr || 0)
}

const atualizarTotaisVoucher = (totais = {}) => {
  totalBrutoVoucherManual.value = Number(totais?.valor_bruto || 0)
  totalLiquidoVoucherManual.value = Number(totais?.valor_liquido || 0)
  totalMdrVoucherManual.value = Number(totais?.despesa_mdr || 0)
}

const resumoComCards = computed(() => {
  const resumoBase = resumoCalculado.value || {}
  const recebimentosBrutos = Number(resumoBase.recebimentosBrutos || 0) + totalBrutoPixManual.value + totalBrutoVoucherManual.value
  const recebimentosLiquidos = Number(resumoBase.recebimentosLiquidos || 0) + totalLiquidoPixManual.value + totalLiquidoVoucherManual.value
  const taxa = Number(resumoBase.taxa || 0) + totalMdrPixManual.value + totalMdrVoucherManual.value

  return {
    ...resumoBase,
    recebimentosBrutos,
    recebimentosLiquidos,
    taxa,
    taxaMedia: recebimentosBrutos > 0 ? parseFloat(((taxa / recebimentosBrutos) * 100).toFixed(2)) : 0,
    pix: Number(resumoBase.pix || 0) + totalLiquidoPixManual.value,
    voucher: Number(resumoBase.voucher || 0) + totalLiquidoVoucherManual.value,
    totalLiquido: Number(resumoBase.totalLiquido || 0) + totalLiquidoPixManual.value + totalLiquidoVoucherManual.value
  }
})

const filtrarRecebimentos = async (filtros) => {
  carregandoExportacao.value = true
  await fetchRecebimentos()
  await nextTick()
  carregandoExportacao.value = false
}

let removerListener

onMounted(async () => {
  registrarVisitaRecebimentos()
  carregandoExportacao.value = true
  await fetchRecebimentos()
  await nextTick()
  carregandoExportacao.value = false
  removerListener = escutarEvento('filtrar-controladoria-recebimentos', filtrarRecebimentos)
})

onUnmounted(() => {
  if (removerListener) removerListener()
})
</script>
