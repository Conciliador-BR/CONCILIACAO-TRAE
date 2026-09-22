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
import { computed, ref, unref } from 'vue'
import ManualAutorizadaSection from '~/components/controladoria/manual_autorizada_shared/ManualAutorizadaSection.vue'
import RetificarConfirmacaoModal from '~/components/configuracoes/cadastro/retificar_tabelas_supabase/RetificarConfirmacaoModal.vue'

const props = defineProps({
  controller: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['deleted'])

const SENHA_EXCLUSAO = '848678'
const modalExclusaoAberto = ref(false)
const senhaExclusao = ref('')
const erroSenhaExclusao = ref('')

const nomeAdquirente = computed(() => String(unref(props.controller?.nomeAdquirente) || ''))
const empresaSelecionada = computed(() => Boolean(unref(props.controller?.empresaSelecionada)))
const linhas = computed(() => unref(props.controller?.linhas) || [])
const loading = computed(() => Boolean(unref(props.controller?.loading)))
const error = computed(() => String(unref(props.controller?.error) || ''))
const successMessage = computed(() => String(unref(props.controller?.successMessage) || ''))
const totais = computed(() => unref(props.controller?.totais) || {})

const carregarDados = (...args) => props.controller?.carregarDados?.(...args)
const enviarLinha = (...args) => props.controller?.enviarLinha?.(...args)
const excluirTabelaManual = (...args) => props.controller?.excluirTabelaManual?.(...args)
const atualizarNomeAdquirente = (...args) => props.controller?.atualizarNomeAdquirente?.(...args)
const temAlteracao = (...args) => props.controller?.temAlteracao?.(...args)
const atualizarInput = (...args) => props.controller?.atualizarInput?.(...args)
const focarInput = (...args) => props.controller?.focarInput?.(...args)
const blurInput = (...args) => props.controller?.blurInput?.(...args)

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
