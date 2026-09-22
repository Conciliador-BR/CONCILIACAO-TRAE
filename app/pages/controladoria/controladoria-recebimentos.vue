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
              v-if="canManageManualTables"
              :visible="autorizadaManualVisible"
              @toggle="toggleAutorizadaManual"
            />
            <ControladoriaExcelExportButton
              root-id="controladoria-recebimentos-root"
              file-name="controladoria-recebimentos"
              :disabled="carregandoExportacao"
            />
            <ControladoriaPdfPageExport page-id="recebimentos" />
          </div>
        </div>
      </div>
    </div>
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
    <TabelaPixRecebimentos />
    <TabelaAutorizadaManualRecebimentos
      v-if="canManageManualTables && autorizadaManualVisible"
      @deleted="ocultarAutorizadaManual"
    />
    <TabelaVouchersRecebimentos />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useGlobalFilters } from '~/composables/useGlobalFilters'
import { useRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/useRecebimentos'
import { useResumoRecebimentos } from '~/composables/PageControladoria/controladoria-recebimentos/useResumoRecebimentos'
import { useEmpresaHelpers } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useEmpresaHelpers'
import { useTableNameBuilder } from '~/composables/PagePagamentos/filtrar_tabelas_recebimento/useTableNameBuilder'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'
import { useScopedTableRead } from '~/composables/useScopedTableRead'
import ResumoRecebimentos from '~/components/controladoria/controladoria-recebimentos/ResumoRecebimentos.vue'
import RecebimentosContainer from '~/components/controladoria/controladoria-recebimentos/RecebimentosContainer/RecebimentosContainer.vue'
import TabelaPixRecebimentos from '~/components/controladoria/controladoria-recebimentos/TabelaPixRecebimentos.vue'
import TabelaVouchersRecebimentos from '~/components/controladoria/controladoria-recebimentos/TabelaVouchersRecebimentos/TabelaVouchersRecebimentos.vue'
import TabelaAutorizadaManualRecebimentos from '~/components/controladoria/controladoria-recebimentos/adquirente_manual_recebimentos/TabelaAutorizadaManualRecebimentos.vue'
import ControladoriaExcelExportButton from '~/components/controladoria/exportacao_excel/ControladoriaExcelExportButton.vue'
import ControladoriaPdfPageExport from '~/components/controladoria/exportacao_pdf/shared/ControladoriaPdfPageExport.vue'
import ManualAutorizadaToggleButton from '~/components/controladoria/manual_autorizada_shared/ManualAutorizadaToggleButton.vue'
import { useManualAutorizadaVisibility } from '~/composables/PageControladoria/manual_autorizada_shared/useManualAutorizadaVisibility'
import { createRemoteManualAutorizadaResolver } from '~/composables/PageControladoria/manual_autorizada_shared/remoteState'
import { AUTORIZADA_MANUAL_STORAGE_MARKER, formatarNomeAdquirenteManual, resolverNomeTabelaAdquirenteManual } from '~/composables/PageControladoria/manual_autorizada_shared/constants'
import { normalizarEcNumerico } from '~/composables/PageControladoria/controladoria-recebimentos/tabela_recebimentos_voucher_manual/supabaseUtils'
import { useUserAccess } from '~/composables/useUserAccess'

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

const { escutarEvento, filtrosGlobais } = useGlobalFilters()
const { obterEmpresaSelecionadaCompleta, obterOperadorasEmpresaSelecionada } = useEmpresaHelpers()
const { construirNomeTabela } = useTableNameBuilder()
const { shouldUseScopedRead, readTablePage } = useScopedTableRead()
const { recebimentos, fetchRecebimentos } = useRecebimentos()
const { resumoCalculado } = useResumoRecebimentos(recebimentos)
const carregandoExportacao = ref(true)

const resolverContextoStorageAutorizada = async () => {
  const empresaCompleta = await obterEmpresaSelecionadaCompleta()
  return {
    empresa: empresaCompleta?.nome || '',
    ec: String(empresaCompleta?.matriz || '')
  }
}

const resolverEmpresaNomeAutorizada = async () => {
  const empresaCompleta = await obterEmpresaSelecionadaCompleta()
  return empresaCompleta?.nome || ''
}

const resolverEmpresaEcAutorizada = async () => {
  const empresaCompleta = await obterEmpresaSelecionadaCompleta()
  return empresaCompleta?.matriz || ''
}

const resolverPeriodoAutorizada = () => {
  let primeiroDia
  let ultimoDia

  if (filtrosGlobais.dataInicial && filtrosGlobais.dataFinal) {
    primeiroDia = filtrosGlobais.dataInicial
    ultimoDia = filtrosGlobais.dataFinal
  } else if (filtrosGlobais.dataInicial) {
    primeiroDia = filtrosGlobais.dataInicial
    ultimoDia = filtrosGlobais.dataInicial
  } else {
    const hoje = new Date()
    primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
    ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
  }

  return { primeiroDia, ultimoDia, chaveMes: `${primeiroDia}` }
}

const { discoverRemoteManualAdquirente } = createRemoteManualAutorizadaResolver({
  supabase,
  readTablePage,
  shouldUseScopedRead,
  construirNomeTabela,
  formatarNomeAdquirenteManual,
  resolverNomeTabelaAdquirenteManual,
  resolverEmpresaNome: resolverEmpresaNomeAutorizada,
  resolverEmpresaEC: resolverEmpresaEcAutorizada,
  resolverPeriodoTrabalho: resolverPeriodoAutorizada,
  resolverOperadorasDisponiveis: obterOperadorasEmpresaSelecionada,
  normalizarEcNumerico,
  storageMarker: AUTORIZADA_MANUAL_STORAGE_MARKER
})

const {
  visible: autorizadaManualVisible,
  onToggle: toggleAutorizadaManual,
  ocultar: ocultarAutorizadaManual
} = useManualAutorizadaVisibility({
  storageKey: 'controladoria:recebimentos:autorizada-manual:visible',
  resolveStorageContext: resolverContextoStorageAutorizada,
  resolveRemoteVisible: async () => Boolean(await discoverRemoteManualAdquirente()),
  watchSource: () => [filtrosGlobais.empresaSelecionada || '', filtrosGlobais.dataInicial || '', filtrosGlobais.dataFinal || '']
})
const { canManageManualTables } = useUserAccess()

const resumoComCards = computed(() => {
  const resumoBase = resumoCalculado.value || {}
  return {
    ...resumoBase,
    recebimentosBrutos: Number(resumoBase.recebimentosBrutos || 0),
    recebimentosLiquidos: Number(resumoBase.recebimentosLiquidos || 0),
    taxa: Number(resumoBase.taxa || 0),
    taxaMedia: Number(resumoBase.taxaMedia || 0),
    pix: Number(resumoBase.pix || 0),
    voucher: Number(resumoBase.voucher || 0),
    totalLiquido: Number(resumoBase.totalLiquido || 0)
  }
})

const filtrarRecebimentos = async (contexto = {}) => {
  carregandoExportacao.value = true
  if (!(contexto?.__fromGlobalFilter && contexto?.__preloaded?.recebimentos)) {
    await fetchRecebimentos()
  }
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
