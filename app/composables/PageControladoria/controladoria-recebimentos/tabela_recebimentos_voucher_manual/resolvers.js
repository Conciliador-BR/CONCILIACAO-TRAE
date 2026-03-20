export const criarResolvers = ({ filtroAtivoRef, obterEmpresaSelecionadaCompleta, filtrosGlobais }) => {
  const resolverEmpresaNome = async () => {
    const nomeViaFiltroAtivo = filtroAtivoRef?.value?.empresa
    if (nomeViaFiltroAtivo) return nomeViaFiltroAtivo

    const empresaCompleta = await obterEmpresaSelecionadaCompleta()
    return empresaCompleta?.nome || ''
  }

  const resolverEmpresaEC = async () => {
    const ecViaFiltroAtivo = filtroAtivoRef?.value?.matriz
    if (ecViaFiltroAtivo) return ecViaFiltroAtivo

    const empresaCompleta = await obterEmpresaSelecionadaCompleta()
    return empresaCompleta?.matriz || ''
  }

  const resolverPeriodoTrabalho = () => {
    const filtro = filtroAtivoRef?.value
    let primeiroDia, ultimoDia

    if (filtro && filtro.dataInicial && filtro.dataFinal) {
      primeiroDia = filtro.dataInicial
      ultimoDia = filtro.dataFinal
    } else if (filtrosGlobais.dataInicial && filtrosGlobais.dataFinal) {
      primeiroDia = filtrosGlobais.dataInicial
      ultimoDia = filtrosGlobais.dataFinal
    } else if (filtrosGlobais.dataInicial && !filtrosGlobais.dataFinal) {
      primeiroDia = filtrosGlobais.dataInicial
      ultimoDia = filtrosGlobais.dataInicial
    } else {
      const hoje = new Date()
      primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
      ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]
    }

    const chaveMes = `${primeiroDia}`
    return { primeiroDia, ultimoDia, chaveMes }
  }

  return {
    resolverEmpresaNome,
    resolverEmpresaEC,
    resolverPeriodoTrabalho
  }
}

