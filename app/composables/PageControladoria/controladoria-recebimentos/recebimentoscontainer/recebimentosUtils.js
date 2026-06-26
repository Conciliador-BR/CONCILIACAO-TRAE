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
  if (/^VISA\s+(PAT|BENE|BENEFI|VOUCHER)$/.test(base)) return 'VISA'
  if (/^(MASTER|MASTERCARD)\s+(PAT|BENE|BENEFI|VOUCHER)$/.test(base)) return 'MASTERCARD'
  if (/^ELO\s+(PAT|BENE|BENEFI|VOUCHER)$/.test(base)) return 'ELO CREDITO'
  if (/^(ALUGUEL(?:\s*\/\s*TARIFA)?|ALUGUEIS|TARIFA|MENSALIDADE)$/.test(base)) return 'ALUGUEIS'
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
    SAFRA: 'SAFRA',
    SAFRAPAY: 'SAFRA',
    'SAFRA PAY': 'SAFRA',
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
  if (['SAFRA', 'SAFRAPAY', 'SAFRA PAY'].includes(chave)) return 'SAFRA'

  const mapeado = mapearAdquirenteParaGrupo(chave)
  return String(mapeado || semSufixo || base).trim()
}

export const detectarBandeiraRede = (descricao) => {
  const texto = normalizarChaveAdquirente(descricao)
  if (!texto) return 'REDE'
  const temMaster = /MAST|MASTER|MASTERCARD|MAESTRO/.test(texto)
  const temIndicadorDebito = /DEBITO|DBTO|[\s.-]DEB(?:[\s.-]|$)|FUNCAO[\s.-]*DEBITO/.test(texto)
  const temIndicadorCredito = /CREDITO|CRTO|[\s.-]CD(?:[\s.-]|$)|[\s.-]AT(?:[\s.-]|$)|\sCR[\s.-]/.test(texto)

  // Caixa costuma trazer a bandeira REDE fragmentada entre descricao e documento:
  // REDE MC CD / REDE VS CC / REDE EL AT / REDE AE CC
  if (/\bREDE\s+MC\s+CD\b/.test(texto)) return 'MAESTRO'
  if (/\bREDE\s+VS\s+CD\b/.test(texto)) return 'VISA ELECTRON'
  if (/\bREDE\s+EL\s+CD\b/.test(texto)) return 'ELO DEBITO'
  if (/\bREDE\s+MC\s+(?:CC|AT)\b/.test(texto)) return 'MASTERCARD'
  if (/\bREDE\s+VS\s+(?:CC|AT)\b/.test(texto)) return 'VISA'
  if (/\bREDE\s+EL\s+(?:CC|AT)\b/.test(texto)) return 'ELO CREDITO'
  if (/\bREDE\s+AE\s+(?:CC|AT)\b/.test(texto)) return 'AMEX'

  if (
    /\bREDE(?:CARD)?\s+CRED(?:ITO)?\s+VISA\s+(?:PAT|VOUCHER)\b/.test(texto) ||
    /\bVISA\s+(?:PAT|VOUCHER)\b/.test(texto)
  ) return 'VISA VOUCHER'
  if (
    /\bREDE(?:CARD)?\s+CRED(?:ITO)?\s+(?:MASTER|MASTERCARD)\s+(?:PAT|VOUCHER)\b/.test(texto) ||
    /\b(?:MASTER|MASTERCARD)\s+(?:PAT|VOUCHER)\b/.test(texto)
  ) return 'MASTERCARD VOUCHER'
  if (
    /\bREDE(?:CARD)?\s+CRED(?:ITO)?\s+ELO\s+(?:PAT|VOUCHER)\b/.test(texto) ||
    /\bELO\s+(?:PAT|VOUCHER)\b/.test(texto)
  ) return 'ELO VOUCHER'

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

  if (/\bREDE(?:CARD)?[\s.-]*DEBITO\b/.test(texto) || /\bREDE(?:CARD)?\b.*\bFUNCAO[\s.-]*DEBITO\b/.test(texto)) return 'ELO DÉBITO'
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

  if (/\bBENE(?:FI)?\b/.test(texto)) {
    if (/\bVISA\b/.test(texto) || /^VISA(\s+BENE(?:FI)?|\s+VOUCHER)?$/.test(base)) return 'VISA'
    if (/\b(MASTER|MASTERCARD)\b/.test(texto) || /^(MASTER|MASTERCARD)(\s+BENE(?:FI)?|\s+VOUCHER)?$/.test(base)) return 'MASTERCARD'
    if (/\bELO\b/.test(texto) || /^ELO(\s+BENE(?:FI)?|\s+VOUCHER)?$/.test(base)) return 'ELO CRÉDITO'
  }

  if (
    /\bCABAL\s+DEB\s+REDE(?:CARD)?\b/.test(texto) ||
    /\bREDE(?:CARD)?\s+CABAL\s+(?:DBTO|DEB|DEBITO)\b/.test(texto) ||
    /\bDBTO\s+CABAL\s+REDE(?:CARD)?\b/.test(texto) ||
    /\bCABAL\s+(?:DBTO|DEB|DEBITO)\b/.test(base)
  ) return 'CABAL DEBITO'

  if (
    /\bCABAL\s+(?:CRED|CRTO|CREDITO)\s+REDE(?:CARD)?\b/.test(texto) ||
    /\bREDE(?:CARD)?\s+CABAL\s+(?:CD|AT|CRED|CRTO|CREDITO)\b/.test(texto) ||
    /\bCR(?:EDITO)?\s+CABAL\s+REDE(?:CARD)?\b/.test(texto) ||
    /\bCABAL\s+(?:CD|AT|CRED|CRTO|CREDITO)\b/.test(base)
  ) return 'CABAL CREDITO'

  if (
    /DBTO\s+VISA\s+REDE(?:CARD)?/.test(texto) ||
    /DBTO\s+VISA|VISA\s+(DEBITO|DEB|DB)|VISA\s+ELECTRON/.test(texto) ||
    /VISA\s+(DEBITO|DEB|DB)/.test(base)
  ) return 'VISA ELECTRON'

  if (
    /DBTO\s+MASTERCARD\s+REDE(?:CARD)?/.test(texto) ||
    /DBTO\s+MAESTRO|MASTER\s+(DEBITO|DEB|DB)|MAESTRO/.test(texto) ||
    /(MASTER|MAESTRO)\s+(DEBITO|DEB|DB)/.test(base)
  ) return 'MAESTRO'

  if (
    /ELO\s+DEB\s+REDE(?:CARD)?/.test(texto) ||
    /DBTO\s+ELO|ELO\s+(DEBITO|DEB|DB)/.test(texto) ||
    /ELO\s+(DEBITO|DEB|DB)/.test(base)
  ) return 'ELO DÉBITO'

  if (
    /\bREDE(?:CARD)?\s+CRED(?:ITO)?\s+VISA\s+PAT\b/.test(texto) ||
    /\bVISA\s+PAT\b/.test(texto)
  ) return 'VISA VOUCHER'

  if (
    /\bREDE(?:CARD)?\s+CRED(?:ITO)?\s+(?:MASTER|MASTERCARD)\s+PAT\b/.test(texto) ||
    /\b(?:MASTER|MASTERCARD)\s+PAT\b/.test(texto)
  ) return 'MASTERCARD VOUCHER'

  if (
    /\bREDE(?:CARD)?\s+CRED(?:ITO)?\s+ELO\s+PAT\b/.test(texto) ||
    /\bELO\s+PAT\b/.test(texto)
  ) return 'ELO VOUCHER'

  if (
    /CREDTO\s+VISA\s+REDE(?:CARD)?/.test(texto) ||
    /CREDITO\s+VISA|CR\s+VISA|VISA\s+(CREDITO|CRED|CR|CRTO)/.test(texto) ||
    /VISA\s+(CREDITO|CRED|CR|CRTO)/.test(base)
  ) return 'VISA'

  if (
    /CTAO\s+CRED\s+MASTERCARD\s+REDE(?:CARD)?/.test(texto) ||
    /CR\s+MASTERCARD|CREDITO\s+MASTERCARD|MASTER\s+(CREDITO|CRED|CR|CRTO)/.test(texto) ||
    /(MASTER|MASTERCARD)\s+(CREDITO|CRED|CR|CRTO)/.test(base)
  ) return 'MASTERCARD'

  if (
    /ELO\s+CRED\s+REDE(?:CARD)?/.test(texto) ||
    /CREDITO\s+ELO|CRTO\s+ELO|ELO\s+(CREDITO|CRED|CR|CRTO)/.test(texto) ||
    /ELO\s+(CREDITO|CRED|CR|CRTO)/.test(base)
  ) return 'ELO CRÉDITO'

  if (
    /AMEX\s+CRED\s+REDE(?:CARD)?|AMERICAN\s+EXPRESS\s+CRED\s+REDE(?:CARD)?/.test(texto) ||
    /(AMEX|AMERICAN\s+EXPRESS)\s+(CREDITO|CRED|CR|CRTO)/.test(base)
  ) return 'AMEX'

  if (base === 'ELO') return 'ELO CRÉDITO'
  if (base === 'VISA') return 'VISA'
  if (base === 'MASTERCARD' || base === 'MASTER') return 'MASTERCARD'
  if (base === 'MAESTRO') return 'MAESTRO'

  return String(baseDetectado || '').replace(/\s+STONE$/i, '').trim()
}

