import { useEmpresas } from '~/composables/useEmpresas'
import { useGlobalFilters } from '~/composables/useGlobalFilters'

export const useEmpresaHelpers = () => {
  const { empresas, fetchEmpresas } = useEmpresas()
  const { filtrosGlobais } = useGlobalFilters()

  const obterEmpresaSelecionadaCompleta = async () => {
    if (!empresas.value || empresas.value.length === 0) {
      await fetchEmpresas()
    }
    const id = filtrosGlobais.empresaSelecionada
    if (!id) return null
    const empresa = empresas.value.find(e => e.id == id)
    if (!empresa) return null
    return {
      nome: empresa.nome,
      matriz: empresa.matriz,
      autorizadoras: empresa.autorizadoras || ''
    }
  }

  const obterOperadorasEmpresa = (empresa) => {
    if (!empresa?.autorizadoras) return []
    return empresa.autorizadoras.split(';').map(op => op.trim()).filter(op => op)
  }

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