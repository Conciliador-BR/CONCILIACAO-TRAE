import { useEmpresas } from '../../useEmpresas'
import { useGlobalFilters } from '../../useGlobalFilters'

export const useEmpresaHelpers = () => {
  const { empresas, fetchEmpresas } = useEmpresas()
  const { filtrosGlobais } = useGlobalFilters()

  // Helper: obter nome, EC (matriz) e autorizadoras da empresa selecionada
  const obterEmpresaSelecionadaCompleta = async () => {
    console.log('🏢 [EMPRESA HELPERS] Obtendo empresa selecionada completa...')
    
    if (!empresas.value || empresas.value.length === 0) {
      console.log('🏢 [EMPRESA HELPERS] Empresas não carregadas, buscando...')
      await fetchEmpresas()
    }
    
    const id = filtrosGlobais.empresaSelecionada
    console.log('🏢 [EMPRESA HELPERS] ID da empresa selecionada:', id, '(tipo:', typeof id, ')')
    
    if (!id) {
      console.log('🏢 [EMPRESA HELPERS] Nenhuma empresa selecionada')
      return null
    }
    
    console.log('🏢 [EMPRESA HELPERS] Empresas disponíveis:', empresas.value.length)
    empresas.value.forEach((emp, index) => {
      console.log(`   ${index + 1}. ID: ${emp.id} (${typeof emp.id}) - Nome: "${emp.nome}" - Matriz: "${emp.matriz}" (${typeof emp.matriz})`)
    })
    
    const empresa = empresas.value.find(e => e.id == id)
    console.log('🏢 [EMPRESA HELPERS] Empresa encontrada:', empresa)
    
    if (!empresa) {
      console.log('🏢 [EMPRESA HELPERS] Empresa não encontrada para ID:', id)
      return null
    }
    
    const resultado = { 
      nome: empresa.nome, 
      matriz: empresa.matriz,
      autorizadoras: empresa.autorizadoras || ''
    }
    
    console.log('🏢 [EMPRESA HELPERS] Dados da empresa retornados:', resultado)
    return resultado
  }

  const obterOperadorasEmpresa = (empresa) => {
    if (!empresa?.autorizadoras) return []
    return empresa.autorizadoras.split(';').map(op => op.trim()).filter(op => op)
  }

  // Nova função para obter operadoras da empresa selecionada
  const obterOperadorasEmpresaSelecionada = async () => {
    const empresa = await obterEmpresaSelecionadaCompleta()
    if (!empresa) return []
    return obterOperadorasEmpresa(empresa)
  }

  return {
    empresas,
    fetchEmpresas,
    filtrosGlobais,
    obterEmpresaSelecionadaCompleta,
    obterOperadorasEmpresa,
    obterOperadorasEmpresaSelecionada
  }
}