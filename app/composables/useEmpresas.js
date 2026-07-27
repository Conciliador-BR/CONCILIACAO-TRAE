import { ref, computed } from 'vue'
import { useAPIsupabase } from './useAPIsupabase'
import { useUserAccess } from './useUserAccess'

const empresas = ref([])
const empresaSelecionada = ref('')
let fetchEmpresasPromise = null
let empresasCarregadas = false

export const useEmpresas = () => {
  const { fetchData, insertData, updateData, deleteData, loading, error } = useAPIsupabase()
  const { userEmail, isMasterUser, ensureSession } = useUserAccess()

  const formatarCnpj = (value) => {
    const digits = String(value || '').replace(/\D/g, '')
    if (digits.length !== 14) return String(value || '')
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

// Buscar todas as empresas da tabela 'empresas'
  const fetchEmpresas = async (options = {}) => {
    const { force = false } = options

    if (!force) {
      if (fetchEmpresasPromise) {
        return fetchEmpresasPromise
      }

      if (empresasCarregadas && empresas.value.length > 0) {
        return empresas.value
      }
    }

    fetchEmpresasPromise = (async () => {
    try {
      await ensureSession()
      error.value = null
      
      // ✅ Incluir autorizadoras e bancos na consulta
      const data = await fetchData('empresas', 'id, nome_empresa, nome_matriz, matriz_ec, cnpj_empresa, autorizadoras, vouchers_cadastrados, bancos, email')
      
      if (data && Array.isArray(data) && data.length > 0) {
        const emailUsuario = String(userEmail.value || '').trim().toLowerCase()
        const empresasFiltradasPorAcesso = isMasterUser.value
          ? data
          : data.filter((empresa) => String(empresa?.email || '').trim().toLowerCase() === emailUsuario)

        const empresasValidas = empresasFiltradasPorAcesso.filter(empresa =>
          empresa && 
          empresa.id && 
          empresa.nome_empresa
        )
        
        if (empresasValidas.length === 0) {
          empresas.value = []
          return
        }
        
        empresas.value = empresasValidas.map(empresa => ({
          id: empresa.id,
          nome: empresa.nome_empresa.trim(),
          nomeMatriz: empresa.nome_matriz?.trim() || '',
          matriz: empresa.matriz_ec || '',
          cnpj: formatarCnpj(empresa.cnpj_empresa),
          autorizadoras: empresa.autorizadoras || '',
          vouchersCadastrados: empresa.vouchers_cadastrados || '',
          bancos: empresa.bancos || '',
          email: empresa.email || '',
          // ✅ Criar display formatado: "Nome Empresa - Nome Matriz - Matriz EC"
          displayName: `${empresa.nome_empresa.trim()}${empresa.nome_matriz ? ` - ${empresa.nome_matriz.trim()}` : ''} - EC ${empresa.matriz_ec || 'N/A'}${empresa.cnpj_empresa ? ` - CNPJ ${formatarCnpj(empresa.cnpj_empresa)}` : ''}`
        }))
        empresasCarregadas = true
        
      } else {
        empresas.value = []
        empresasCarregadas = true
        error.value = 'Nenhuma empresa encontrada no banco de dados'
      }

      return empresas.value
    } catch (err) {
      empresas.value = []
      empresasCarregadas = false
      if (err.message?.includes('relation "empresas" does not exist')) {
        error.value = 'Tabela de empresas não encontrada. Verifique a configuração do banco.'
      } else if (err.message?.includes('permission denied')) {
        error.value = 'Sem permissão para acessar dados das empresas.'
      } else {
        error.value = `Erro ao carregar empresas: ${err.message}`
      }

      return []
    } finally {
      fetchEmpresasPromise = null
    }
    })()

    return fetchEmpresasPromise
  }

  // Adicionar nova empresa
  const adicionarEmpresa = async (nomeEmpresa, nomeMatriz = '', matrizEc = '') => {
    try {
      const novaEmpresa = await insertData('empresas', {
        nome_empresa: nomeEmpresa,
        nome_matriz: nomeMatriz,
        matriz_ec: matrizEc
      })
      
      if (novaEmpresa && novaEmpresa.length > 0) {
        empresasCarregadas = true
        const empresaFormatada = {
          id: novaEmpresa[0].id,
          nome: novaEmpresa[0].nome_empresa,
          nomeMatriz: novaEmpresa[0].nome_matriz || '',
          matriz: novaEmpresa[0].matriz_ec || '',
          displayName: `${novaEmpresa[0].nome_empresa}${novaEmpresa[0].nome_matriz ? ` - ${novaEmpresa[0].nome_matriz}` : ''} - ${novaEmpresa[0].matriz_ec || ''}`
        }
        empresas.value.push(empresaFormatada)
        return empresaFormatada
      }
    } catch (err) {
      console.error('Erro ao adicionar empresa:', err)
      return null
    }
  }

  // Atualizar empresa
  const atualizarEmpresa = async (id, nomeEmpresa, nomeMatriz = '', matrizEc = '') => {
    try {
      const empresaAtualizada = await updateData('empresas', id, {
        nome_empresa: nomeEmpresa,
        nome_matriz: nomeMatriz,
        matriz_ec: matrizEc
      })
      
      if (empresaAtualizada && empresaAtualizada.length > 0) {
        empresasCarregadas = true
        const index = empresas.value.findIndex(e => e.id === id)
        if (index !== -1) {
          empresas.value[index] = {
            id: empresaAtualizada[0].id,
            nome: empresaAtualizada[0].nome_empresa,
            nomeMatriz: empresaAtualizada[0].nome_matriz || '',
            matriz: empresaAtualizada[0].matriz_ec || '',
            displayName: `${empresaAtualizada[0].nome_empresa}${empresaAtualizada[0].nome_matriz ? ` - ${empresaAtualizada[0].nome_matriz}` : ''} - ${empresaAtualizada[0].matriz_ec || ''}`
          }
        }
        return empresas.value[index]
      }
    } catch (err) {
      console.error('Erro ao atualizar empresa:', err)
      return null
    }
  }

  // Remover empresa
  const removerEmpresa = async (id) => {
    try {
      const sucesso = await deleteData('empresas', id)
      if (sucesso) {
        empresasCarregadas = true
        const index = empresas.value.findIndex(e => e.id === id)
        if (index !== -1) {
          empresas.value.splice(index, 1)
        }
      }
      return sucesso
    } catch (err) {
      console.error('Erro ao remover empresa:', err)
      return false
    }
  }

  // Função para obter empresa por ID
  const getEmpresaPorId = (id) => {
    if (!id) return null
    return empresas.value.find(empresa => empresa.id === id || empresa.id == id)
  }

  // Função para obter empresa por nome
  const getEmpresaPorNome = (nome) => {
    if (!nome) return null
    const nomeNormalizado = nome.trim()
    return empresas.value.find(empresa => 
      empresa.nome.trim().toLowerCase() === nomeNormalizado.toLowerCase()
    )
  }

  // Função para obter dados completos da empresa por nome
  const getEmpresaCompletaPorNome = (nome) => {
    return empresas.value.find(empresa => empresa.nome === nome)
  }

  // Função para determinar o valor do campo matriz baseado na empresa selecionada
  const getValorMatrizPorEmpresa = (nomeEmpresa) => {
    if (!empresas.value || empresas.value.length === 0) {
      return ''
    }
    
    const empresa = empresas.value.find(emp => emp.nome === nomeEmpresa)
    return empresa ? (empresa.matriz || '') : ''
  }

  // Computed para nome da empresa selecionada
  const empresaSelecionadaNome = computed(() => {
    if (!empresaSelecionada.value) return ''
    const empresa = empresas.value.find(e => e.id == empresaSelecionada.value)
    return empresa ? empresa.nome : ''
  })

  return {
    empresas,
    empresaSelecionada,
    empresaSelecionadaNome,
    loading,
    error,
    fetchEmpresas,
    adicionarEmpresa,
    atualizarEmpresa,
    removerEmpresa,
    getEmpresaPorId,
    getEmpresaPorNome,
    getEmpresaCompletaPorNome,
    getValorMatrizPorEmpresa
  }
}
