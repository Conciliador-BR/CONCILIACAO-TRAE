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

const ehAluguelMaquinaBancoDoBrasil = (transacao) => {
  const banco = normalizarChaveAdquirente(transacao?.banco)
  if (!(banco.includes('BANCO DO BRASIL') || banco === 'BRASIL')) return false

  const descricao = normalizarChaveAdquirente(transacao?.descricao || '')
  const documento = normalizarChaveAdquirente(transacao?.documento ?? transacao?.doc ?? transacao?.document ?? '')
  const texto = `${descricao} ${documento}`.trim()
  if (!texto) return false

  const temContextoMaquina = texto.includes('MAQUIN') || texto.includes('TERMINAL') || texto.includes('POS')
  const aluguelExplicito = texto.includes('ALUGUEL') && temContextoMaquina
  const ajusteMensalidade = texto.includes('AJUSTE') && texto.includes('MENSALIDADE') && temContextoMaquina

  return aluguelExplicito || ajusteMensalidade
}

const ehPagamentoDiversosCieloBancoDoBrasil = (transacao) => {
  const banco = normalizarChaveAdquirente(transacao?.banco)
  if (!(banco.includes('BANCO DO BRASIL') || banco === 'BRASIL')) return false

  const descricao = normalizarChaveAdquirente(transacao?.descricao || '')
  const documento = normalizarChaveAdquirente(transacao?.documento ?? transacao?.doc ?? transacao?.document ?? '')
  const texto = `${descricao} ${documento}`.trim()
  if (!texto) return false

  return texto.includes('PAGAMENTOS DIVERSOS') && texto.includes('CIELO')
}

