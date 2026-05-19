<template>
  <div class="space-y-6">
    <CadastroApiHero />

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div class="xl:col-span-8 space-y-6">
        <CadastroApiForm
          :form="form"
          :erros="erros"
          :salvando="salvandoIntegracao"
          :empresas="empresas"
          :adquirentes="opcoesAdquirentes"
          :vouchers="opcoesVouchers"
          @salvar="salvar"
          @limpar="limparFormulario"
        />

        <div
          v-if="mensagem"
          class="rounded-lg border px-4 py-3 text-sm"
          :class="sucesso ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'"
        >
          {{ mensagem }}
        </div>

        <div
          v-if="erroTela"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {{ erroTela }}
        </div>
      </div>

      <div class="xl:col-span-4">
        <CadastroApiResumo
          :form="form"
          :empresa-selecionada="empresaSelecionada"
        />
      </div>
    </div>

    <CadastroApiIntegracoesLista
      :integracoes="integracoes"
      :empresas="empresas"
      :loading="carregandoIntegracoes"
      @editar="editarIntegracao"
      @recarregar="recarregarIntegracoes"
    />

    <CadastroApiLogsLista
      :logs="logs"
      :loading="carregandoLogs"
      :subtitulo="subtituloLogs"
      @recarregar="recarregarLogs"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useEmpresas } from '~/composables/useEmpresas'
import { useIntegracoesEmpresaSupabase } from '~/composables/configuracoes/cadastro/useIntegracoesEmpresaSupabase'
import CadastroApiHero from './CadastroApiHero.vue'
import CadastroApiForm from './CadastroApiForm.vue'
import CadastroApiResumo from './CadastroApiResumo.vue'
import CadastroApiIntegracoesLista from './CadastroApiIntegracoesLista.vue'
import CadastroApiLogsLista from './CadastroApiLogsLista.vue'

const {
  integracoes,
  logs,
  erro,
  carregandoIntegracoes,
  carregandoLogs,
  salvandoIntegracao,
  normalizeIdentifier,
  listarIntegracoes,
  listarLogs,
  salvarIntegracao
} = useIntegracoesEmpresaSupabase()

const { empresas, fetchEmpresas } = useEmpresas()

const opcoesAdquirentes = [
  { id: 'cielo', label: 'Cielo', sigla: 'CI', cor: 'bg-blue-500' },
  { id: 'rede', label: 'Rede', sigla: 'RD', cor: 'bg-orange-600' },
  { id: 'getnet', label: 'Getnet', sigla: 'GN', cor: 'bg-purple-600' },
  { id: 'unica', label: 'Unica', sigla: 'UN', cor: 'bg-purple-700' },
  { id: 'stone', label: 'Stone', sigla: 'ST', cor: 'bg-gray-700' },
  { id: 'safra', label: 'Safra', sigla: 'SF', cor: 'bg-indigo-600' }
]

const opcoesVouchers = [
  { id: 'alelo', label: 'Alelo', sigla: 'AL', cor: 'bg-yellow-500' },
  { id: 'lecard', label: 'Lecard', sigla: 'LC', cor: 'bg-lime-500' },
  { id: 'pluxee', label: 'Pluxee', sigla: 'PL', cor: 'bg-cyan-500' },
  { id: 'vr', label: 'VR', sigla: 'VR', cor: 'bg-green-500' },
  { id: 'ticket', label: 'Ticket', sigla: 'TK', cor: 'bg-red-500' },
  { id: 'credshop', label: 'Credshop', sigla: 'CS', cor: 'bg-pink-600' },
  { id: 'cabal', label: 'Cabal', sigla: 'CB', cor: 'bg-yellow-400' },
  { id: 'greencard', label: 'Green Card', sigla: 'GC', cor: 'bg-green-600' }
]

const createDefaultForm = () => ({
  id: null,
  empresa_id: '',
  adquirente: 'rede',
  ambiente: 'sandbox',
  client_id: '',
  client_secret: '',
  nome_empresa: '',
  ec_adquirente: '',
  ativo: true,
  status_integracao: 'pendente',
  ultimo_erro: ''
})

const form = reactive(createDefaultForm())
const erros = ref([])
const mensagem = ref('')
const sucesso = ref(false)

