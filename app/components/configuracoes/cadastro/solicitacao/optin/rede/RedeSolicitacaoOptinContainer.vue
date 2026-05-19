<template>
  <div class="space-y-6">
    <RedeSolicitacaoOptinHero />

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div class="xl:col-span-8 space-y-6">
        <RedeSolicitacaoOptinForm
          :form="form"
          :erros="erros"
          :integracoes="integracoesRede"
          :executando="executandoSolicitacao"
          @executar="executarSolicitacao"
          @limpar="limparFormulario"
          @selecionar-integracao="selecionarIntegracao"
        />

        <RedeSolicitacaoOptinResultado
          :resultado="resultadoSolicitacao"
          :mensagem="mensagem"
          :sucesso="sucesso"
        />
      </div>

      <div class="xl:col-span-4 space-y-6">
        <RedeSolicitacaoOptinResumo
          :form="form"
          :integracao-selecionada="integracaoSelecionada"
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
import { useSolicitacaoOptin } from '~/composables/configuracoes/cadastro/useSolicitacaoOptin'
import RedeSolicitacaoOptinForm from './RedeSolicitacaoOptinForm.vue'
import RedeSolicitacaoOptinHero from './RedeSolicitacaoOptinHero.vue'
import RedeSolicitacaoOptinResumo from './RedeSolicitacaoOptinResumo.vue'
import RedeSolicitacaoOptinResultado from './RedeSolicitacaoOptinResultado.vue'

const {
  form,
  erros,
  erro,
  logs,
  mensagem,
  sucesso,
  integracoesRede,
  integracaoSelecionada,
  carregandoLogs,
  executandoSolicitacao,
  resultadoSolicitacao,
  carregarDadosIniciais,
  selecionarIntegracao,
  executarSolicitacao,
  limparFormulario
} = useSolicitacaoOptin()

const erroTela = computed(() => erro.value || '')

const subtituloLogs = computed(() => {
  if (integracaoSelecionada.value) {
    return `Ultimos logs de opt-in da integracao REDE em ${integracaoSelecionada.value.ambiente}.`
  }

  return 'Historico tecnico recente das solicitacoes de opt-in.'
})

const recarregarLogs = async () => {
  await selecionarIntegracao(form.integrationId)
}

onMounted(async () => {
  await carregarDadosIniciais()
})
</script>
