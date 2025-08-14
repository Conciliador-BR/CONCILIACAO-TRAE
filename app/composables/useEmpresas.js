import { ref, computed } from 'vue'
import { useAPIsupabase } from './useAPIsupabase'

export const useEmpresas = () => {
  const { fetchData, insertData, updateData, deleteData, loading, error } = useAPIsupabase()
  
  // ✅ Inicializar como array vazio para evitar erros de SSR
  const empresas = ref([])
  const empresaSelecionada = ref('')

  // Buscar todas as empresas da tabela 'empresas'
  const fetchEmpresas = async () => {
    try {
      console.log('Iniciando busca de empresas...') // Debug
      const data = await fetchData('empresas', 'id, nome_empresa')
      
      console.log('Dados retornados do Supabase:', data) // Debug
      
      if (data && data.length > 0) {
        empresas.value = data.map(empresa => ({
          id: empresa.id,
          nome: empresa.nome_empresa  // ✅ Mapeia nome_empresa para nome
        }))
        console.log('Empresas mapeadas:', empresas.value) // Debug
      } else {
        console.warn('Nenhuma empresa encontrada no Supabase')
        empresas.value = []
      }
    } catch (err) {
      console.error('Erro ao buscar empresas:', err)
      empresas.value = []
    }
  }

  // Adicionar nova empresa
  const adicionarEmpresa = async (nomeEmpresa) => {
    try {
      const novaEmpresa = await insertData('empresas', {
        nome_empresa: nomeEmpresa
      })
      
      if (novaEmpresa && novaEmpresa.length > 0) {
        const empresaFormatada = {
          id: novaEmpresa[0].id,
          nome: novaEmpresa[0].nome_empresa
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
  const atualizarEmpresa = async (id, nomeEmpresa) => {
    try {
      const empresaAtualizada = await updateData('empresas', id, {
        nome_empresa: nomeEmpresa
      })
      
      if (empresaAtualizada && empresaAtualizada.length > 0) {
        const index = empresas.value.findIndex(e => e.id === id)
        if (index !== -1) {
          empresas.value[index] = {
            id: empresaAtualizada[0].id,
            nome: empresaAtualizada[0].nome_empresa
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
    return empresas.value.find(empresa => empresa.id === id)
  }

  // Função para obter empresa por nome
  const getEmpresaPorNome = (nome) => {
    return empresas.value.find(empresa => empresa.nome === nome)
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
    getEmpresaPorNome
  }
}