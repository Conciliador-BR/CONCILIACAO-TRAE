export const ORDEM_BANDEIRAS = [
  'VISA',
  'VISA ELECTRON',
  'MASTERCARD',
  'MAESTRO',
  'ELO CRÉDITO',
  'ELO DÉBITO',
  'BANESCARD CRÉDITO',
  'BANESCARD DÉBITO',
  'CABAL CRÉDITO',
  'CABAL DÉBITO',
  'PIX',
  'CABAL',
  'AMEX',
  'HIPERCARD',
  'DINERS',
  'BRADESCO DÉBITO',
  'TRICARD',
  'SORO',
  'ALUGUEIS'
]

export const BANDEIRAS_VOUCHER_CARTAO = [
  'VISA',
  'VISA ELECTRON',
  'MASTERCARD',
  'MAESTRO',
  'ELO CREDITO',
  'ELO DEBITO',
  'ELO',
  'AMEX',
  'HIPERCARD',
  'BANESCARD CREDITO',
  'BANESCARD DEBITO'
]

export const normalizarChaveAdquirente = (texto) => {
  if (!texto) return ''
  return String(texto)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const normalizarBandeiraParaConferencia = (nomeBandeira, grupoAdquirente) => {
  let base = normalizarChaveAdquirente(nomeBandeira)
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const grupo = normalizarChaveAdquirente(grupoAdquirente)
  base = base
    .replace(/\s+STONE$/, '')
    .replace(/\s+CARTAO$/, '')
    .trim()

  // Equivalencias para matching entre extrato e linhas da controladoria
  if (/^VISA(\s+DEBITO|\s+DB|\s+ELECTRON)?$/.test(base)) return base.includes('DEBITO') || base.includes('DB') || base.includes('ELECTRON') ? 'VISA ELECTRON' : 'VISA'
  if (/^MAESTRO$/.test(base)) return 'MAESTRO'
  if (/^(MASTER|MASTERCARD)(\s+DEBITO|\s+DB)?$/.test(base)) return (base.includes('DEBITO') || base.includes('DB')) ? 'MAESTRO' : 'MASTERCARD'
  if (/^ELO(\s+DEBITO|\s+DEB|\s+DB)?$/.test(base)) return (base.includes('DEBITO') || base.includes('DEB') || base.includes('DB')) ? 'ELO DEBITO' : 'ELO CREDITO'
  if (/^ELO\s+(CREDITO|CRED|CR|CRTO)$/.test(base)) return 'ELO CREDITO'
  if (/^ELO\s+CREDITO$/.test(base)) return 'ELO CREDITO'
  if (/^CABAL(\s+DEBITO|\s+DB)?$/.test(base)) return (base.includes('DEBITO') || base.includes('DB')) ? 'CABAL DEBITO' : 'CABAL'
  if (/^CABAL\s+CREDITO$/.test(base)) return 'CABAL CREDITO'

  if (grupo === 'STONE') return base
  return base
}

export const mapearAdquirenteParaGrupo = (base) => {
  const chave = normalizarChaveAdquirente(base)
  if (/\bCABA(?:L)?\b/.test(chave)) return 'CABAL'
  const mapa = {
    'ALELO INSTITUICAO DE PAGAMENTO': 'ALELO',
    'RECEBIMENTO ALELO': 'ALELO',
    'TICKET SERVICOS SA': 'TICKET',
    'TICKET SERVICOS': 'TICKET',
    PLUXEE: 'PLUXE',
    'PLUXEE BENEFICIOS BR': 'PLUXE',
    'PLUXE BENEFICIOS BR': 'PLUXE',
    'VR BENEFICIOS': 'VR',
    'VR BENEF': 'VR',
    'VR BENEFCIO': 'VR',
    'BANCO VR': 'VR',
    'PIX BANCO VR': 'VR',
    'VR BENEFICIOS SER PROC': 'VR',
    'VR BENEFCIOS SERV PROC': 'VR',
    'LE CARD ADMINISTRADORA': 'LE CARD',
    'LE CARD ADM': 'LE CARD',
    LECARD: 'LE CARD',
    'UP BRASIL ADMINISTRACAO': 'UP BRASIL',
    'GREEN CARD': 'GREEN CARD',
    BRASILCARD: 'BRASILCARD',
    'BRASIL CARD': 'BRASILCARD',
    'BRASIL CARD INSTITUIC': 'BRASILCARD',
    'BOLT CARD': 'BRASILCARD',
    BOLTCARD: 'BRASILCARD',
    'BOLT CARD CREDENCIADORA': 'BRASILCARD',
    'VALE CARD': 'VALE CARD',
    VALECARD: 'VALE CARD',
    'AGL ADQUIRENCIA': 'VALE CARD',
    'AGL ADQUIRENCIA LTDA': 'VALE CARD',
    'CABAL PRE': 'CABAL',
    'CABAL CABA': 'CABAL',
    'CABAL CABA CD': 'CABAL',
    'CABAL CABA DB': 'CABAL',
    'CRTO CABAL SICOOB SO': 'CABAL',
    'CARTAO CABAL SICOOB SO': 'CABAL',
    'CABAL SICOOB SO': 'CABAL',
    'SICOOB CARTAO CREDITO': 'CABAL',
    'SICOB CARTAO CREDITO': 'CABAL',
    TRIPAG: 'UNICA',
    REDE: 'REDE',
    'REDE CARD': 'REDE',
    REDECARD: 'REDE',
    'LIBER CARD': 'LIBERCARD',
    LIBERCARD: 'LIBERCARD',
    LIBERCAD: 'LIBERCARD',
    MANCACARU: 'LIBERCARD',
    MANACARU: 'LIBERCARD'
  }
  return mapa[chave] || base
}

export const normalizarGrupoAdquirente = (base) => {
  const semSufixo = String(base || '').replace(/\s*\([^)]*\)\s*$/g, '').trim()
  const chave = normalizarChaveAdquirente(semSufixo)
  if (!chave) return 'ALUGUEIS'

  if (['UNICA', 'TRIPAG', 'TRIANGULO'].includes(chave)) return 'UNICA'
  if (['REDE CARD', 'REDECARD'].includes(chave)) return 'REDE'
  if (['PAG SEGURO', 'PAGSEGURO', 'PAGBANK'].includes(chave)) return 'PAGSEGURO'

  const mapeado = mapearAdquirenteParaGrupo(chave)
  return String(mapeado || semSufixo || base).trim()
}

