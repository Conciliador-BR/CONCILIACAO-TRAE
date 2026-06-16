import { computed, reactive, ref } from 'vue'
import { useIntegracoesEmpresaSupabase } from '~/composables/configuracoes/cadastro/useIntegracoesEmpresaSupabase'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

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

const parseSingleValue = (value) => {
  const items = parseList(value)
  return items.length === 1 ? items[0] : String(value || '').trim()
}

const extractErrorMessage = (error) => {
  return String(
    error?.data?.request?.response?.message
    || error?.data?.request?.response?.statusMessage
    || error?.data?.statusMessage
    || error?.message
    || 'Falha ao solicitar o opt-in.'
  ).trim()
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

  const companyNumbersNormalizados = computed(() => {
    const requestCompanyNumber = parseSingleValue(form.requestCompanyNumber)
    const listaInformada = parseList(form.companyNumbersText)
    if (!listaInformada.length && requestCompanyNumber) {
      return [requestCompanyNumber]
    }

    const listaFiltrada = listaInformada.filter(Boolean)
    return listaFiltrada.length ? listaFiltrada : (requestCompanyNumber ? [requestCompanyNumber] : [])
  })

  const preencherComIntegracao = (integracao) => {
    form.requestCompanyNumber = integracao?.ec_adquirente || integracao?.matriz || ''
    form.companyNumbersText = ''
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
    const requestCompanyNumberList = parseList(form.requestCompanyNumber)
    const requestCompanyNumber = parseSingleValue(form.requestCompanyNumber)
    const companyNumbers = companyNumbersNormalizados.value

    if (!form.integrationId) {
      lista.push('Selecione uma integracao da REDE.')
    }

    if (!String(requestCompanyNumber || '').trim()) {
      lista.push('Informe o PV/EC solicitante do opt-in.')
    } else if (requestCompanyNumberList.length !== 1) {
      lista.push('O campo PV / EC solicitante deve conter apenas um unico PV.')
    }

    if (!companyNumbers.length) {
      lista.push('Informe ao menos um PV em companyNumbers.')
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
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = String(sessionData?.session?.access_token || '').trim()
      if (!accessToken) {
        throw new Error('Sessao expirada. Faca login novamente.')
      }

      const response = await $fetch('/api/configuracoes/rede/solicitacao-optin', {
        method: 'POST',
        body: {
          integrationId: Number(form.integrationId),
          requestCompanyNumber: parseSingleValue(form.requestCompanyNumber),
          companyNumbers: companyNumbersNormalizados.value,
          requestType: String(form.requestType || 'P').toUpperCase(),
          permissions: String(form.permissions || 'R').toUpperCase(),
          timeoutMs: Number(form.timeoutMs) || 30000
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
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
      mensagem.value = extractErrorMessage(error)
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
    companyNumbersNormalizados,
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
