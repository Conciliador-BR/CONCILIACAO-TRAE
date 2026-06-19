<template>
  <div class="space-y-6">
    <ServidorHeader />
    <ServidorResumo :meta="meta" />

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div class="space-y-6 xl:col-span-5">
        <ServidorFormularioEstrutura
          :form="createForm"
          :empresas="empresas"
          :adquirentes="adquirentes"
          :empresa-efetiva-nome="empresaEfetivaNome"
          :preview-path="previewPath"
          :processando="processando"
          @criar="handleCriarEstrutura"
          @atualizar="atualizarArvore"
        />

        <ServidorAcoesRapidas
          :selected-node="selectedNode"
          :rename-form="renameForm"
          :processando="processando"
          @renomear="handleRenomearEstrutura"
          @remover="solicitarExclusao()"
          @limpar-selecao="limparSelecao"
        />

        <ServidorLogsAcoes
          :logs="historicoAcoes"
          :mensagem="mensagem"
          :sucesso="sucesso"
        />
      </div>

      <div class="xl:col-span-7">
        <ServidorArvorePastas
          :items="estrutura"
          :selected-key="selectedNode?.key || ''"
          @selecionar-node="handleSelecionarNode"
          @renomear-node="handlePrepararRenomeacao"
          @remover-node="solicitarExclusao"
        />
      </div>
    </div>

    <ServidorConfirmacaoModal
      :aberto="modalExclusao.aberto"
      :titulo="modalExclusao.titulo"
      :descricao="modalExclusao.descricao"
      keyword="EXCLUIR"
      :loading="processando"
      @cancelar="fecharModalExclusao"
      @confirmar="confirmarExclusao"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useEmpresas } from '~/composables/useEmpresas'
import { useServidorAcoes } from '~/composables/configuracoes/cadastro/servidor/useServidorAcoes'
import { useServidorFeedback } from '~/composables/configuracoes/cadastro/servidor/useServidorFeedback'
import { useServidorForm } from '~/composables/configuracoes/cadastro/servidor/useServidorForm'
import { validarCriacaoServidor, validarRenomeacaoServidor } from '~/composables/configuracoes/cadastro/servidor/useServidorValidacao'
import ServidorAcoesRapidas from './ServidorAcoesRapidas.vue'
import ServidorArvorePastas from './ServidorArvorePastas.vue'
import ServidorConfirmacaoModal from './ServidorConfirmacaoModal.vue'
import ServidorFormularioEstrutura from './ServidorFormularioEstrutura.vue'
import ServidorHeader from './ServidorHeader.vue'
import ServidorLogsAcoes from './ServidorLogsAcoes.vue'
import ServidorResumo from './ServidorResumo.vue'

const adquirentes = [
  { id: 'cielo', label: 'Cielo' },
  { id: 'rede', label: 'Rede' },
  { id: 'stone', label: 'Stone' },
  { id: 'getnet', label: 'Getnet' },
  { id: 'safra', label: 'Safra' },
  { id: 'vr', label: 'VR' },
  { id: 'alelo', label: 'Alelo' },
  { id: 'ticket', label: 'Ticket' },
  { id: 'pluxee', label: 'Pluxee' },
  { id: 'lecard', label: 'Lecard' }
]

const { empresas, fetchEmpresas } = useEmpresas()
const {
  estrutura,
  meta,
  erro,
  carregandoEstrutura,
  processandoAcao,
  carregarEstrutura,
  criarEstrutura,
  renomearEstrutura,
  excluirEstrutura
} = useServidorAcoes()

const {
  mensagem,
  sucesso,
  historicoAcoes,
  limparMensagem,
  definirMensagem,
  registrarAcao
} = useServidorFeedback()

const basePath = computed(() => meta.value.basePath || '/opt/conciliadora')
const {
  createForm,
  renameForm,
  selectedNode,
  empresaEfetivaNome,
  previewPath,
  resetCreateForm,
  limparSelecao,
  selecionarNode,
  prepararRenomeacao
} = useServidorForm({ empresas, basePath })

const processando = computed(() => carregandoEstrutura.value || processandoAcao.value)

const modalExclusao = reactive({
  aberto: false,
  titulo: 'Remover pasta',
  descricao: '',
  node: null
})

const atualizarArvore = async () => {
  try {
    limparMensagem()
    await carregarEstrutura()
  } catch (error) {
    definirMensagem(error.message || 'Nao foi possivel atualizar a arvore de pastas.', false)
  }
}