export const detectarAgrupamentoResumoTribanco = (descricao) => {
  const original = String(descricao || '')
  const upper = original.toUpperCase()
  const texto = normalizarChaveAdquirente(original)
  const hasTripag = /\bTRIPAG\b/.test(texto)
  const hasRede = /\bREDE(?:CARD)?\b/.test(texto)
  const hasStone = /\bSTONE\b/.test(texto)
  const hasGetnet = /\bGETNET\b/.test(texto)
  const hasCielo = /\bCIELO\b/.test(texto)

  if (/\bBENE(?:FI)?\b/.test(texto)) {
    if (/\bVISA\b/.test(texto)) return { nome: 'VISA VOUCHER (CartÃ£o)', base: 'VISA', categoria: 'Cartão', grupo: 'UNICA' }
    if (/\b(MASTERCARD|MASTER)\b/.test(texto)) return { nome: 'MASTERCARD VOUCHER (CartÃ£o)', base: 'MASTERCARD', categoria: 'Cartão', grupo: 'UNICA' }
    if (/\bELO\b/.test(texto)) return { nome: 'ELO VOUCHER (CartÃ£o)', base: 'ELO CREDITO', categoria: 'Cartão', grupo: 'UNICA' }
  }

  if (hasGetnet && /\bDEBIT(?:O)?\s+VISA\b/.test(texto)) return { nome: 'VISA ELECTRON (Getnet)', base: 'VISA ELECTRON', categoria: 'Cartao', grupo: 'GETNET' }
  if (hasGetnet && /\bDEBIT(?:O)?\s+(?:MASTER|MAESTRO)\b/.test(texto)) return { nome: 'MAESTRO (Getnet)', base: 'MAESTRO', categoria: 'Cartao', grupo: 'GETNET' }
  if (hasGetnet && /\bDEBIT(?:O)?\s+ELO\b/.test(texto)) return { nome: 'ELO DEBITO (Getnet)', base: 'ELO DEBITO', categoria: 'Cartao', grupo: 'GETNET' }

  if (hasGetnet && /\bCREDIT(?:O)?\s+ELO\b/.test(texto)) return { nome: 'ELO CREDITO (Getnet)', base: 'ELO CREDITO', categoria: 'Cartao', grupo: 'GETNET' }
  if (hasGetnet && /\bCREDIT(?:O)?\s+(?:MASTER|MASTERCARD)\b/.test(texto)) return { nome: 'MASTERCARD (Getnet)', base: 'MASTERCARD', categoria: 'Cartao', grupo: 'GETNET' }
  if (hasGetnet && /\bCREDIT(?:O)?\s+VISA\b/.test(texto)) return { nome: 'VISA (Getnet)', base: 'VISA', categoria: 'Cartao', grupo: 'GETNET' }
  if (hasGetnet && /\bCREDIT(?:O)?\s+AMEX\b/.test(texto)) return { nome: 'AMEX (Getnet)', base: 'AMEX', categoria: 'Cartao', grupo: 'GETNET' }
  if (hasGetnet && /\bCREDIT(?:O)?\s+HIPERCARD\b/.test(texto)) return { nome: 'HIPERCARD (Getnet)', base: 'HIPERCARD', categoria: 'Cartao', grupo: 'GETNET' }

  if (hasCielo && /\bDEBITO\s+VISA\b/.test(texto)) return { nome: 'VISA ELECTRON (Cielo)', base: 'VISA ELECTRON', categoria: 'Cartao', grupo: 'CIELO' }
  if (hasCielo && /\b(?:MASTER|MASTERCARD)\s+DEBITO\b/.test(texto)) return { nome: 'MAESTRO (Cielo)', base: 'MAESTRO', categoria: 'Cartao', grupo: 'CIELO' }
  if (hasCielo && /\bELO\s+DEBITO\b/.test(texto)) return { nome: 'ELO DEBITO (Cielo)', base: 'ELO DEBITO', categoria: 'Cartao', grupo: 'CIELO' }

  if (hasCielo && /\bCARTAO\s+CRED\.?\s*ELO\b/.test(original.toUpperCase())) return { nome: 'ELO CREDITO (Cielo)', base: 'ELO CREDITO', categoria: 'Cartao', grupo: 'CIELO' }
  if (hasCielo && /\bCARTAO\s+CRED\.?\s*(?:MASTER|MASTERCARD)\b/.test(original.toUpperCase())) return { nome: 'MASTERCARD (Cielo)', base: 'MASTERCARD', categoria: 'Cartao', grupo: 'CIELO' }
  if (hasCielo && /\bCARTAO\s+CRED\.?\s*VISA\b/.test(original.toUpperCase())) return { nome: 'VISA (Cielo)', base: 'VISA', categoria: 'Cartao', grupo: 'CIELO' }
  if (hasCielo && /\bCARTAO\s+CRED\.?\s*AMEX\b/.test(original.toUpperCase())) return { nome: 'AMEX (Cielo)', base: 'AMEX', categoria: 'Cartao', grupo: 'CIELO' }
  if (hasCielo && /\bCARTAO\s+CRED\.?\s*HIPER\b/.test(original.toUpperCase())) return { nome: 'HIPERCARD (Cielo)', base: 'HIPERCARD', categoria: 'Cartao', grupo: 'CIELO' }

  if (hasStone && /MASTER\s+DEBITO/.test(texto)) return { nome: 'MAESTRO (CartÃ£o)', base: 'MAESTRO', categoria: 'Cartão', grupo: 'STONE' }
  if (hasStone && /VISA\s+DEBITO/.test(texto)) return { nome: 'VISA ELECTRON (CartÃ£o)', base: 'VISA ELECTRON', categoria: 'Cartão', grupo: 'STONE' }
  if (hasStone && /ELO\s+DEBITO/.test(texto)) return { nome: 'ELO DEBITO (CartÃ£o)', base: 'ELO DEBITO', categoria: 'Cartão', grupo: 'STONE' }
  if (hasStone && /BANESCARD\s+DEBITO/.test(texto)) return { nome: 'BANESCARD DEBITO (CartÃ£o)', base: 'BANESCARD DEBITO', categoria: 'Cartão', grupo: 'STONE' }
  if (hasStone && /VISA\s+CREDITO/.test(texto)) return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'Cartão', grupo: 'STONE' }
  if (hasStone && /MASTER\s+CREDITO/.test(texto)) return { nome: 'MASTERCARD (CartÃ£o)', base: 'MASTERCARD', categoria: 'Cartão', grupo: 'STONE' }
  if (hasStone && /ELO\s+CREDITO/.test(texto)) return { nome: 'ELO CREDITO (CartÃ£o)', base: 'ELO CREDITO', categoria: 'Cartão', grupo: 'STONE' }
  if (hasStone && /(AMEX|AMERICAN\s+EXPRESS)(?:\s+CREDITO)?/.test(texto)) return { nome: 'AMEX (CartÃ£o)', base: 'AMEX', categoria: 'Cartão', grupo: 'STONE' }
  if (hasStone && /HIPERCARD(?:\s+CREDITO)?/.test(texto)) return { nome: 'HIPERCARD (CartÃ£o)', base: 'HIPERCARD', categoria: 'Cartão', grupo: 'STONE' }

  if (hasTripag && (/\bDBTO\s+VISA\b/.test(upper) || /\bD[_\s.-]*DEB[_\s.-]*VISA(?:\s+ELECTRON)?\b/.test(upper))) {
    return { nome: 'VISA ELECTRON (CartÃ£o)', base: 'VISA ELECTRON', categoria: 'Cartão', grupo: 'UNICA' }
  }
  if (hasTripag && (/\bDBTO\s+ELO\b/.test(upper) || /\bD[_\s.-]*DEB[_\s.-]*ELO(?:\s+DEBITO)?\b/.test(upper))) {
    return { nome: 'ELO DEBITO (CartÃ£o)', base: 'ELO DEBITO', categoria: 'Cartão', grupo: 'UNICA' }
  }
  if (hasTripag && (/\bDBTO\s+MAESTRO\b/.test(upper) || /\bD[_\s.-]*DEB[_\s.-]*MAESTRO\b/.test(upper))) {
    return { nome: 'MAESTRO (CartÃ£o)', base: 'MAESTRO', categoria: 'Cartão', grupo: 'UNICA' }
  }

  if (
    hasRede &&
    (
      /\bCABAL\s+DEB\s+REDE(?:CARD)?\b/.test(texto) ||
      /\bCABAL\s+DEBITO\s+REDE(?:CARD)?\b/.test(texto) ||
      /\bCABAL\s+DBTO\s+REDE(?:CARD)?\b/.test(texto) ||
      /\bREDE(?:CARD)?\s+CABAL\s+(?:DBTO|DEB|DEBITO)\b/.test(texto) ||
      /\bDBTO\s+CABAL\s+REDE(?:CARD)?\b/.test(texto) ||
      /\bREDE(?:CARD)?\s+(?:DBTO|DEB|DEBITO)\s+CABAL(?:\s+DEBITO)?\b/.test(texto)
    )
  ) return { nome: 'CABAL DEBITO (CartÃ£o)', base: 'CABAL DEBITO', categoria: 'Cartão', grupo: 'REDE' }
  if (hasRede && /\bDBTO\s+VISA(?:\s+REDE(?:CARD)?)?\b/.test(texto)) return { nome: 'VISA ELECTRON (CartÃ£o)', base: 'VISA ELECTRON', categoria: 'Cartão', grupo: 'REDE' }
  if (hasRede && (/\bDBTO\s+ELO\b/.test(texto) || /\bELO\s+DEB\s+REDE(?:CARD)?\b/.test(texto))) return { nome: 'ELO DEBITO (CartÃ£o)', base: 'ELO DEBITO', categoria: 'Cartão', grupo: 'REDE' }
  if (hasRede && /\bDBTO\s+(?:MAESTRO|MASTER|MASTERCARD)\s+REDE(?:CARD)?\b|\bDBTO\s+(?:MAESTRO|MASTER)\b/.test(texto)) return { nome: 'MAESTRO (CartÃ£o)', base: 'MAESTRO', categoria: 'Cartão', grupo: 'REDE' }

  if (
    hasTripag &&
    (
      /\bCREDITO\s+VISA\b/.test(upper) ||
      /\bCR\s+VISA\b/.test(upper) ||
      /\bD[_\s.-]*CRED[_\s.-]*VISA\b/.test(upper) ||
      /\bD[_\s.-]*ANT[_\s.-]*VISA\b/.test(upper)
    )
  ) return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'Cartão', grupo: 'UNICA' }
  if (
    hasTripag &&
    (
      /\bCREDITO\s+ELO\b/.test(upper) ||
      /\bCRTO\s+ELO\b/.test(upper) ||
      /\bD[_\s.-]*CRED[_\s.-]*ELO\b/.test(upper) ||
      /\bD[_\s.-]*ANT[_\s.-]*ELO\b/.test(upper)
    )
  ) return { nome: 'ELO CREDITO (CartÃ£o)', base: 'ELO CREDITO', categoria: 'Cartão', grupo: 'UNICA' }
  if (
    hasTripag &&
    (
      /\bCR\s+MASTERCARD\b/.test(upper) ||
      /\bCREDITO\s+MASTERCARD\b/.test(upper) ||
      /\bD[_\s.-]*CRED[_\s.-]*MASTERCARD\b/.test(upper) ||
      /\bD[_\s.-]*ANT[_\s.-]*MASTERCARD\b/.test(upper)
    )
  ) return { nome: 'MASTERCARD (CartÃ£o)', base: 'MASTERCARD', categoria: 'Cartão', grupo: 'UNICA' }
  if (hasTripag && /\bD[_\s.-]*CRED[_\s.-]*AMEX\b|\bD[_\s.-]*ANT[_\s.-]*AMEX\b/.test(upper)) {
    return { nome: 'AMEX (CartÃ£o)', base: 'AMEX', categoria: 'Cartão', grupo: 'UNICA' }
  }
  if (hasTripag && /\bD[_\s.-]*CRED[_\s.-]*HIPERCARD\b|\bD[_\s.-]*ANT[_\s.-]*HIPERCARD\b/.test(upper)) {
    return { nome: 'HIPERCARD (CartÃ£o)', base: 'HIPERCARD', categoria: 'Cartão', grupo: 'UNICA' }
  }

  if (
    hasRede &&
    (
      /\bCABAL\s+(?:CRED|CRTO|CREDITO|CD)\s+REDE(?:CARD)?\b/.test(texto) ||
      /\bREDE(?:CARD)?\s+CABAL\s+(?:CD|AT|CRED|CRTO|CREDITO)\b/.test(texto) ||
      /\bCR(?:EDITO)?\s+CABAL\s+REDE(?:CARD)?\b/.test(texto)
    )
  ) return { nome: 'CABAL CREDITO (CartÃ£o)', base: 'CABAL CREDITO', categoria: 'Cartão', grupo: 'REDE' }
  if (hasRede && (/\bCREDITO\s+VISA\b/.test(texto) || /\bCR\s+VISA\b/.test(texto) || /\bCREDTO\s+VISA\s+REDE(?:CARD)?\b/.test(texto))) return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'Cartão', grupo: 'REDE' }
  if (hasRede && (/\bCREDITO\s+ELO\b/.test(texto) || /\bCRTO\s+ELO\b/.test(texto) || /\bELO\s+CRED\s+REDE(?:CARD)?\b/.test(texto))) return { nome: 'ELO CREDITO (CartÃ£o)', base: 'ELO CREDITO', categoria: 'Cartão', grupo: 'REDE' }
  if (hasRede && (/\bCR\s+MASTERCARD\b/.test(texto) || /\bCREDITO\s+MASTERCARD\b/.test(texto) || /\bCTAO\s+CRED\s+MASTERCARD\s+REDE(?:CARD)?\b/.test(texto))) return { nome: 'MASTERCARD (CartÃ£o)', base: 'MASTERCARD', categoria: 'Cartão', grupo: 'REDE' }
  if (hasRede && /\b(?:AMEX|AMERICAN\s+EXPRESS)\s+CRED\s+REDE(?:CARD)?\b/.test(texto)) return { nome: 'AMEX (CartÃ£o)', base: 'AMEX', categoria: 'Cartão', grupo: 'REDE' }

  if (/ANTC|ANTEC|ANTECI/.test(upper)) {
    if (hasTripag && /VISA/.test(upper)) return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'Cartão', grupo: 'UNICA' }
    if (hasTripag && /MASTER/.test(upper)) return { nome: 'MASTERCARD (CartÃ£o)', base: 'MASTERCARD', categoria: 'Cartão', grupo: 'UNICA' }
    if (hasTripag && /ELO/.test(upper)) return { nome: 'ELO CREDITO (CartÃ£o)', base: 'ELO CREDITO', categoria: 'Cartão', grupo: 'UNICA' }
    if (hasRede && /VISA/.test(upper)) return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'Cartão', grupo: 'REDE' }
    if (hasRede && /MASTER/.test(upper)) return { nome: 'MASTERCARD (CartÃ£o)', base: 'MASTERCARD', categoria: 'Cartão', grupo: 'REDE' }
    if (hasRede && /ELO/.test(upper)) return { nome: 'ELO CREDITO (CartÃ£o)', base: 'ELO CREDITO', categoria: 'Cartão', grupo: 'REDE' }
  }

  if (/\bTRIPAG\b/.test(texto)) return { nome: 'TRIPAG (CartÃ£o)', base: 'TRIPAG', categoria: 'Cartão', grupo: 'UNICA' }
  if (/\bUNICA\b|\bTRIANGULO\b/.test(texto)) return { nome: 'UNICA (CartÃ£o)', base: 'UNICA', categoria: 'Cartão', grupo: 'UNICA' }
  if (hasRede) return { nome: 'REDE (CartÃ£o)', base: 'REDE', categoria: 'Cartão', grupo: 'REDE' }
  if (hasStone) return { nome: 'STONE (CartÃ£o)', base: 'STONE', categoria: 'Cartão', grupo: 'STONE' }

  return null
}