const formatarPagamentoCieloSicoob = (descricaoNorm) => {
  const ehDebito = /\b(DEB|DEBITO|DBTO)\b/.test(descricaoNorm)
  const ehCredito = /\b(CREDITO|CRED|CRE|CRTO|CR)\b/.test(descricaoNorm)
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
  if (ehCredito && /\b(AMEX|AMERICAN\s+EXP(?:RESS|RE)?)\b/.test(descricaoNorm)) return 'AMEX'
  if (ehCredito && /\b(HIPERCARD|HIPER)\b/.test(descricaoNorm)) return 'HIPERCARD'

  if (/\bVISA\b/.test(descricaoNorm)) return 'VISA'
  if (/\b(MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MASTERCARD'
  if (/\bMAESTRO\b/.test(descricaoNorm)) return 'MAESTRO'
  if (/\bELO\b/.test(descricaoNorm)) return 'ELO CREDITO'
  if (/\b(AMEX|AMERICAN\s+EXP(?:RESS|RE)?)\b/.test(descricaoNorm)) return 'AMEX'
  if (/\b(HIPERCARD|HIPER)\b/.test(descricaoNorm)) return 'HIPERCARD'
  return 'CIELO'
}

const formatarPagamentoCieloBancoDoBrasil = (descricaoNorm) => {
  if (!/\bCIELO\b/.test(descricaoNorm)) return 'CIELO'

  const ehCieloCartoes = (
    /\bCIELO\s+CARTOES?\b/.test(descricaoNorm) ||
    /\bCARTOES?\s+CIELO\b/.test(descricaoNorm)
  )
  const ehVendaDebito = (
    /\bCIELO\s+VENDAS?\s+DEBITO\b/.test(descricaoNorm) ||
    /\bDEBITO\b/.test(descricaoNorm)
  )
  if (ehVendaDebito) return 'MAESTRO'

  const ehVendaCredito = (
    ehCieloCartoes ||
    /\bVENDAS?\s+CREDITO\b/.test(descricaoNorm) ||
    /\bCREDITO\b/.test(descricaoNorm) ||
    /\bCRED\b/.test(descricaoNorm) ||
    /\bCRTO\b/.test(descricaoNorm)
  )
  if (ehVendaCredito) return 'MASTERCARD'

  return 'MASTERCARD'
}

const formatarPagamentoUnicaBancoDoBrasil = (descricaoNorm) => {
  const temContextoUnica = /\b(TRIANGULO|UNICA|TRIPAG)\b/.test(descricaoNorm)
  if (!temContextoUnica) return 'UNICA'

  if (/MASTER[\s.-]*DEBITO|MAESTRO|MAST[\s.-]*DB|DEBITO[\s.-]*MASTER/.test(descricaoNorm)) return 'MAESTRO'
  if (/VISA[\s.-]*DEBITO|VISA[\s.-]*DB|DEBITO[\s.-]*VISA|VISA[\s.-]*ELECTRON/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (/ELO[\s.-]*DEBITO|ELO[\s.-]*DB|DEBITO[\s.-]*ELO/.test(descricaoNorm)) return 'ELO DEBITO'

  if (/MASTER[\s.-]*CREDITO|MAST[\s.-]*CD|CREDITO[\s.-]*MASTER/.test(descricaoNorm)) return 'MASTERCARD'
  if (/VISA[\s.-]*CREDITO|VISA[\s.-]*CD|CREDITO[\s.-]*VISA/.test(descricaoNorm)) return 'VISA'
  if (/ELO[\s.-]*CREDITO|ELO[\s.-]*CD|CREDITO[\s.-]*ELO/.test(descricaoNorm)) return 'ELO CREDITO'
  if (/\bAMEX\b|\bAMERICAN\s+EXPRESS\b/.test(descricaoNorm)) return 'AMEX'
  if (/\bHIPERCARD\b|\bHIPER\b/.test(descricaoNorm)) return 'HIPERCARD'

  if (/\bDEBITO\b/.test(descricaoNorm)) return 'UNICA DEBITO'
  if (/\b(CREDITO|ANTECIPACAO|ANTECIP)\b/.test(descricaoNorm)) return 'UNICA CREDITO'

  return 'UNICA'
}

const formatarPagamentoUnicaSicoob = (descricaoNorm) => {
  const temContextoUnica = /\b(TRIANGULO|UNICA|TRIPAG)\b/.test(descricaoNorm)
  if (!temContextoUnica) return 'UNICA'

  if (/\b(?:D\s+DEB|DBTO|DEBITO)\s+VISA\b|\bVISA\s+ELECTRON\b/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (/\b(?:D\s+DEB|DBTO|DEBITO)\s+(?:MAESTRO|MASTER|MASTERCARD)\b|\bMAESTRO\b/.test(descricaoNorm)) return 'MAESTRO'
  if (/\b(?:D\s+DEB|DBTO|DEBITO)\s+ELO\b/.test(descricaoNorm)) return 'ELO DEBITO'

  if (/\b(?:D\s+CRED|CREDITO|CR|CRTO)\s+VISA\b|\bD\s+ANT\s+VISA\b/.test(descricaoNorm)) return 'VISA'
  if (/\b(?:D\s+CRED|CREDITO|CR|CRTO)\s+(?:MASTER|MASTERCARD)\b|\bD\s+ANT\s+(?:MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MASTERCARD'
  if (/\b(?:D\s+CRED|CREDITO|CR|CRTO)\s+ELO\b|\bD\s+ANT\s+ELO\b/.test(descricaoNorm)) return 'ELO CREDITO'
  if (/\b(?:D\s+CRED|CREDITO|CR|CRTO)\s+(?:AMEX|AMERICAN\s+EXPRESS)\b|\bAMEX\b|\bAMERICAN\s+EXPRESS\b/.test(descricaoNorm)) return 'AMEX'
  if (/\b(?:D\s+CRED|CREDITO|CR|CRTO)\s+HIPERCARD\b|\bHIPERCARD\b|\bHIPER\b/.test(descricaoNorm)) return 'HIPERCARD'

  if (/\bDEBITO\b|\bDBTO\b|\bD\s+DEB\b/.test(descricaoNorm)) return 'UNICA DEBITO'
  if (/\b(CREDITO|CRTO|CR|ANTECIPACAO|ANTECIP|D\s+CRED|D\s+ANT)\b/.test(descricaoNorm)) return 'UNICA CREDITO'

  return 'UNICA'
}

const formatarPagamentoCieloSicredi = (descricaoNorm) => {
  if (!/\bCIELO\b/.test(descricaoNorm)) return 'CIELO'

  if (/\bCIELO\s+DEBITO\s+VISA\b/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (/\bCIELO\s+DEBITO\s+(?:MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MAESTRO'
  if (/\bCIELO\s+DEBITO\s+ELO\b/.test(descricaoNorm)) return 'ELO DEBITO'
  if (/\bCIELO\s+DEBITO\s+OUTRAS\b/.test(descricaoNorm)) return 'CABAL DEBITO'

  if (/\bCIELO\s+CREDITO\s+VISA\b/.test(descricaoNorm)) return 'VISA'
  if (/\bCIELO\s+CREDITO\s+(?:MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MASTERCARD'
  if (/\bCIELO\s+CREDITO\s+ELO\b/.test(descricaoNorm)) return 'ELO CREDITO'
  if (/\bCIELO\s+CREDITO\s+AMEX\b/.test(descricaoNorm)) return 'AMEX'
  if (/\bCIELO\s+CREDITO\s+HIPER(?:CARD)?\b/.test(descricaoNorm)) return 'HIPERCARD'
  if (/\bCIELO\s+CREDITO\s+OUTRAS\b/.test(descricaoNorm)) return 'CABAL CREDITO'

  return 'CIELO'
}

const formatarPagamentoUnicaSicredi = (descricaoNorm) => {
  if (!/\bSUB\b/.test(descricaoNorm)) return 'UNICA'

  if (/\bSUB\s+DB\s+VISA\b/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (/\bSUB\s+DB\s+(?:MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MAESTRO'
  if (/\bSUB\s+DB\s+ELO\b/.test(descricaoNorm)) return 'ELO DEBITO'

  if (/\bSUB\s+CD\s+VISA\b|\bSUB\s+ANTEC\s+VISA\b/.test(descricaoNorm)) return 'VISA'
  if (/\bSUB\s+CD\s+(?:MASTER|MASTERCARD)\b|\bSUB\s+ANTEC\s+(?:MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MASTERCARD'
  if (/\bSUB\s+CD\s+ELO\b|\bSUB\s+ANTEC\s+ELO\b/.test(descricaoNorm)) return 'ELO CREDITO'
  if (/\bSUB\s+CD\s+AMEX\b|\bSUB\s+ANTEC\s+AMEX\b/.test(descricaoNorm)) return 'AMEX'
  if (/\bSUB\s+CD\s+HIPER(?:CARD)?\b|\bSUB\s+ANTEC\s+HIPER(?:CARD)?\b/.test(descricaoNorm)) return 'HIPERCARD'

  return 'UNICA'
}

const formatarPagamentoSafra = (descricaoNorm) => {
  const ehDebito = /\b(DEB|DEBITO|DBTO)\b/.test(descricaoNorm)
  const ehCredito = /\b(CREDITO|CRED|CRTO)\b/.test(descricaoNorm)

  if (ehDebito && /\bSAFRAPAY\s+VISA(?:\s+ELECTRON)?\b/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (ehDebito && /\bSAFRAPAY\s+ELO(?:\s+DEBITO)?\b/.test(descricaoNorm)) return 'ELO DEBITO'
  if (ehDebito && /\bSAFRAPAY\s+MAESTRO\b/.test(descricaoNorm)) return 'MAESTRO'
  if (ehDebito && /\bSAFRAPAY\s+MASTERCARD\s+PRE[\s-]*PAGO\b/.test(descricaoNorm)) return 'MAESTRO'

  if (ehCredito && /\bSAFRAPAY\s+VISA\b/.test(descricaoNorm)) return 'VISA'
  if (ehCredito && /\bSAFRAPAY\s+MASTER(?:CARD)?\b/.test(descricaoNorm)) return 'MASTERCARD'
  if (ehCredito && /\bSAFRAPAY\s+ELO\b/.test(descricaoNorm)) return 'ELO CREDITO'
  if (ehCredito && /\bSAFRAPAY\s+AMERICAN\s+EXPRESS\b/.test(descricaoNorm)) return 'AMEX'
  if (ehCredito && /\bSAFRAPAY\s+HIPERCARD\b/.test(descricaoNorm)) return 'HIPERCARD'

  if (/\bSAFRAPAY\s+AMERICAN\s+EXPRESS\b/.test(descricaoNorm)) return 'AMEX'
  if (/\bSAFRAPAY\s+HIPERCARD\b/.test(descricaoNorm)) return 'HIPERCARD'
  if (/\bSAFRAPAY\s+VISA(?:\s+ELECTRON)?\b/.test(descricaoNorm)) return ehDebito ? 'VISA ELECTRON' : 'VISA'
  if (/\bSAFRAPAY\s+ELO(?:\s+DEBITO)?\b/.test(descricaoNorm)) return ehDebito ? 'ELO DEBITO' : 'ELO CREDITO'
  if (/\bSAFRAPAY\s+MAESTRO\b/.test(descricaoNorm)) return 'MAESTRO'
  if (/\bSAFRAPAY\s+MASTER(?:CARD)?\b/.test(descricaoNorm)) return ehDebito ? 'MAESTRO' : 'MASTERCARD'

  return 'SAFRA'
}

const formatarPagamentoGetnet = (descricaoNorm) => {
  const ehDebito = /\b(DEBITO|DEBIT|DBTO|DEB)\b/.test(descricaoNorm)
  const ehCredito = /\b(CREDITO|CREDIT|CRED|CRTO)\b/.test(descricaoNorm)
  const ehVoucher = /\b(BENEF|BENEFI|VOUCHER)\b/.test(descricaoNorm)
  const ehAluguelTarifa = /\b(ALUGUEL|TARIFA|MENSALIDADE)\b/.test(descricaoNorm)

  if (ehAluguelTarifa) return 'ALUGUEIS'

  if (ehVoucher && /\bGETNET[-\s]*VISA\b/.test(descricaoNorm)) return 'VISA VOUCHER'
  if (ehVoucher && /\bGETNET[-\s]*ELO\b/.test(descricaoNorm)) return 'ELO VOUCHER'
  if (ehVoucher && /\bGETNET[-\s]*(MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MASTERCARD VOUCHER'

  if (ehDebito && /\bGETNET[-\s]*VISA(?:\s+ELECTR(?:ON)?)?\b/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (ehDebito && /\bGETNET[-\s]*ELO(?:\s+DEBITO)?\b/.test(descricaoNorm)) return 'ELO DEBITO'
  if (ehDebito && /\bGETNET[-\s]*(MAESTRO|MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MAESTRO'
  if (ehDebito && /\bVISA\b.*\bGETNET\b/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (ehDebito && /\bELO\b.*\bGETNET\b/.test(descricaoNorm)) return 'ELO DEBITO'
  if (ehDebito && /\b(MAESTRO|MASTER|MASTERCARD)\b.*\bGETNET\b/.test(descricaoNorm)) return 'MAESTRO'

  if (ehCredito && /\bGETNET[-\s]*VISA\b/.test(descricaoNorm)) return 'VISA'
  if (ehCredito && /\bGETNET[-\s]*ELO\b/.test(descricaoNorm)) return 'ELO CREDITO'
  if (ehCredito && /\bGETNET[-\s]*(MASTER|MASTERCARD)\b/.test(descricaoNorm)) return 'MASTERCARD'
  if (ehCredito && /\bGETNET[-\s]*AMEX\b/.test(descricaoNorm)) return 'AMEX'
  if (ehCredito && /\bGETNET[-\s]*HIPERCARD\b/.test(descricaoNorm)) return 'HIPERCARD'
  if (ehCredito && /\bVISA\b.*\bGETNET\b/.test(descricaoNorm)) return 'VISA'
  if (ehCredito && /\bELO\b.*\bGETNET\b/.test(descricaoNorm)) return 'ELO CREDITO'
  if (ehCredito && /\b(MASTER|MASTERCARD)\b.*\bGETNET\b/.test(descricaoNorm)) return 'MASTERCARD'
  if (ehCredito && /\bAMEX\b.*\bGETNET\b/.test(descricaoNorm)) return 'AMEX'
  if (ehCredito && /\bHIPERCARD\b.*\bGETNET\b/.test(descricaoNorm)) return 'HIPERCARD'

  return 'GETNET'
}

const formatarPagamentoStone = (descricaoNorm, opcoes = {}) => {
  const { isStoneBank = false } = opcoes
  if (!descricaoNorm) return 'STONE'

  // Banrisul: o extrato da Stone chega resumido e sem a bandeira explícita.
  if (/\bDEBITO\s+STONE\b/.test(descricaoNorm)) return 'MAESTRO'
  if (/\bANTECIP(?:ACAO)?\s+STONE\b/.test(descricaoNorm)) return 'MASTERCARD'
  if (/\bCREDIT\s+STONE\b/.test(descricaoNorm)) return 'MASTERCARD'

  // Stone: segue a mesma leitura visual usada no resumo do banco Stone.
  if (/\bANTECIPACAO\b/.test(descricaoNorm) && /\bCREDITO\b/.test(descricaoNorm)) return 'VISA'

  if (/\bELO\b/.test(descricaoNorm) && /\bDEBITO\b/.test(descricaoNorm)) return 'ELO DEBITO'
  if (/\bELO\b/.test(descricaoNorm) && /\bCREDIT(?:O)?\b/.test(descricaoNorm)) return 'ELO CREDITO'

  if (/\bVISA\b/.test(descricaoNorm) && /\bELECTRON\b/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (/\bVISA\b/.test(descricaoNorm) && /\bDEBITO\b/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (/\bVISA\b/.test(descricaoNorm) && /\bCREDIT(?:O)?\b/.test(descricaoNorm)) return 'VISA'

  if ((/\bMAESTRO\b/.test(descricaoNorm) || /\b(MASTER|MASTERCARD)\b/.test(descricaoNorm)) && /\bDEBITO\b/.test(descricaoNorm)) return 'MAESTRO'
  if (/\b(MASTER|MASTERCARD)\b/.test(descricaoNorm) && /\bCREDIT(?:O)?\b/.test(descricaoNorm)) return 'MASTERCARD'

  if (/\bAMEX\b/.test(descricaoNorm)) return 'AMEX'
  if (/\bHIPER(?:CARD)?\b/.test(descricaoNorm)) return 'HIPERCARD'

  if (/\bRECEBIMENTO\s+VENDAS.*ELO.*DEBITO/.test(descricaoNorm)) return 'ELO DEBITO'
  if (/\bRECEBIMENTO\s+VENDAS.*ELO.*CREDITO/.test(descricaoNorm)) return 'ELO CREDITO'
  if (/\bRECEBIMENTO\s+VENDAS.*VISA.*ELECTRON/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (/\bRECEBIMENTO\s+VENDAS.*VISA.*DEBITO/.test(descricaoNorm)) return 'VISA ELECTRON'
  if (/\bRECEBIMENTO\s+VENDAS.*VISA.*CREDITO/.test(descricaoNorm)) return 'VISA'
  if (/\bRECEBIMENTO\s+VENDAS.*MAESTRO.*DEBITO/.test(descricaoNorm) || /\bRECEBIMENTO\s+VENDAS.*MASTER.*DEBITO/.test(descricaoNorm)) return 'MAESTRO'
  if (/\bRECEBIMENTO\s+VENDAS.*MASTER.*CREDITO/.test(descricaoNorm)) return 'MASTERCARD'

  if (isStoneBank) {
    if (/\bVISA\b/.test(descricaoNorm)) return 'VISA'
    if (/\bELO\b/.test(descricaoNorm)) return 'ELO DEBITO'
    if (/\b(MASTER|MASTERCARD|MAESTRO)\b/.test(descricaoNorm)) return /\bDEBITO\b/.test(descricaoNorm) ? 'MAESTRO' : 'MASTERCARD'
    if (/\bDEBITO\b/.test(descricaoNorm)) return 'MAESTRO'
    if (/\bCREDIT(?:O)?\b/.test(descricaoNorm)) return 'VISA'
  }

  return 'STONE'
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
    const isPagamentoDiversosCieloBancoDoBrasil = ehPagamentoDiversosCieloBancoDoBrasil(transacao)
    if (ehAluguelMaquinaBancoDoBrasil(transacao) && !isPagamentoDiversosCieloBancoDoBrasil) continue

    const valor = parseValorExtrato(transacao)
    if (!valor) continue
    if (!isPagamentoDiversosCieloBancoDoBrasil && valor <= 0) continue

    const bancoStr = String(transacao?.banco || '')
    const descricao = String(transacao?.descricao || '')
    const documento = String(transacao?.documento ?? transacao?.doc ?? transacao?.document ?? '')
    const contexto = `${descricao} ${documento}`.trim()
    const descricaoUpper = descricao.toUpperCase()
    const descricaoNorm = normalizarChaveAdquirente(descricao)
    const bancoNormalizado = normalizarChaveAdquirente(bancoStr)
    const isBradesco = bancoNormalizado.includes('BRADESCO')
    const isSicoob = bancoNormalizado.includes('SICOOB')
    const isSicredi = bancoNormalizado.includes('SICREDI')
    const isBanrisul = bancoNormalizado.includes('BANRISUL')
    const isStoneBank = bancoNormalizado.includes('STONE')
    const isCieloSicoob = bancoNormalizado.includes('SICOOB') && /\bCIELO\b/.test(descricaoNorm)
    const isCieloSicredi = isSicredi && /\bCIELO\b/.test(descricaoNorm)
    const classificacaoResumoBradesco = isBradesco ? detectarAgrupamentoResumoBradesco(descricao) : null

    const detector = typeof detectarAdquirente === 'function'
      ? detectarAdquirente(contexto, transacao?.banco)
      : null

    const baseDetectado = detector?.base || (transacao?.adquirente_detectado ? String(transacao.adquirente_detectado) : '')
    const categoriaDetectada = detector?.categoria || (transacao?.categoria_detectada ? String(transacao.categoria_detectada) : '')

    let base = baseDetectado
    let categoria = categoriaDetectada || ''

    if (!base) {
      if (isPagamentoDiversosCieloBancoDoBrasil) {
        base = 'CIELO'
        categoria = 'Cartao'
      } else if (descricaoUpper.includes('BANCO VR')) {
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
      } else if (isCieloSicredi) {
        base = 'CIELO'
        categoria = 'Cartao'
      } else if (isSicredi && /\bSUB\s+(?:DB|CD|ANTEC)\b/.test(descricaoNorm)) {
        base = 'UNICA'
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
    const classificacaoResumoTribanco = isTribanco ? detectarAgrupamentoResumoTribanco(contexto) : null

    const baseNormalizado = normalizarChaveAdquirente(base)
    const categoriaNormalizada = normalizarChaveAdquirente(categoria)
    const isCabalRede = baseNormalizado === 'CABAL CREDITO' || baseNormalizado === 'CABAL DEBITO'
    const hasPagSeguro = /PAGSEG(?:URO)?|PAGUE\s+SEGURO/.test(descricaoUpper) || /TED\s*290(?:[.,]0+)?\s*PAGSEG(?:URO)?\s*IN\w*/.test(descricaoUpper)
    const isPagSeguroBandeira = hasPagSeguro && ['ELO CREDITO', 'ELO DEBITO', 'MASTERCARD', 'MAESTRO', 'VISA', 'VISA ELECTRON', 'AMEX', 'HIPERCARD', 'PIX'].includes(baseNormalizado)

    const isUnicaBancoDoBrasil = isBancoDoBrasil && (
      baseNormalizado.includes('TRIANGULO') ||
      baseNormalizado.includes('UNICA') ||
      baseNormalizado.includes('TRIPAG')
    )
    const isUnicaSicoob = isSicoob && (
      baseNormalizado.includes('TRIANGULO') ||
      baseNormalizado.includes('UNICA') ||
      baseNormalizado.includes('TRIPAG') ||
      /\b(TRIANGULO|UNICA|TRIPAG)\b/.test(descricaoNorm)
    )
    const isUnicaSicredi = isSicredi && (
      baseNormalizado.includes('UNICA') ||
      /\bSUB\s+(?:DB|CD|ANTEC)\b/.test(descricaoNorm)
    )

    let grupoRaw = String(base)
    if (isCieloSicoob || isCieloSicredi) {
      grupoRaw = 'CIELO'
    } else if (
      categoriaNormalizada.includes('CART') &&
      (
        isStoneBank ||
        (isBanrisul && /\bSTONE\b/.test(descricaoNorm))
      )
    ) {
      grupoRaw = 'STONE'
    } else if (isSicoob && categoria === 'Voucher' && /\bREDE(?:CARD)?\b/.test(descricaoNorm)) {
      grupoRaw = 'REDE'
    } else if (isTribanco) {
      grupoRaw = classificacaoResumoTribanco?.grupo || (isTribancoStone ? 'STONE' : 'UNICA')
    } else if (classificacaoResumoBradesco?.grupo) {
      grupoRaw = 'CIELO'
    } else if (isUnicaBancoDoBrasil || isUnicaSicoob || isUnicaSicredi) {
      grupoRaw = 'UNICA'
    } else if (isCabalRede) {
      grupoRaw = 'REDE'
    } else if (isPagSeguroBandeira) {
      grupoRaw = 'PAGSEGURO'
    } else if (categoria === 'Voucher') {
      grupoRaw = mapearAdquirenteParaGrupo(base)
    }

    const grupo = normalizarGrupoAdquirente(grupoRaw)
    let pagamentoBanco = grupo
    if (isCieloSicoob) {
      pagamentoBanco = formatarPagamentoCieloSicoob(descricaoNorm)
    } else if (isSicredi && grupo === 'CIELO') {
      pagamentoBanco = formatarPagamentoCieloSicredi(descricaoNorm)
    } else if (isPagamentoDiversosCieloBancoDoBrasil && grupo === 'CIELO') {
      pagamentoBanco = 'ALUGUEIS'
    } else if (isBancoDoBrasil && grupo === 'CIELO') {
      pagamentoBanco = formatarPagamentoCieloBancoDoBrasil(descricaoNorm)
    } else if (isSicoob && grupo === 'UNICA') {
      pagamentoBanco = formatarPagamentoUnicaSicoob(descricaoNorm)
    } else if (isSicredi && grupo === 'UNICA') {
      pagamentoBanco = formatarPagamentoUnicaSicredi(descricaoNorm)
    } else if (isBancoDoBrasil && grupo === 'UNICA') {
      pagamentoBanco = formatarPagamentoUnicaBancoDoBrasil(descricaoNorm)
    } else if (grupo === 'GETNET') {
      pagamentoBanco = formatarPagamentoGetnet(descricaoNorm)
    } else if (grupo === 'SAFRA') {
      pagamentoBanco = formatarPagamentoSafra(descricaoNorm)
    } else if (grupo === 'STONE' || (isBanrisul && /\bSTONE\b/.test(descricaoNorm)) || isStoneBank) {
      pagamentoBanco = formatarPagamentoStone(descricaoNorm, { isStoneBank })
    } else if (isTribanco) {
      pagamentoBanco = normalizarBandeiraParaConferencia(
        classificacaoResumoTribanco?.base || detectarBandeiraTribanco(contexto, String(base)),
        classificacaoResumoTribanco?.grupo || 'UNICA'
      )
    } else if (classificacaoResumoBradesco?.grupo) {
      pagamentoBanco = normalizarBandeiraParaConferencia(classificacaoResumoBradesco?.base || 'CIELO', 'CIELO')
    } else if (isCabalRede || isPagSeguroBandeira) {
      pagamentoBanco = String(base)
    } else if (grupo === 'CABAL') {
      pagamentoBanco = detectarBandeiraCabal(descricao)
    } else if (grupo === 'REDE') {
      pagamentoBanco = detectarBandeiraRede(contexto)
    } else if (grupo === 'UNICA' && isBancoDoBrasil) {
      pagamentoBanco = detectarBandeiraUnica(descricao, String(base))
    }

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