const empresaSelecionada = computed(() => {
  return empresas.value.find(item => item.id === form.empresa_id || item.id == form.empresa_id) || null
})

const erroTela = computed(() => erro.value || '')

const subtituloLogs = computed(() => {
  if (form.id) {
    return 'Historico tecnico da integracao atualmente em edicao.'
  }

  if (empresaSelecionada.value) {
    return `Historico tecnico recente da empresa ${empresaSelecionada.value.nome}.`
  }

  return 'Historico tecnico mais recente das integracoes cadastradas.'
})

const limparFormulario = async () => {
  Object.assign(form, createDefaultForm())
  erros.value = []
  mensagem.value = ''
  sucesso.value = false
  await recarregarLogs()
}

const validar = () => {
  const lista = []

  if (!form.empresa_id) lista.push('Selecione uma empresa.')
  if (!form.adquirente) lista.push('Selecione uma adquirente.')

  if (normalizeIdentifier(form.adquirente) === 'rede') {
    if (!String(form.client_id || '').trim()) {
      lista.push('Informe o Client ID da REDE.')
    }

    if (!form.id && !String(form.client_secret || '').trim()) {
      lista.push('Informe o Client Secret da REDE.')
    }

    if (!String(form.ec_adquirente || '').trim()) {
      lista.push('Informe a EC da adquirente para a REDE.')
    }
  } else {
    lista.push('No momento, apenas a integracao da REDE esta liberada nesta tela.')
  }

  if (!['sandbox', 'producao'].includes(form.ambiente)) {
    lista.push('Selecione um ambiente valido.')
  }

  if (!['pendente', 'valida', 'erro'].includes(form.status_integracao)) {
    lista.push('Selecione um status valido.')
  }

  if (form.status_integracao === 'erro' && !String(form.ultimo_erro || '').trim()) {
    lista.push('Descreva o ultimo erro quando o status for `erro`.')
  }

  erros.value = lista
  return lista.length === 0
}

const preencherFormulario = (integracao) => {
  const adquirenteNormalizado = normalizeIdentifier(integracao?.adquirente)
  const adquirentePadrao = [...opcoesAdquirentes, ...opcoesVouchers].some(item => item.id === adquirenteNormalizado)

  Object.assign(form, {
    id: integracao?.id || null,
    empresa_id: integracao?.empresa_id || '',
    adquirente: adquirentePadrao ? adquirenteNormalizado : 'rede',
    ambiente: integracao?.ambiente || 'sandbox',
    client_id: integracao?.client_id || '',
    client_secret: '',
    nome_empresa: integracao?.nome_empresa || empresaSelecionada.value?.nome || '',
    ec_adquirente: integracao?.ec_adquirente || integracao?.ec_estabelecimento || '',
    ativo: !!integracao?.ativo,
    status_integracao: integracao?.status_integracao || 'pendente',
    ultimo_erro: integracao?.ultimo_erro || ''
  })
}

const editarIntegracao = async (integracao) => {
  preencherFormulario(integracao)
  mensagem.value = ''
  sucesso.value = false
  erros.value = []
  await recarregarLogs()
}

const recarregarIntegracoes = async () => {
  await listarIntegracoes()
}

const recarregarLogs = async () => {
  if (form.id) {
    await listarLogs({ integracaoId: form.id })
    return
  }

  if (form.empresa_id) {
    await listarLogs({ empresaId: form.empresa_id })
    return
  }

  await listarLogs()
}

const salvar = async () => {
  mensagem.value = ''
  sucesso.value = false

  if (!validar()) return

  try {
    const estavaEditando = !!form.id
    form.nome_empresa = empresaSelecionada.value?.nome || ''
    const resultado = await salvarIntegracao(form)
    preencherFormulario(resultado)
    sucesso.value = true
    mensagem.value = estavaEditando
      ? 'Integracao atualizada com sucesso.'
      : 'Integracao cadastrada com sucesso.'

    await Promise.all([
      recarregarIntegracoes(),
      recarregarLogs()
    ])
  } catch (error) {
    sucesso.value = false
    mensagem.value = error.message || 'Nao foi possivel salvar a integracao.'
  }
}

onMounted(async () => {
  await fetchEmpresas()
  await Promise.all([
    recarregarIntegracoes(),
    recarregarLogs()
  ])
})
</script>