export const detectarAgrupamentoResumoBradesco = (descricao) => {
  const original = String(descricao || '')
  const upper = original.toUpperCase()
  const texto = normalizarChaveAdquirente(original)

  if (/\bAMEX\b|\bAMERICAN\s*EXPRESS\b/.test(texto)) {
    return { nome: 'AMEX (CartÃ£o)', base: 'AMEX', categoria: 'Cartão', grupo: 'CIELO (CartÃ£o)' }
  }

  if (/\bHIPER(?:CARD)?\b/.test(texto)) {
    return { nome: 'HIPERCARD (CartÃ£o)', base: 'HIPERCARD', categoria: 'Cartão', grupo: 'CIELO (CartÃ£o)' }
  }

  if (/\bCARTAO\s+VISA\s+ELECTRON\s+CIELO\b/.test(texto)) {
    return { nome: 'VISA ELECTRON (CartÃ£o)', base: 'VISA ELECTRON', categoria: 'Cartão', grupo: 'CIELO (CartÃ£o)' }
  }

  if (/\bCIELO\b.*\bVDA\s+DEBITO\s+MASTER\b.*\bCIELO\b|\bDEBITO\s+MASTER\b/.test(texto)) {
    return { nome: 'MAESTRO (CartÃ£o)', base: 'MAESTRO', categoria: 'Cartão', grupo: 'CIELO (CartÃ£o)' }
  }

  if (/\bC?IELO\b.*\bVDA\s+DEBITO\s+ELO\b.*\bCIELO\b|\bDEBITO\s+ELO\b/.test(texto)) {
    return { nome: 'ELO DEBITO (CartÃ£o)', base: 'ELO DEBITO', categoria: 'Cartão', grupo: 'CIELO (CartÃ£o)' }
  }

  if (/\bC?IELO\b.*\bVDA\s+CREDITO\s+MASTER\b.*\bCIELO\b|\bCREDITO\s+MASTER\b/.test(texto)) {
    return { nome: 'MASTERCARD (CartÃ£o)', base: 'MASTERCARD', categoria: 'Cartão', grupo: 'CIELO (CartÃ£o)' }
  }

  if (/\bC?IELO\b.*\bVDA\s+CREDITO\s+VISA\b.*\bCIELO\b|\bCREDITO\s+VISA\b|\bCR(?:EDITO)?\s+VISA\b|\bVISA\s+CREDITO\b/.test(texto)) {
    return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'Cartão', grupo: 'CIELO (CartÃ£o)' }
  }

  if (/\bVENDAS?\s+CARTAO\s+DE\s+CRED(?:I|U)TO\b/.test(texto)) {
    return { nome: 'VISA (CartÃ£o)', base: 'VISA', categoria: 'Cartão', grupo: 'CIELO (CartÃ£o)' }
  }

  if (/\bC?IELO\b.*\bVDA\s+CREDITO\s+ELO\b.*\bCIELO\b|\bCREDITO\s+ELO\b/.test(texto)) {
    return { nome: 'ELO CREDITO (CartÃ£o)', base: 'ELO CREDITO', categoria: 'Cartão', grupo: 'CIELO (CartÃ£o)' }
  }

  const isPix = /\bPIX\b/.test(upper) || /TRANSF\.?RECEB-?PIX/.test(upper) || /RECEBIMENTO\s+PIX/.test(upper)
  if (!isPix && /\bCIELO(?:[_\s-]|$)/.test(original)) {
    return { nome: 'CIELO (CartÃ£o)', base: 'CIELO', categoria: 'Cartão', grupo: 'CIELO (CartÃ£o)' }
  }

  return null
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