export const detectarBandeiraRede = (descricao) => {
  const texto = normalizarChaveAdquirente(descricao)
  if (!texto) return 'REDE'
  const temMaster = /MAST|MASTER|MASTERCARD|MAESTRO/.test(texto)
  const temIndicadorDebito = /DEBITO|DBTO|[\s.-]DEB(?:[\s.-]|$)|FUNCAO[\s.-]*DEBITO/.test(texto)
  const temIndicadorCredito = /CREDITO|CRTO|[\s.-]CD(?:[\s.-]|$)|[\s.-]AT(?:[\s.-]|$)|\sCR[\s.-]/.test(texto)

  if (/REDE[\s.-]*VENDAS[\s.-]*MASTER[\s.-]*DEBITO/.test(texto)) return 'MAESTRO'
  if (/REDE[\s.-]*VENDAS[\s.-]*VISA[\s.-]*DEBITO/.test(texto)) return 'VISA ELECTRON'
  if (/REDECARD/.test(texto) && /FUNCAO[\s.-]*DEBITO/.test(texto)) return 'ELO DÉBITO'
  if (temMaster && temIndicadorDebito) return 'MAESTRO'
  if (temMaster && temIndicadorCredito) return 'MASTERCARD'
  if (/REDE[\s.-]*VENDAS[\s.-]*MASTER[\s.-]*CREDITO?/.test(texto)) return 'MASTERCARD'
  if (/REDE[\s.-]*VENDAS[\s.-]*VISA[\s.-]*CREDITO?/.test(texto)) return 'VISA'
  if (/REDE[\s.-]*CREDITO/.test(texto)) return 'ELO CRÉDITO'

  if (/CABA(?:L)?[\s.-]*(DB|DEB|DEBITO)|DBTO[\s.-]*CABA(?:L)?/.test(texto)) return 'CABAL DÉBITO'
  if (/CABA(?:L)?[\s.-]*(CD|AT|CREDITO|CRED)|CR[\s.-]*CABA(?:L)?/.test(texto)) return 'CABAL CRÉDITO'
  if (/\bCABAL\b|\bCABA\b/.test(texto)) return 'CABAL'

  if (/VISA[\s.-]*DB|DBTO[\s.-]*VISA|VISA[\s.-]*ELECTRON/.test(texto)) return 'VISA ELECTRON'
  if (/ELO[\s.-]*DB|DBTO[\s.-]*ELO/.test(texto)) return 'ELO DÉBITO'
  if (/MAST[\s.-]*DB|DBTO[\s.-]*MAESTRO|MAESTRO/.test(texto)) return 'MAESTRO'

  if (/VISA[\s.-]*(CD|AT)|CREDITO[\s.-]*VISA|CR[\s.-]*VISA/.test(texto)) return 'VISA'
  if (/ELO[\s.-]*(CD|AT)|CREDITO[\s.-]*ELO|CRTO[\s.-]*ELO/.test(texto)) return 'ELO CRÉDITO'
  if (/MAST[\s.-]*(CD|AT)|CR[\s.-]*MASTERCARD|CREDITO[\s.-]*MASTERCARD/.test(texto)) return 'MASTERCARD'
  if (/AMEX[\s.-]*(CD|AT)|\bAMEX\b/.test(texto)) return 'AMEX'

  return 'REDE'
}

