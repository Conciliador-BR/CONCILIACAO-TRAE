import { ref, computed } from 'vue'
import { useAPIsupabase } from './useAPIsupabase'

export const useEmpresas = () => {
  const { fetchData, insertData, updateData, deleteData, loading, error } = useAPIsupabase()
  
  const empresas = ref([])
  const empresaSelecionada = ref('')

  // Buscar todas as empresas da tabela 'empresas'
  const fetchEmpresas = async () => {
    try {
      error.value = null
      
      const data = await fetchData('empresas', 'id, nome_empresa, matriz_ec')
      
      if (data && Array.isArray(data) && data.length > 0) {
        const empresasValidas = data.filter(empresa => 
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
          matriz: empresa.matriz_ec || ''
        }))
        
      } else {
        empresas.value = []
        error.value = 'Nenhuma empresa encontrada no banco de dados'
      }
    } catch (err) {
      empresas.value = []
      if (err.message?.includes('relation "empresas" does not exist')) {
        error.value = 'Tabela de empresas não encontrada. Verifique a configuração do banco.'
      } else if (err.message?.includes('permission denied')) {
        error.value = 'Sem permissão para acessar dados das empresas.'
      } else {
        error.value = `Erro ao carregar empresas: ${err.message}`
      }
    }
  }

  // Adicionar nova empresa
  const adicionarEmpresa = async (nomeEmpresa, matrizEc = '') => {
    try {
      const novaEmpresa = await insertData('empresas', {
        nome_empresa: nomeEmpresa,
        matriz_ec: matrizEc
      })
      
      if (novaEmpresa && novaEmpresa.length > 0) {
        const empresaFormatada = {
          id: novaEmpresa[0].id,
          nome: novaEmpresa[0].nome_empresa,
          matriz: novaEmpresa[0].matriz_ec || ''
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
  const atualizarEmpresa = async (id, nomeEmpresa, matrizEc = '') => {
    try {
      const empresaAtualizada = await updateData('empresas', id, {
        nome_empresa: nomeEmpresa,
        matriz_ec: matrizEc
      })
      
      if (empresaAtualizada && empresaAtualizada.length > 0) {
        const index = empresas.value.findIndex(e => e.id === id)
        if (index !== -1) {
          empresas.value[index] = {
            id: empresaAtualizada[0].id,
            nome: empresaAtualizada[0].nome_empresa,
            matriz: empresaAtualizada[0].matriz_ec || ''
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