const normalizarTexto = (valor) => {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const normalizarEc = (valor) => {
  return String(valor || '').replace(/[^\d]/g, '')
}

const compararRecencia = (a, b) => {
  const dataA = new Date(a?.updated_at || a?.created_at || 0).getTime()
  const dataB = new Date(b?.updated_at || b?.created_at || 0).getTime()
  return dataB - dataA
}

const pontuarIntegracao = (integracao, nomeEmpresa, ecEmpresa) => {
  let score = 0

  const nomeIntegracao = normalizarTexto(integracao?.nome_empresa)
  const nomeSelecionado = normalizarTexto(nomeEmpresa)
  const matrizIntegracao = normalizarEc(integracao?.matriz)
  const ecAdquirente = normalizarEc(integracao?.ec_adquirente)
  const ecSelecionada = normalizarEc(ecEmpresa)
  const statusIntegracao = normalizarTexto(integracao?.status_integracao)

  if (nomeIntegracao && nomeSelecionado) {
    if (nomeIntegracao === nomeSelecionado) score += 100
    else if (nomeIntegracao.includes(nomeSelecionado) || nomeSelecionado.includes(nomeIntegracao)) score += 70
  }

  if (ecSelecionada) {
    if (matrizIntegracao && matrizIntegracao === ecSelecionada) score += 120
    else if (ecAdquirente && ecAdquirente === ecSelecionada) score += 40
  }

  if (integracao?.ativo) score += 20
  if (statusIntegracao === 'valida') score += 15

  return score
}

export const useSeletorIntegracaoEmpresa = () => {
  const selecionarIntegracao = ({
    integracoes = [],
    adquirente = '',
    nomeEmpresa = '',
    ecEmpresa = ''
  }) => {
    const adquirenteNormalizado = normalizarTexto(adquirente)
    const nomeEmpresaNormalizado = normalizarTexto(nomeEmpresa)
    const ecEmpresaNormalizada = normalizarEc(ecEmpresa)

    const integracoesAdquirente = (integracoes || []).filter((item) => {
      return normalizarTexto(item?.adquirente) === adquirenteNormalizado
    })

    const candidatosNome = integracoesAdquirente.filter((item) => {
      const nomeIntegracao = normalizarTexto(item?.nome_empresa)
      if (!nomeEmpresaNormalizado) return true
      return nomeIntegracao.includes(nomeEmpresaNormalizado) || nomeEmpresaNormalizado.includes(nomeIntegracao)
    })

    const candidatosPorMatriz = candidatosNome.filter((item) => {
      if (!ecEmpresaNormalizada) return true
      return normalizarEc(item?.matriz) === ecEmpresaNormalizada
    })

    const candidatosPorEcAdquirente = candidatosNome.filter((item) => {
      if (!ecEmpresaNormalizada) return false
      return normalizarEc(item?.ec_adquirente) === ecEmpresaNormalizada
    })

    const baseCandidatos = candidatosPorMatriz.length
      ? candidatosPorMatriz
      : (candidatosPorEcAdquirente.length ? candidatosPorEcAdquirente : candidatosNome)

    const ordenados = [...baseCandidatos].sort((a, b) => {
      const score = pontuarIntegracao(b, nomeEmpresa, ecEmpresa) - pontuarIntegracao(a, nomeEmpresa, ecEmpresa)
      if (score !== 0) return score
      return compararRecencia(a, b)
    })

    let criterio = 'nome_empresa'
    if (candidatosPorMatriz.length) criterio = 'nome_empresa + matriz'
    else if (candidatosPorEcAdquirente.length) criterio = 'nome_empresa + ec_adquirente'

    return {
      integracao: ordenados[0] || null,
      candidatos: ordenados,
      criterio
    }
  }

  return {
    normalizarTexto,
    normalizarEc,
    selecionarIntegracao
  }
}
