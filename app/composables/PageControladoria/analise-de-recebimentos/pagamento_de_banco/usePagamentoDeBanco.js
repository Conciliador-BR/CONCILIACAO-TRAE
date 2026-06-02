import {
  detectarAgrupamentoResumoBradesco,
  detectarAgrupamentoResumoTribanco,
  detectarBandeiraCabal,
  detectarBandeiraRede,
  detectarBandeiraTribanco,
  detectarBandeiraUnica,
  mapearAdquirenteParaGrupo,
  normalizarBandeiraParaConferencia,
  normalizarChaveAdquirente,
  normalizarGrupoAdquirente,
  parseValorExtrato
} from '~/composables/PageControladoria/controladoria-recebimentos/recebimentoscontainer/recebimentosUtils'

const addUniqueLabel = (target, value) => {
  const label = String(value || '').trim()
  if (!label) return
  if (!target.includes(label)) target.push(label)
}

const ehVrProcessamentoCaixa = (transacao) => {
  const banco = normalizarChaveAdquirente(transacao?.banco)
  if (banco !== 'CAIXA') return false

  const descricao = String(transacao?.descricao || '')
  const documento = String(transacao?.documento ?? transacao?.doc ?? transacao?.document ?? '')
  const texto = normalizarChaveAdquirente(`${descricao} ${documento}`.trim())
  if (!texto) return false

  return (
    texto.includes('VR BENEFICIOS E SERVICOS DE PROCESSAMENT') ||
    (texto.includes('VR BENEFICIOS') && texto.includes('PROCESSAMENT'))
  )
}

