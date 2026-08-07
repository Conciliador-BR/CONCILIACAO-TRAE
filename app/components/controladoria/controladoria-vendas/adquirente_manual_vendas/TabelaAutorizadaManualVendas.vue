<template>
  <ManualAutorizadaSection
    title="Autorizada Manual"
    subtitle="Lancamentos manuais por bandeira para adquirentes de cartao"
    :nome-adquirente="nomeAdquirente"
    :empresa-selecionada="empresaSelecionada"
    :loading="loading"
    :error="error"
    :success-message="successMessage"
    :linhas="linhas"
    :totais="totais"
    :pode-excluir="Boolean(nomeAdquirente)"
    :atualizar-input="atualizarInput"
    :focar-input="focarInput"
    :blur-input="blurInput"
    :tem-alteracao="temAlteracao"
    @update:nome-adquirente="atualizarNomeAdquirente($event)"
    @reload="carregarDados"
    @send-row="enviarLinha"
    @request-delete="abrirModalExclusao"
  />

  <RetificarConfirmacaoModal
    :open="modalExclusaoAberto"
    title="Excluir tabela manual?"
    subtitle="Essa acao remove todos os valores manuais desta autorizada no contexto atual."
    :message="mensagemExclusao"
    confirm-label="Excluir tabela"
    variant="danger"
    :loading="loading"
    require-password
    :password="senhaExclusao"
    :password-error="erroSenhaExclusao"
    @cancel="fecharModalExclusao"
    @confirm="confirmarExclusao"
    @update:password="senhaExclusao = $event"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useVendas } from '~/composables/useVendas'
import ManualAutorizadaSection from '~/components/controladoria/controladoria-vendas/adquirente_manual_vendas/ManualAutorizadaSection.vue'
import RetificarConfirmacaoModal from '~/components/configuracoes/cadastro/retificar_tabelas_supabase/RetificarConfirmacaoModal.vue'
import { useManualAutorizadaVendas } from '~/composables/PageControladoria/controladoria-vendas/adquirente_manual_vendas/useManualAutorizadaVendas'

const { filtroAtivo } = useVendas()
const emit = defineEmits(['deleted'])
const SENHA_EXCLUSAO = '848678'
const modalExclusaoAberto = ref(false)
const senhaExclusao = ref('')
const erroSenhaExclusao = ref('')

const {
  nomeAdquirente,
  empresaSelecionada,
  linhas,
  loading,
  error,
  successMessage,
  totais,
  carregarDados,
  enviarLinha,
  excluirTabelaManual,
  atualizarNomeAdquirente,
  temAlteracao,
  atualizarInput,
  focarInput,
  blurInput
} = useManualAutorizadaVendas(filtroAtivo)

const mensagemExclusao = computed(() => {
  return nomeAdquirente.value
    ? `Digite a senha para excluir a tabela manual ${nomeAdquirente.value} e remover seus valores do Supabase.`
    : 'Digite a senha para excluir esta tabela manual e remover seus valores do Supabase.'
})

const abrirModalExclusao = () => {
  erroSenhaExclusao.value = ''
  senhaExclusao.value = ''
  modalExclusaoAberto.value = true
}

const fecharModalExclusao = () => {
  modalExclusaoAberto.value = false
  senhaExclusao.value = ''
  erroSenhaExclusao.value = ''
}

const confirmarExclusao = async () => {
  if (senhaExclusao.value !== SENHA_EXCLUSAO) {
    erroSenhaExclusao.value = 'Senha incorreta.'
    return
  }

  erroSenhaExclusao.value = ''
  const sucesso = await excluirTabelaManual()
  if (!sucesso) return

  fecharModalExclusao()
  emit('deleted')
}
</script>