export const detectarBandeiraTribanco = (descricao, baseDetectado) => {
  const texto = normalizarChaveAdquirente(`${descricao || ''} ${baseDetectado || ''}`)
  const base = normalizarChaveAdquirente(baseDetectado).replace(/\s+STONE$/, '').trim()

  if (
    /DBTO\s+VISA|VISA\s+(DEBITO|DEB|DB)|VISA\s+ELECTRON/.test(texto) ||
    /VISA\s+(DEBITO|DEB|DB)/.test(base)
  ) return 'VISA ELECTRON'

  if (
    /DBTO\s+MAESTRO|MASTER\s+(DEBITO|DEB|DB)|MAESTRO/.test(texto) ||
    /(MASTER|MAESTRO)\s+(DEBITO|DEB|DB)/.test(base)
  ) return 'MAESTRO'

  if (
    /DBTO\s+ELO|ELO\s+(DEBITO|DEB|DB)/.test(texto) ||
    /ELO\s+(DEBITO|DEB|DB)/.test(base)
  ) return 'ELO DÉBITO'

  if (
    /CREDITO\s+VISA|CR\s+VISA|VISA\s+(CREDITO|CRED|CR|CRTO)/.test(texto) ||
    /VISA\s+(CREDITO|CRED|CR|CRTO)/.test(base)
  ) return 'VISA'

  if (
    /CR\s+MASTERCARD|CREDITO\s+MASTERCARD|MASTER\s+(CREDITO|CRED|CR|CRTO)/.test(texto) ||
    /(MASTER|MASTERCARD)\s+(CREDITO|CRED|CR|CRTO)/.test(base)
  ) return 'MASTERCARD'

  if (
    /CREDITO\s+ELO|CRTO\s+ELO|ELO\s+(CREDITO|CRED|CR|CRTO)/.test(texto) ||
    /ELO\s+(CREDITO|CRED|CR|CRTO)/.test(base)
  ) return 'ELO CRÉDITO'

  if (base === 'ELO') return 'ELO CRÉDITO'
  if (base === 'VISA') return 'VISA'
  if (base === 'MASTERCARD' || base === 'MASTER') return 'MASTERCARD'
  if (base === 'MAESTRO') return 'MAESTRO'

  return String(baseDetectado || '').replace(/\s+STONE$/i, '').trim()
}

export const detectarBandeiraUnica = (descricao, baseDetectado) => {
  const texto = normalizarChaveAdquirente(`${descricao || ''} ${baseDetectado || ''}`)
  if (!texto) return 'UNICA'

  if (/ALUGUEL/.test(texto) && (/MAQUIN|TERMINAL|POS/.test(texto))) return 'ALUGUEIS'

  if (/MASTER[\s.-]*DEBITO|MAESTRO|MAST[\s.-]*DB|DEBITO[\s.-]*MASTER/.test(texto)) return 'MAESTRO'
  if (/VISA[\s.-]*DEBITO|VISA[\s.-]*DB|DEBITO[\s.-]*VISA|VISA[\s.-]*ELECTRON/.test(texto)) return 'VISA ELECTRON'
  if (/ELO[\s.-]*DEBITO|ELO[\s.-]*DB|DEBITO[\s.-]*ELO/.test(texto)) return 'ELO DÉBITO'

  if (/MASTER[\s.-]*CREDITO|MAST[\s.-]*CD|CREDITO[\s.-]*MASTER/.test(texto)) return 'MASTERCARD'
  if (/VISA[\s.-]*CREDITO|VISA[\s.-]*CD|CREDITO[\s.-]*VISA/.test(texto)) return 'VISA'
  if (/ELO[\s.-]*CREDITO|ELO[\s.-]*CD|CREDITO[\s.-]*ELO/.test(texto)) return 'ELO CRÉDITO'

  const base = normalizarChaveAdquirente(baseDetectado)
  if (base.includes('MAESTRO') || base.includes('MASTER')) return 'MAESTRO'
  if (base.includes('VISA ELECTRON')) return 'VISA ELECTRON'
  if (base.includes('VISA')) return 'VISA'
  if (base.includes('ELO DEBITO')) return 'ELO DÉBITO'
  if (base.includes('ELO CREDITO') || base === 'ELO') return 'ELO CRÉDITO'
  if (base.includes('ALUGUEL')) return 'ALUGUEIS'

  return 'UNICA'
}

