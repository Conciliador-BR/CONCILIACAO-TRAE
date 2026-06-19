import { ref } from 'vue'
import { supabase } from '~/composables/PageVendas/useSupabaseConfig'

const createDefaultMeta = () => ({
  basePath: '/opt/conciliadora',
  serverHost: '',
  sshPublicKeyPath: '',
  statusDirs: ['inbox', 'processando', 'processados', 'erro'],
  supportDirs: [],
  summary: {
    totalAdquirentes: 0,
    totalEmpresas: 0,
    totalPastasStatusExistentes: 0,
    totalPastasStatusEsperadas: 0
  },
  rootExists: false
})

export const useServidorAcoes = () => {
  const estrutura = ref([])
  const meta = ref(createDefaultMeta())
  const carregandoEstrutura = ref(false)
  const processandoAcao = ref(false)
  const erro = ref('')

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession()
    const accessToken = String(data?.session?.access_token || '').trim()

    if (!accessToken) {
      throw new Error('Sessao expirada. Faca login novamente.')
    }

    return {
      Authorization: `Bearer ${accessToken}`
    }
  }

  const hydrateEstrutura = (data = {}) => {
    meta.value = {
      ...createDefaultMeta(),
      ...data,
      summary: {
        ...createDefaultMeta().summary,
        ...(data?.summary || {})
      }
    }
    estrutura.value = Array.isArray(data?.items) ? data.items : []
  }

  const executar = async (url, options = {}, stateRef = processandoAcao) => {
    stateRef.value = true
    erro.value = ''

    try {
      return await $fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          ...(await getAuthHeaders())
        }
      })
    } catch (err) {
      erro.value = err?.data?.statusMessage || err?.message || 'Falha ao executar a acao no servidor.'
      throw new Error(erro.value)
    } finally {
      stateRef.value = false
    }
  }

  const carregarEstrutura = async () => {
    const data = await executar('/api/cadastro/servidor/listar', { method: 'GET' }, carregandoEstrutura)
    hydrateEstrutura(data)
    return data
  }

  const criarEstrutura = async (payload) => {
    const data = await executar('/api/cadastro/servidor/criar', {
      method: 'POST',
      body: payload
    })

    if (data?.estrutura) {
      hydrateEstrutura(data.estrutura)
    }

    return data
  }

  const renomearEstrutura = async (payload) => {
    const data = await executar('/api/cadastro/servidor/renomear', {
      method: 'POST',
      body: payload
    })

    if (data?.estrutura) {
      hydrateEstrutura(data.estrutura)
    }

    return data
  }

  const excluirEstrutura = async (payload) => {
    const data = await executar('/api/cadastro/servidor/excluir', {
      method: 'POST',
      body: payload
    })

    if (data?.estrutura) {
      hydrateEstrutura(data.estrutura)
    }

    return data
  }

  return {
    estrutura,
    meta,
    erro,
    carregandoEstrutura,
    processandoAcao,
    carregarEstrutura,
    criarEstrutura,
    renomearEstrutura,
    excluirEstrutura
  }
}
