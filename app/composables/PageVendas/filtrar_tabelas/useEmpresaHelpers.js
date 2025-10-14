import { useEmpresas } from '../../useEmpresas'
import { useGlobalFilters } from '../../useGlobalFilters'

export const useEmpresaHelpers = () => {
  const { empresas, fetchEmpresas } = useEmpresas()
  const { filtrosGlobais } = useGlobalFilters()

  // Helper: obter nome e EC (matriz) da empresa selecionada
  const obterEmpresaSelecionadaCompleta = async () => {
    if (!empresas.value || empresas.value.length === 0) {
      await fetchEmpresas()
    }
    const id = filtrosGlobais.empresaSelecionada
    if (!id) return null
    const empresa = empresas.value.find(e => e.id == id)
    if (!empresa) return null
    return { nome: empresa.nome, matriz: empresa.matriz }
  }

  const obterOperadorasEmpresa = (empresa) => {
    if (!empresa?.autorizadoras) return []
    return empresa.autorizadoras.split(';').map(op => op.trim()).filter(op => op)
  }

  return {
    empresas,
    fetchEmpresas,
    filtrosGlobais,
    obterEmpresaSelecionadaCompleta,
    obterOperadorasEmpresa
  }
}