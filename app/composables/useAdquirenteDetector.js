import { computed, ref } from 'vue'

export const useAdquirenteDetector = () => {
  
  const normalizar = (texto) => {
    if (!texto) return ''
    return String(texto)
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[._-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Configurações comuns de Vouchers (compartilhado entre muitos bancos)
  const vouchersComuns = {
    'TICKET SERVICOS SA': { categoria: 'Voucher', aliases: ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'] },
    'PLUXEE BENEFICIOS BR': { categoria: 'Voucher', aliases: ['PLUXEE BENEFICIOS BR', 'PLUXE BENEFICIOS BR', 'PLUXEE', 'PLUXE', 'A PLUXE', 'TED C RECEBIDA-PLUXEE BENEFICIOS BR'] },
    'ALELO INSTITUICAO DE PAGAMENTO': { categoria: 'Voucher', aliases: ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO', 'RECEBIMENTO ALELO'] },
    'VR BENEFICIOS': { categoria: 'Voucher', aliases: ['VR BENEFICIOS', 'VR BENEF'] },
    'LE CARD ADMINISTRADORA': { categoria: 'Voucher', aliases: ['LE CARD ADMINISTRADORA', 'LE CARD', 'LECARD'] },
    'UP BRASIL ADMINISTRACAO': { categoria: 'Voucher', aliases: ['UP BRASIL ADMINISTRACAO', 'UP BRASIL'] },
    'COMPROCARD': { categoria: 'Voucher', aliases: ['COMPROCARD'] },
    'ECX CARD': { categoria: 'Voucher', aliases: ['ECX CARD'] },
    'FN CARD': { categoria: 'Voucher', aliases: ['FN CARD'] },
    'BEN VISA': { categoria: 'Voucher', aliases: ['BEN VISA'] },
    'CREDISHOP': { categoria: 'Voucher', aliases: ['CREDISHOP'] },
    'CREDI SHOP': { categoria: 'Voucher', aliases: ['CREDI SHOP'] },
    'RC CARD': { categoria: 'Voucher', aliases: ['RC CARD'] },
    'GOOD CARD': { categoria: 'Voucher', aliases: ['GOOD CARD'] },
    'BIG CARD': { categoria: 'Voucher', aliases: ['BIG CARD'] },
    'BK CARD': { categoria: 'Voucher', aliases: ['BK CARD'] },
    'BRASILCARD': { categoria: 'Voucher', aliases: ['BRASILCARD'] },
    'BOLTCARD': { categoria: 'Voucher', aliases: ['BOLTCARD'] },
    'CABAL PRE': { categoria: 'Voucher', aliases: ['CABAL PRE', 'CREDENCIADOR CABAL PRE', 'CABAL BRASIL', 'CREDENCIADOR CABAL BRASIL'] },
    'VEROCARD': { categoria: 'Voucher', aliases: ['VEROCARD'] },
    'VEROCHEQUE': { categoria: 'Voucher', aliases: ['VEROCHEQUE'] },
    'FACECARD': { categoria: 'Voucher', aliases: ['FACECARD'] },
    'VALE CARD': { categoria: 'Voucher', aliases: ['VALE CARD', 'VALECARD'] },
    'NAIP': { categoria: 'Voucher', aliases: ['NAIP'] }
  }

  // Regras de Cartão Padrão (Fallback)
  const regrasCartoesPadrao = [
    { nome: 'UNICA', re: /\bTRIANGULO(?:[_\s-]|$)/i },
    { nome: 'UNICA', re: /\bUNICA(?:[_\s-]|$)/i },
    { nome: 'CIELO', re: /\bCIELO(?:[_\s-]|$)/i },
    { nome: 'SIPAG', re: /\bSIPAG(?:[_\s-]|$)/i },
    { nome: 'SICREDI', re: /\bSICREDI(?:[_\s-]|$)/i },
    { nome: 'REDE', re: /\bREDE(?:CARD)?(?:[_\s-]|$)/i },
    { nome: 'STONE', re: /\bSTONE(?:[_\s-]|$)/i },
    { nome: 'AZULZINHA', re: /\bAZULZINHA(?:[_\s-]|$)/i },
    { nome: 'PAGSEGURO', re: /\bPAG\s?SEGURO\b|\bPAGSEGURO\b|\bPAGBANK\b/i },
    { nome: 'GETNET', re: /\bGETNET\b|\bGET\s?NET\b/i },
    { nome: 'SAFRAPAY', re: /\bSAFRAPAY\b|\bSAFRA\s?PAY\b/i },
    { nome: 'MERCADOPAGO', re: /\bMERCADOPAGO\b|\bMERCADO\s?PAGO\b/i },
    { nome: 'BIN', re: /\bBIN\b/i }
  ]

  // Estratégias Específicas por Banco
  const estrategiasBancos = {
    // Sicoob: Foca em TRIPAG, SIPAG e Vouchers
    'sicoob': {
      regrasCartoes: [
        { nome: 'TRIPAG', re: /\bTRIPAG(?:[_\s-]|$)/i },
        { nome: 'UNICA', re: /\bUNICA(?:[_\s-]|$)/i },
        { nome: 'SIPAG', re: /\bSIPAG(?:[_\s-]|$)/i },
        { nome: 'CIELO', re: /\bCIELO(?:[_\s-]|$)/i },
        ...regrasCartoesPadrao
      ],
      aliases: {
        'TRIPAG': { categoria: 'Cartão', aliases: ['TRIPAG'] },
        ...vouchersComuns
      }
    },
    
    // Safra: Ênfase em SAFRAPAY
    'safra': {
      regrasCartoes: [
        { nome: 'SAFRAPAY', re: /\bSAFRAPAY\b|\bSAFRA\s?PAY\b/i },
        ...regrasCartoesPadrao
      ],
      aliases: {
        'SAFRAPAY': { categoria: 'Cartão', aliases: ['SAFRAPAY', 'SAFRA PAY'] },
        ...vouchersComuns
      }
    },

    // Banco do Brasil: SIPAG (CR CPS VS ELECTRON)
    'banco_do_brasil': {
      regrasCartoes: regrasCartoesPadrao,
      aliases: vouchersComuns,
      customCheck: (upper) => {
        if (/CR\s+CPS\s+VS\s+ELECTRON/i.test(upper)) {
          return { nome: 'SIPAG', base: 'SIPAG', categoria: 'Cartão' }
        }
        return null
      }
    },

    // Bradesco
    'bradesco': {
      regrasCartoes: regrasCartoesPadrao,
      aliases: vouchersComuns
    },

    // Itau
    'itau': {
      regrasCartoes: regrasCartoesPadrao,
      aliases: vouchersComuns
    },

    // Tribanco
    'tribanco': {
      regrasCartoes: regrasCartoesPadrao,
      aliases: vouchersComuns
    }
  }

  const detectarAdquirente = (descricao, banco = null) => {
    const original = String(descricao || '')
    const upper = original.toUpperCase()
    
    // Normalizar nome do banco para chave da estratégia
    let chaveBanco = 'padrao'
    if (banco) {
      const b = banco.toLowerCase()
      if (b.includes('sicoob')) chaveBanco = 'sicoob'
      else if (b.includes('safra')) chaveBanco = 'safra'
      else if (b.includes('brasil') || b.includes('bb')) chaveBanco = 'banco_do_brasil'
      else if (b.includes('bradesco')) chaveBanco = 'bradesco'
      else if (b.includes('itau')) chaveBanco = 'itau'
      else if (b.includes('tribanco')) chaveBanco = 'tribanco'
    }

    const estrategia = estrategiasBancos[chaveBanco] || { 
      regrasCartoes: regrasCartoesPadrao, 
      aliases: vouchersComuns 
    }

    // Regras de exclusão/identificação de PIX (geralmente não é cartão, mas depende do contexto)
    // No código original: const podeDetectarCartao = !(isPix && !regrasCartoes[5].re.test(original))
    // Simplificamos mantendo a detecção ativa.
    const podeDetectarCartao = true 

    if (podeDetectarCartao) {
      // Checagem customizada (ex: BB CR CPS VS ELECTRON)
      if (estrategia.customCheck) {
        const customResult = estrategia.customCheck(upper)
        if (customResult) return customResult
      }

      for (const r of estrategia.regrasCartoes) {
        if (r.re.test(original)) {
          return { nome: r.nome, base: r.nome, categoria: 'Cartão' }
        }
      }
    }

    const texto = normalizar(descricao)
    for (const [nomeCanonico, info] of Object.entries(estrategia.aliases)) {
      for (const alias of info.aliases) {
        const aliasNorm = normalizar(alias)
        if (texto.includes(aliasNorm)) {
          return { nome: nomeCanonico, base: nomeCanonico, categoria: info.categoria }
        }
      }
    }

    // Fallback global se não encontrou na estratégia específica
    if (chaveBanco !== 'padrao') {
       for (const r of regrasCartoesPadrao) {
        if (r.re.test(original)) {
          return { nome: r.nome, base: r.nome, categoria: 'Cartão' }
        }
      }
    }

    return null
  }

  return {
    detectarAdquirente,
    normalizar
  }
}
