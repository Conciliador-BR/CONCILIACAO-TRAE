<template>
  <div class="space-y-6">
    <TesteAutenticacaoHero />

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div class="xl:col-span-8 space-y-6">
        <TesteAutenticacaoForm
          :form="form"
          :erros="erros"
          :integracoes="integracoesRede"
          :executando="executandoTeste"
          @executar="executarTeste"
          @limpar="limparFormulario"
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
          :status-resumo="statusResumo"
        />

        <TesteAutenticacaoSandboxHelp
          @preset-vendas="usarPresetVendasSandbox"
          @preset-nsu="usarPresetVendasNsuSandbox"
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
import TesteAutenticacaoSandboxHelp from './TesteAutenticacaoSandboxHelp.vue'
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
  integracoes,
  logs,
  carregandoLogs,
  executandoTeste,
  resultadoTeste,
  resultadoNormalizado,
  quantidadeRegistros,
  statusResumo,
  vendasImportacaoRows,
  recebimentosImportacaoRows,
  carregarDadosIniciais,
  selecionarIntegracao,
  usarPresetVendasSandbox,
  usarPresetVendasNsuSandbox,
  executarTeste,
  limparFormulario
} = useTesteAutenticacaoRede()

const integracoesRede = computed(() => {
  return (integracoes.value || []).filter(item => String(item.adquirente || '').toLowerCase() === 'rede')
})

const integracaoSelecionada = computed(() => {
  return integracoesRede.value.find(item => item.id === form.integrationId || item.id == form.integrationId) || null
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
