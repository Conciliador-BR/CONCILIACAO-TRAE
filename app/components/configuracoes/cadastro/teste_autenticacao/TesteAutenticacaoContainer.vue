<template>
  <div class="space-y-6">
    <TesteAutenticacaoHero />

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div class="xl:col-span-8 space-y-6">
        <TesteAutenticacaoForm
          :form="form"
          :erros="erros"
          :integracoes="integracoesFiltradas"
          :adquirentes="opcoesAdquirentes"
          :vouchers="opcoesVouchers"
          :preset-hint="presetAtual?.hint || ''"
          :executando="executandoTeste"
          @executar="executarTeste"
          @limpar="limparFormulario"
          @selecionar-operadora="selecionarOperadora"
          @selecionar-integracao="selecionarIntegracao"
        />

        <TesteAutenticacaoResultado
          :resultado="resultadoNormalizado"
          :mensagem="mensagem"
          :sucesso="sucesso"
        />

        <TabelaVendas
          :vendas="vendasImportacaoRows"
          :adquirente="integracaoSelecionada?.adquirente || 'REDE'"
        />

        <TabelaRecebimentos
          :recebimentos="recebimentosImportacaoRows"
          :adquirente="integracaoSelecionada?.adquirente || 'REDE'"
        />
      </div>

      <div class="xl:col-span-4 space-y-6">
        <TesteAutenticacaoResumo
          :integracao-selecionada="integracaoSelecionada"
          :resultado="resultadoNormalizado"
          :quantidade-registros="quantidadeRegistros"
          :quantidade-pagamentos="quantidadePagamentos"
          :status-resumo="statusResumo"
        />

        <div
          v-if="erroTela"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {{ erroTela }}
        </div>
      </div>
    </div>

    <CadastroApiLogsLista
      :logs="logs"
      :loading="carregandoLogs"
      :subtitulo="subtituloLogs"
      @recarregar="recarregarLogs"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import CadastroApiLogsLista from '~/components/configuracoes/cadastro/cadastro_api/CadastroApiLogsLista.vue'
import TesteAutenticacaoHero from './TesteAutenticacaoHero.vue'
import TesteAutenticacaoForm from './TesteAutenticacaoForm.vue'
import TesteAutenticacaoResumo from './TesteAutenticacaoResumo.vue'
import TesteAutenticacaoResultado from './TesteAutenticacaoResultado.vue'
import TabelaVendas from '~/components/configuracoes/importacao/importacao_vendas/TabelaVendas.vue'
import TabelaRecebimentos from '~/components/configuracoes/importacao/importacao_recebimentos/TabelaRecebimentos.vue'
import { useTesteAutenticacaoRede } from '~/composables/configuracoes/cadastro/useTesteAutenticacaoRede'

const {
  form,
  erros,
  mensagem,
  sucesso,
  erro,
  integracoesFiltradas,
  opcoesAdquirentes,
  opcoesVouchers,
  logs,
  carregandoLogs,
  executandoTeste,
  resultadoTeste,
  resultadoNormalizado,
  quantidadeRegistros,
  quantidadePagamentos,
  statusResumo,
  vendasImportacaoRows,
  recebimentosImportacaoRows,
  presetAtual,
  carregarDadosIniciais,
  selecionarOperadora,
  selecionarIntegracao,
  executarTeste,
  limparFormulario
} = useTesteAutenticacaoRede()

const integracaoSelecionada = computed(() => {
  return integracoesFiltradas.value.find(item => item.id === form.integrationId || item.id == form.integrationId) || null
})

const subtituloLogs = computed(() => {
  if (integracaoSelecionada.value) {
    return `Ultimos logs tecnicos da integracao REDE em ${integracaoSelecionada.value.ambiente}.`
  }

  return 'Historico tecnico recente dos testes de autenticacao e consulta.'
})

const erroTela = computed(() => erro.value || '')

const recarregarLogs = async () => {
  await selecionarIntegracao(form.integrationId)
}

onMounted(async () => {
  await carregarDadosIniciais()
})
</script>