const handleCriarEstrutura = async () => {
  const erros = validarCriacaoServidor({
    adquirente: createForm.adquirente,
    empresa: empresaEfetivaNome.value
  })

  if (erros.length > 0) {
    definirMensagem(erros.join(' '), false)
    return
  }

  try {
    const response = await criarEstrutura({
      adquirente: createForm.adquirente,
      empresa: empresaEfetivaNome.value
    })

    definirMensagem(response.message || 'Estrutura criada com sucesso.', true)
    registrarAcao({
      acao: 'Criar estrutura',
      alvo: response?.result?.companyPath || previewPath.value,
      detalhe: 'Pastas de status criadas automaticamente para a empresa.',
      ok: true
    })
    resetCreateForm()
  } catch (error) {
    definirMensagem(error.message || 'Nao foi possivel criar a estrutura.', false)
    registrarAcao({
      acao: 'Criar estrutura',
      alvo: previewPath.value,
      detalhe: error.message || 'Falha ao criar as pastas no servidor.',
      ok: false
    })
  }
}

const handleSelecionarNode = (node) => {
  selecionarNode(node)
}

const handlePrepararRenomeacao = (node) => {
  prepararRenomeacao(node)
  limparMensagem()
}

const handleRenomearEstrutura = async () => {
  const erros = validarRenomeacaoServidor({
    selectedNode: selectedNode.value,
    novoNome: renameForm.novoNome
  })

  if (erros.length > 0) {
    definirMensagem(erros.join(' '), false)
    return
  }

  try {
    const response = await renomearEstrutura({
      tipo: selectedNode.value.tipo,
      adquirenteAtual: selectedNode.value.adquirente,
      empresaAtual: selectedNode.value.empresa,
      novoNome: renameForm.novoNome
    })

    definirMensagem(response.message || 'Pasta renomeada com sucesso.', true)
    registrarAcao({
      acao: `Renomear ${selectedNode.value.tipo}`,
      alvo: selectedNode.value.path,
      detalhe: response?.result?.newPath || 'A pasta foi renomeada no servidor.',
      ok: true
    })
    limparSelecao()
  } catch (error) {
    definirMensagem(error.message || 'Nao foi possivel renomear a pasta.', false)
    registrarAcao({
      acao: `Renomear ${selectedNode.value?.tipo || 'pasta'}`,
      alvo: selectedNode.value?.path || '',
      detalhe: error.message || 'Falha ao renomear a pasta no servidor.',
      ok: false
    })
  }
}

const solicitarExclusao = (node = selectedNode.value) => {
  if (!node) {
    definirMensagem('Selecione uma pasta antes de solicitar a exclusao.', false)
    return
  }

  selecionarNode(node)
  modalExclusao.aberto = true
  modalExclusao.node = node
  modalExclusao.titulo = `Remover ${node.tipo}`
  modalExclusao.descricao = `A pasta ${node.path} sera removida do servidor. Esta acao remove todo o conteudo interno da pasta selecionada.`
}

const fecharModalExclusao = () => {
  modalExclusao.aberto = false
  modalExclusao.node = null
}

const confirmarExclusao = async (keyword) => {
  if (String(keyword || '').trim().toUpperCase() !== 'EXCLUIR') {
    definirMensagem('Digite EXCLUIR para confirmar a remocao da pasta.', false)
    return
  }

  const node = modalExclusao.node
  if (!node) return

  try {
    const response = await excluirEstrutura({
      tipo: node.tipo,
      adquirente: node.adquirente,
      empresa: node.empresa,
      confirmacao: 'EXCLUIR'
    })

    definirMensagem(response.message || 'Pasta removida com sucesso.', true)
    registrarAcao({
      acao: `Remover ${node.tipo}`,
      alvo: node.path,
      detalhe: 'A pasta foi removida do servidor com confirmacao manual.',
      ok: true
    })
    fecharModalExclusao()
    limparSelecao()
  } catch (error) {
    definirMensagem(error.message || 'Nao foi possivel remover a pasta.', false)
    registrarAcao({
      acao: `Remover ${node.tipo}`,
      alvo: node.path,
      detalhe: error.message || 'Falha ao remover a pasta no servidor.',
      ok: false
    })
  }
}

onMounted(async () => {
  await Promise.all([
    fetchEmpresas(),
    carregarEstrutura()
  ])

  if (erro.value) {
    definirMensagem(erro.value, false)
  }
})
</script>
