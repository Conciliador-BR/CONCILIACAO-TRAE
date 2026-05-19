import { computed, reactive, ref } from 'vue'
import { useIntegracoesEmpresaSupabase } from '~/composables/configuracoes/cadastro/useIntegracoesEmpresaSupabase'

const parseList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(item => String(item || '').trim())
      .filter(Boolean)
  }

  return String(value || '')
    .split(/[\n,;]+/g)
    .map(item => item.trim())
    .filter(Boolean)
}

export const useSolicitacaoOptin = () => {
  const {
    integracoes,
    logs,
    erro,
    carregandoIntegracoes,
    carregandoLogs,
    listarIntegracoes,
    listarLogs
  } = useIntegracoesEmpresaSupabase()

  const executandoSolicitacao = ref(false)
  const resultadoSolicitacao = ref(null)
  const mensagem = ref('')
  const sucesso = ref(false)
  const erros = ref([])

  const createDefaultForm = () => ({
    integrationId: '',
    requestCompanyNumber: '',
    companyNumbersText: '',
    requestType: 'P',
    permissions: 'R',
    timeoutMs: 30000
  })

  const form = reactive(createDefaultForm())

  const integracoesRede = computed(() => {
    return (integracoes.value || []).filter(item => String(item.adquirente || '').toLowerCase() === 'rede')
  })

  const integracaoSelecionada = computed(() => {
    return integracoesRede.value.find(item => item.id === form.integrationId || item.id == form.integrationId) || null
  })

  const preencherComIntegracao = (integracao) => {
    form.requestCompanyNumber = integracao?.request_company_number || ''
    const companyNumbers = integracao?.ec_adquirente || integracao?.ec_estabelecimento
      ? [integracao.ec_adquirente || integracao.ec_estabelecimento]
      : []
    form.companyNumbersText = companyNumbers.join('\n')
  }

  const limparFormulario = () => {
    Object.assign(form, createDefaultForm())
    resultadoSolicitacao.value = null
    mensagem.value = ''
    sucesso.value = false
    erros.value = []
  }

  const carregarDadosIniciais = async () => {
    await Promise.all([
      listarIntegracoes(),
      listarLogs({ limit: 12 })
    ])
  }

  const selecionarIntegracao = async (integrationId) => {
    form.integrationId = integrationId || ''
    resultadoSolicitacao.value = null
    mensagem.value = ''
    sucesso.value = false
    erros.value = []

    const integracao = integracoesRede.value.find(item => item.id === integrationId || item.id == integrationId)
    if (integracao) {
      preencherComIntegracao(integracao)
      await listarLogs({ integracaoId: integrationId, limit: 12 })
      return
    }

    await listarLogs({ limit: 12 })
  }

  const validar = () => {
    const lista = []

    if (!form.integrationId) {
      lista.push('Selecione uma integracao da REDE.')
    }

    if (!String(form.requestCompanyNumber || '').trim()) {
      lista.push('Informe o PV/EC solicitante do opt-in.')
    }

    if (!parseList(form.companyNumbersText).length) {
      lista.push('Informe ao menos um EC em companyNumbers.')
    }

    if (!['P'].includes(String(form.requestType || '').toUpperCase())) {
      lista.push('O requestType suportado nesta tela e `P`.')
    }

    if (!['R'].includes(String(form.permissions || '').toUpperCase())) {
      lista.push('A permissao suportada nesta tela e `R`.')
    }

    erros.value = lista
    return lista.length === 0
  }

  const executarSolicitacao = async () => {
    resultadoSolicitacao.value = null
    mensagem.value = ''
    sucesso.value = false

    if (!validar()) return

    executandoSolicitacao.value = true

    try {
      const response = await $fetch('/api/configuracoes/solicitacao-optin', {
        method: 'POST',
        body: {
          integrationId: Number(form.integrationId),
          requestCompanyNumber: String(form.requestCompanyNumber || '').trim(),
          companyNumbers: parseList(form.companyNumbersText),
          requestType: String(form.requestType || 'P').toUpperCase(),
          permissions: String(form.permissions || 'R').toUpperCase(),
          timeoutMs: Number(form.timeoutMs) || 30000
        }
      })

      resultadoSolicitacao.value = response
      mensagem.value = 'Solicitacao de opt-in enviada com sucesso.'
      sucesso.value = true

      await Promise.all([
        listarIntegracoes(),
        listarLogs({ integracaoId: form.integrationId, limit: 12 })
      ])
    } catch (error) {
      resultadoSolicitacao.value = error?.data || null
      mensagem.value = error?.data?.statusMessage || error?.message || 'Falha ao solicitar o opt-in.'
      sucesso.value = false

      await Promise.all([
        listarIntegracoes(),
        listarLogs({ integracaoId: form.integrationId, limit: 12 })
      ])
    } finally {
      executandoSolicitacao.value = false
    }
  }

  return {
    form,
    erros,
    erro,
    logs,
    mensagem,
    sucesso,
    integracoesRede,
    integracaoSelecionada,
    carregandoIntegracoes,
    carregandoLogs,
    executandoSolicitacao,
    resultadoSolicitacao,
    carregarDadosIniciais,
    selecionarIntegracao,
    executarSolicitacao,
    limparFormulario
  }
}