export const detectarBandeiraCabal = (descricao) => {
  const texto = normalizarChaveAdquirente(descricao)
  if (!texto) return 'CABAL'
  if (/CABA(?:L)?[\s.-]*(CD|AT|CREDITO|CRED)|CR[\s.-]*CABA(?:L)?/.test(texto)) return 'CABAL CRÉDITO'
  if (/CABA(?:L)?[\s.-]*(DB|DEB|DEBITO)|DBTO[\s.-]*CABA(?:L)?/.test(texto)) return 'CABAL DÉBITO'
  return 'CABAL'
}

export const parseValorExtrato = (transacao) => {
  const raw = transacao?.valorNumerico ?? transacao?.valor ?? 0
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0
  const input = String(raw).trim()
  if (!input) return 0

  const normalized = input
    .replace(/\s/g, '')
    .replace(/[^0-9,.-]/g, '')

  if (!normalized) return 0

  const hasComma = normalized.includes(',')
  const dotCount = (normalized.match(/\./g) || []).length
  const cleaned = hasComma
    ? normalized.replace(/\./g, '').replace(',', '.')
    : (dotCount > 1 ? normalized.replace(/\./g, '') : normalized)

  const value = Number(cleaned)
  return Number.isFinite(value) ? value : 0
}

export const resolverLinhaBandeira = (nomeClassificado, modalidadePagamento) => {
  if (nomeClassificado !== 'CABAL') return nomeClassificado
  if (modalidadePagamento === 'debito') return 'CABAL DÉBITO'
  if (['credito', 'credito2x', 'credito3x', 'credito4x5x6x'].includes(modalidadePagamento)) return 'CABAL CRÉDITO'
  return 'CABAL'
}

export const resolverBandeiraRede = (normalizeString, bandeiraRaw, modalidadeRaw, fallback) => {
  const bandeiraNorm = normalizeString(bandeiraRaw || '')
  const modalidadeNorm = normalizeString(modalidadeRaw || '')
  const isVoucher = modalidadeNorm.includes('voucher') || modalidadeNorm.includes('alimentacao') || modalidadeNorm.includes('refeicao')
  const isDebito = modalidadeNorm.includes('debito') || modalidadeNorm.includes('debitoprepago') || modalidadeNorm.includes('prepagodebito') || modalidadeNorm.includes('prepagodbto') || modalidadeNorm.includes('dbto') || modalidadeNorm.includes('deb')

  if (isVoucher) {
    if (bandeiraNorm.includes('visa')) return 'VISA'
    if (bandeiraNorm.includes('master') || bandeiraNorm.includes('maestro')) return 'MASTERCARD'
    if (bandeiraNorm.includes('elo')) return 'ELO CRÉDITO'
    if (bandeiraNorm.includes('amex') || bandeiraNorm.includes('american') || bandeiraNorm.includes('express')) return 'AMEX'
    if (bandeiraNorm.includes('hipercard') || bandeiraNorm.includes('hiper')) return 'HIPERCARD'
    if (bandeiraNorm.includes('banescard')) return 'BANESCARD CRÉDITO'
    if (bandeiraNorm.includes('cabal')) return 'CABAL'
    return fallback
  }

  if (isDebito) {
    if (bandeiraNorm.includes('visa')) return 'VISA ELECTRON'
    if (bandeiraNorm.includes('master') || bandeiraNorm.includes('maestro')) return 'MAESTRO'
    if (bandeiraNorm.includes('elo')) return 'ELO DÉBITO'
    if (bandeiraNorm.includes('banescard')) return 'BANESCARD DÉBITO'
    if (bandeiraNorm.includes('cabal')) return 'CABAL DÉBITO'
    return fallback
  }

  if (bandeiraNorm.includes('visa')) return 'VISA'
  if (bandeiraNorm.includes('master') || bandeiraNorm.includes('maestro')) return 'MASTERCARD'
  if (bandeiraNorm.includes('elo')) return 'ELO CRÉDITO'
  if (bandeiraNorm.includes('amex') || bandeiraNorm.includes('american') || bandeiraNorm.includes('express')) return 'AMEX'
  if (bandeiraNorm.includes('banescard')) return 'BANESCARD CRÉDITO'
  if (bandeiraNorm.includes('hipercard') || bandeiraNorm.includes('hiper')) return 'HIPERCARD'
  if (bandeiraNorm.includes('cabal')) return 'CABAL CRÉDITO'
  return fallback
}