const formatarPagamentoCieloSicoob = (descricaoNorm) => {
  const ehDebito = /\b(DEB|DEBITO|DBTO)\b/.test(descricaoNorm)
  const ehCredito = /\b(CREDITO|CRED|CRTO)\b/.test(descricaoNorm)
  const pat = descricaoNorm.match(/\b(VISA|MASTERCARD|MASTER|ELO|MAESTRO)\s+PAT\b|\bPAT\s+(VISA|MASTERCARD|MASTER|ELO|MAESTRO)\b/)
  if (pat) {
    const bandeiraPat = (pat[1] || pat[2] || '').trim()
    if (bandeiraPat === 'MASTER') return 'MASTERCARD PAT'
    return `${bandeiraPat} PAT`
  }

  if (ehDebito && /\bVISA\b/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (ehDebito && /\b(MAESTRO|MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MAESTRO'
  if (ehDebito && /\bELO\b/.test(descricaoNorm)) return 'ELO DEBITO'

  if (ehCredito && /\bVISA\b/.test(descricaoNorm)) return 'VISA'
  if (ehCredito && /\b(MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MASTERCARD'
  if (ehCredito && /\bELO\b/.test(descricaoNorm)) return 'ELO CREDITO'

  if (/\bVISA\b/.test(descricaoNorm)) return 'VISA'
  if (/\b(MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MASTERCARD'
  if (/\bMAESTRO\b/.test(descricaoNorm)) return 'MAESTRO'
  if (/\bELO\b/.test(descricaoNorm)) return 'ELO CREDITO'
  return 'CIELO'
}

export const formatarPagtoBanco = (labels = [], fallback = '') => {
  const unicos = []
  for (const label of Array.isArray(labels) ? labels : []) {
    addUniqueLabel(unicos, label)
  }

  if (unicos.length > 0) return unicos.join(' / ')
  return String(fallback || '').trim()
}

export const consolidarPagamentosBancoNormalizados = (depositosGrupo, grupoAdquirente) => {
  const valores = {}
  const labels = {}

  for (const [nome, info] of Object.entries(depositosGrupo?.bandeiras || {})) {
    const chave = normalizarBandeiraParaConferencia(nome, grupoAdquirente)
    const valor = typeof info === 'number' ? info : Number(info?.valor || 0)
    valores[chave] = (valores[chave] || 0) + valor

    if (!labels[chave]) labels[chave] = []
    if (typeof info === 'number') {
      addUniqueLabel(labels[chave], nome)
      continue
    }

    const pagamentos = Array.isArray(info?.pagamentos) ? info.pagamentos : [nome]
    pagamentos.forEach((pagamento) => addUniqueLabel(labels[chave], pagamento))
  }

  return { valores, labels }
}

export const criarMapaPagamentosBanco = (transacoes = [], detectarAdquirente) => {
  const map = {}

  for (const transacao of transacoes || []) {
    if (ehVrProcessamentoCaixa(transacao)) continue

    const valor = parseValorExtrato(transacao)
    if (!valor || valor <= 0) continue

    const bancoStr = String(transacao?.banco || '')
    const descricao = String(transacao?.descricao || '')
    const documento = String(transacao?.documento ?? transacao?.doc ?? transacao?.document ?? '')
    const contexto = `${descricao} ${documento}`.trim()
    const descricaoUpper = descricao.toUpperCase()
    const descricaoNorm = normalizarChaveAdquirente(descricao)
    const bancoNormalizado = normalizarChaveAdquirente(bancoStr)
    const isBradesco = bancoNormalizado.includes('BRADESCO')
    const isCieloSicoob = bancoNormalizado.includes('SICOOB') && /\bCIELO\b/.test(descricaoNorm)
    const classificacaoResumoBradesco = isBradesco ? detectarAgrupamentoResumoBradesco(descricao) : null

    const detector = typeof detectarAdquirente === 'function'
      ? detectarAdquirente(contexto, transacao?.banco)
      : null

    const baseDetectado = detector?.base || (transacao?.adquirente_detectado ? String(transacao.adquirente_detectado) : '')
    const categoriaDetectada = detector?.categoria || (transacao?.categoria_detectada ? String(transacao.categoria_detectada) : '')

    let base = baseDetectado
    let categoria = categoriaDetectada || ''

    if (!base) {
      if (descricaoUpper.includes('BANCO VR')) {
        base = 'VR BENEFICIOS'
        categoria = 'Voucher'
      } else if (descricaoUpper.includes('LE CARD ADM')) {
        base = 'LE CARD ADMINISTRADORA'
        categoria = 'Voucher'
      } else if (
        descricaoUpper.includes('CRTO CABAL SICOOB SO') ||
        descricaoUpper.includes('CABAL CABA')
      ) {
        base = 'CABAL PRE'
        categoria = 'Voucher'
      } else if (isCieloSicoob) {
        base = 'CIELO'
        categoria = 'Cartao'
      } else if (classificacaoResumoBradesco?.grupo) {
        base = classificacaoResumoBradesco.base || 'CIELO'
        categoria = classificacaoResumoBradesco.categoria || 'Cartao'
      }
    }

    if (!base) continue
    if (/\bBOLETO\s*PAGO\b.*\bREDE\b/.test(descricaoUpper)) continue

    const isTribanco = bancoNormalizado.includes('TRIBANCO')
    const isBancoDoBrasil = bancoNormalizado.includes('BANCO DO BRASIL') || bancoNormalizado === 'BRASIL'
    const isTribancoStone = isTribanco && /\bSTONE\b/.test(descricaoUpper)
    const classificacaoResumoTribanco = isTribanco ? detectarAgrupamentoResumoTribanco(descricao) : null

    const baseNormalizado = normalizarChaveAdquirente(base)
    const isCabalRede = baseNormalizado === 'CABAL CREDITO' || baseNormalizado === 'CABAL DEBITO'
    const hasPagSeguro = /PAGSEG(?:URO)?/.test(descricaoUpper) || /TED\s*290(?:[.,]0+)?\s*PAGSEG(?:URO)?\s*IN\w*/.test(descricaoUpper)
    const isPagSeguroBandeira = hasPagSeguro && ['ELO CREDITO', 'ELO DEBITO', 'MASTERCARD', 'MAESTRO', 'VISA', 'VISA ELECTRON', 'AMEX', 'HIPERCARD', 'PIX'].includes(baseNormalizado)

    const isUnicaBancoDoBrasil = isBancoDoBrasil && (
      baseNormalizado.includes('TRIANGULO') ||
      baseNormalizado.includes('UNICA') ||
      baseNormalizado.includes('TRIPAG')
    )

    const grupoRaw = isCieloSicoob
      ? 'CIELO'
      : (isTribanco
        ? (classificacaoResumoTribanco?.grupo || (isTribancoStone ? 'STONE' : 'UNICA'))
        : (classificacaoResumoBradesco?.grupo
          ? 'CIELO'
        : (isUnicaBancoDoBrasil
          ? 'UNICA'
          : (isCabalRede ? 'REDE' : (isPagSeguroBandeira ? 'PAGSEGURO' : (categoria === 'Voucher' ? mapearAdquirenteParaGrupo(base) : String(base)))))))

    const grupo = normalizarGrupoAdquirente(grupoRaw)
    const pagamentoBanco = isCieloSicoob
      ? formatarPagamentoCieloSicoob(descricaoNorm)
      : (isTribanco
        ? normalizarBandeiraParaConferencia(
          classificacaoResumoTribanco?.base || detectarBandeiraTribanco(descricao, String(base)),
          classificacaoResumoTribanco?.grupo || 'UNICA'
        )
        : (classificacaoResumoBradesco?.grupo
          ? normalizarBandeiraParaConferencia(classificacaoResumoBradesco?.base || 'CIELO', 'CIELO')
        : (isCabalRede || isPagSeguroBandeira
          ? String(base)
          : (grupo === 'CABAL'
            ? detectarBandeiraCabal(descricao)
            : (grupo === 'REDE'
              ? detectarBandeiraRede(descricao)
              : (grupo === 'UNICA' && isBancoDoBrasil ? detectarBandeiraUnica(descricao, String(base)) : grupo))))))

    if (!map[grupo]) {
      map[grupo] = {
        total: 0,
        bandeiras: {},
        pagamentosGrupo: []
      }
    }

    map[grupo].total += valor
    addUniqueLabel(map[grupo].pagamentosGrupo, pagamentoBanco)

    if (!map[grupo].bandeiras[pagamentoBanco]) {
      map[grupo].bandeiras[pagamentoBanco] = {
        valor: 0,
        pagamentos: []
      }
    }

    map[grupo].bandeiras[pagamentoBanco].valor += valor
    addUniqueLabel(map[grupo].bandeiras[pagamentoBanco].pagamentos, pagamentoBanco)
  }

  return map
}
