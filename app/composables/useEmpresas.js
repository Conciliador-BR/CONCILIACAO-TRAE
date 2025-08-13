export const useEmpresas = () => {
  // Lista de empresas
  const empresas = [
    { id: 1, nome: 'UNIMED SUPERMERCADOS LTDA' },
    { id: 2, nome: 'EMPRESA TECH SOLUTIONS' },
    { id: 3, nome: 'COMERCIAL MODERNA LTDA' },
    { id: 4, nome: 'INDUSTRIA ALIMENTICIA SA' },
    { id: 5, nome: 'SERVICOS PROFISSIONAIS ME' },
    { id: 6, nome: 'DISTRIBUIDORA NACIONAL' },
    { id: 7, nome: 'CONSTRUTORA REGIONAL' },
    { id: 8, nome: 'FARMACIA POPULAR LTDA' },
    { id: 9, nome: 'AUTOPEÇAS BRASIL SA' },
    { id: 10, nome: 'CONFECCOES MODERNAS' },
    { id: 11, nome: 'MATERIAL CONSTRUCAO' },
    { id: 12, nome: 'CLINICA MEDICA INTEGRADA' },
    { id: 13, nome: 'ESCOLA PARTICULAR LTDA' },
    { id: 14, nome: 'PADARIA E CONFEITARIA' },
    { id: 15, nome: 'POSTO DE COMBUSTIVEL' }
  ]

  // Função para obter todas as empresas
  const getEmpresas = () => {
    return empresas
  }

  // Função para obter empresa por ID
  const getEmpresaPorId = (id) => {
    return empresas.find(empresa => empresa.id === id)
  }

  // Função para obter empresa por nome
  const getEmpresaPorNome = (nome) => {
    return empresas.find(empresa => empresa.nome === nome)
  }

  return {
    getEmpresas,
    getEmpresaPorId,
    getEmpresaPorNome
  }
}