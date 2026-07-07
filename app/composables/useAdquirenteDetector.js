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

  const contemAliasExato = (textoNormalizado, aliasNormalizado) => {
    const aliasEscapado = aliasNormalizado.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
    const re = new RegExp(`(?:^|[^A-Z0-9])${aliasEscapado}(?:$|[^A-Z0-9])`)
    return re.test(textoNormalizado)
  }

  // ConfiguraÃ§Ãµes comuns de Vouchers (compartilhado entre muitos bancos)
  const vouchersComuns = {
    'TICKET SERVICOS SA': { categoria: 'Voucher', aliases: ['TICKET SERVICOS SA', 'TICKET SERVICOS', 'TICKET'] },
    'PLUXEE BENEFICIOS BR': { categoria: 'Voucher', aliases: ['PLUXEE BENEFICIOS BR', 'PLUXE BENEFICIOS BR', 'PLUXEE', 'PLUXE', 'A PLUXE', 'TED C RECEBIDA-PLUXEE BENEFICIOS BR'] },
    'ALELO INSTITUICAO DE PAGAMENTO': { categoria: 'Voucher', aliases: ['ALELO INSTITUICAO DE PAGAMENTO', 'ALELO', 'RECEBIMENTO ALELO'] },
    'VR BENEFICIOS': { categoria: 'Voucher', aliases: ['VR BENEFICIOS', 'VR BENEF', 'BANCO VR', 'PIX BANCO VR', 'VR BENEFICIOS SER PROC', 'VR BENEFCIOS SERV PROC', 'VR BENEFCIOS SERV', 'VR BENEFICIOS SERV', 'VR BENEFICIOS REEMBOLSO', 'VR BENEFCIO'] },
    'LE CARD ADMINISTRADORA': { categoria: 'Voucher', aliases: ['LE CARD ADMINISTRADORA', 'LE CARD ADMINISTRADOR', 'LE CARD ADM', 'LECARD'] },
    'UP BRASIL ADMINISTRACAO': { categoria: 'Voucher', aliases: ['UP BRASIL ADMINISTRACAO', 'UP BRASIL'] },
    'COMPROCARD': { categoria: 'Voucher', aliases: ['COMPROCARD'] },
    'ECX CARD': { categoria: 'Voucher', aliases: ['ECX CARD'] },
    'FN CARD': { categoria: 'Voucher', aliases: ['FN CARD'] },
    'BEN VISA': { categoria: 'Voucher', aliases: ['BEN VISA'] },
    'VISA BENEFI': { categoria: 'Voucher', aliases: ['VISA BENEFI', 'BENEFI VISA'] },
    'MASTERCARD BENEFI': { categoria: 'Voucher', aliases: ['MASTERCARD BENEFI', 'MASTER BENEFI', 'BENEFI MASTERCARD', 'BENEFI MASTER'] },
    'ELO BENEFI': { categoria: 'Voucher', aliases: ['ELO BENEFI', 'BENEFI ELO'] },
    'CREDISHOP': { categoria: 'Voucher', aliases: ['CREDISHOP'] },
    'CREDI SHOP': { categoria: 'Voucher', aliases: ['CREDI SHOP'] },
    'RC CARD': { categoria: 'Voucher', aliases: ['RC CARD'] },
    'GOOD CARD': { categoria: 'Voucher', aliases: ['GOOD CARD', 'GOODCARD'] },
    'BIG CARD': { categoria: 'Voucher', aliases: ['BIG CARD', 'BIGCARD', 'BIGCARD ADMINISTRADORA DE CONVEN'] },
    'BK CARD': { categoria: 'Voucher', aliases: ['BK CARD'] },
    'BRASILCARD': { categoria: 'Voucher', aliases: ['BRASILCARD', 'BRASIL CARD', 'BRASIL CARD INSTITUIC', 'BOLT CARD', 'BOLTCARD', 'BOLT CARD CREDENCIADORA'] },
    'CABAL PRE': { categoria: 'Voucher', aliases: ['CABAL PRE', 'CREDENCIADOR CABAL PRE', 'CABAL BRASIL', 'CREDENCIADOR CABAL BRASIL', 'CRTO CABAL SICOOB SO', 'CARTAO CABAL SICOOB SO', 'CABAL SICOOB SO'] },
    'CABAL': { categoria: 'Voucher', aliases: ['CABAL CD'] },
    'VEROCARD': { categoria: 'Voucher', aliases: ['VEROCARD'] },
    'VEROCHEQUE': { categoria: 'Voucher', aliases: ['VEROCHEQUE'] },
    'FACECARD': { categoria: 'Voucher', aliases: ['FACECARD'] },
    'VALE CARD': { categoria: 'Voucher', aliases: ['VALE CARD', 'VALECARD', 'AGL ADQUIRENCIA', 'AGL ADQUIRENCIA LTDA'] },
    'NUTRICASH': { categoria: 'Voucher', aliases: ['NUTRICASH', 'NUTRI CASH', 'NUTRIACH', 'NUTRIACASH', 'NUTRICASH SERVICOS LTDA', 'NUTRIACH SERVICOS LTDA', 'NUTRIACASH SERVICOS LTDA'] },
    'LIBERCARD': { categoria: 'Voucher', aliases: ['LIBERCARD', 'LIBER CARD', 'LIBERCAD', 'MANCACARU', 'MANDACARU', 'MANDACARU ADMINISTRADORA', 'MANACARU'] },
    'GREEN CARD': { categoria: 'Voucher', aliases: ['GREEN CARD'] },
    'NAIP': { categoria: 'Voucher', aliases: ['NAIP'] },
    'SENFF': { categoria: 'Voucher', aliases: ['SENFF', 'SENFFNET', 'SENFNET', 'SENF'] },
    'BANRICARD': { categoria: 'Voucher', aliases: ['BANRICARD', 'BANRI CARD', 'BANRICOMPRAS', 'ANTECIPACAO BANRICOMPRAS', 'BANRI A VISTA', 'VERO ANTECIPACAO BANRICARD', 'VERO BANRICARD OUTROS'] }
  }

  // Regras de CartÃ£o PadrÃ£o (Fallback)
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
    { nome: 'SAFRAPAY', re: /\bSAFRAPAY\b|\bSAFRA\s?PAY\b|\bSAFRA\b/i },
    { nome: 'MERCADOPAGO', re: /\bMERCADOPAGO\b|\bMERCADO\s?PAGO\b/i },
    { nome: 'BIN', re: /\bBIN\b/i }
  ]

  // EstratÃ©gias EspecÃ­ficas por Banco
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
      customCheck: (upper) => {
        const texto = String(upper || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')

        // CIELO/Sicoob - Débito
        if (/\bDEB[\s._-]*VISA(?:\s+ELECTRON)?\b/.test(texto)) return { nome: 'VISA ELECTRON', base: 'VISA ELECTRON', categoria: 'Cartão' }
        if (/\bDEB[\s._-]*MAESTRO\b/.test(texto)) return { nome: 'MAESTRO', base: 'MAESTRO', categoria: 'Cartão' }
        if (/\bDEB[\s._-]*ELO(?:\s+DEBITO)?\b/.test(texto)) return { nome: 'ELO DÉBITO', base: 'ELO DÉBITO', categoria: 'Cartão' }

        const patMatch = texto.match(/\b(VISA|MASTERCARD|MASTER|ELO)\s+PAT\b|\bPAT\s+(VISA|MASTERCARD|MASTER|ELO)\b/)
        if (patMatch) {
          const bandeira = (patMatch[1] || patMatch[2] || '').trim()
          if (bandeira === 'MASTER' || bandeira === 'MASTERCARD') {
            return { nome: 'MASTERCARD VOUCHER', base: 'MASTERCARD VOUCHER', categoria: 'Voucher' }
          }
          if (bandeira === 'ELO') {
            return { nome: 'ELO VOUCHER', base: 'ELO VOUCHER', categoria: 'Voucher' }
          }
          if (bandeira === 'VISA') {
            return { nome: 'VISA VOUCHER', base: 'VISA VOUCHER', categoria: 'Voucher' }
          }
        }

        // CIELO/Sicoob - Crédito
        if (/\bCRED[\s._-]*VISA\b/.test(texto)) return { nome: 'VISA', base: 'VISA', categoria: 'Cartão' }
        if (/\bCRED[\s._-]*MASTERCARD\b/.test(texto)) return { nome: 'MASTERCARD', base: 'MASTERCARD', categoria: 'Cartão' }
        if (/\bCRED[\s._-]*ELO\b/.test(texto)) return { nome: 'ELO CRÉDITO', base: 'ELO CRÉDITO', categoria: 'Cartão' }
        if (/\b(CRED|CRE|CR|CREDITO|CRTO)\b.*\b(AMEX|AMERICAN\s+EXP(?:RESS|RE)?)\b/.test(texto) || /\bOUTRAS\s+BANDEIRAS\b.*\bAMERICAN\s+EXP(?:RESS|RE)?\b/.test(texto)) return { nome: 'AMEX', base: 'AMEX', categoria: 'Cartão' }
        if (/\b(CRED|CRE|CR|CREDITO|CRTO)\b.*\b(HIPERCARD|HIPER)\b/.test(texto)) return { nome: 'HIPERCARD', base: 'HIPERCARD', categoria: 'Cartão' }

        return null
      },
      aliases: {
        'TRIPAG': { categoria: 'CartÃ£o', aliases: ['TRIPAG'] },
        ...vouchersComuns
      }
    },

    // Sicredi: usa descricoes sintéticas para Cielo e Unica
    'sicredi': {
      regrasCartoes: regrasCartoesPadrao,
      aliases: vouchersComuns,
      customCheck: (upper) => {
        const texto = String(upper || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[._-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        if (
          /\bCIELO\s+DEBITO\s+VISA\b/.test(texto) ||
          /\bCIELO\s+DEBITO\s+(?:MASTER|MASTERCARD)\b/.test(texto) ||
          /\bCIELO\s+DEBITO\s+ELO\b/.test(texto) ||
          /\bCIELO\s+CREDITO\s+VISA\b/.test(texto) ||
          /\bCIELO\s+CREDITO\s+(?:MASTER|MASTERCARD)\b/.test(texto) ||
          /\bCIELO\s+CREDITO\s+ELO\b/.test(texto) ||
          /\bCIELO\s+CREDITO\s+AMEX\b/.test(texto) ||
          /\bCIELO\s+CREDITO\s+HIPER(?:CARD)?\b/.test(texto)
        ) {
          return { nome: 'CIELO', base: 'CIELO', categoria: 'Cartão' }
        }

        if (
          /\bSUB\s+DB\s+VISA\b/.test(texto) ||
          /\bSUB\s+DB\s+(?:MASTER|MASTERCARD)\b/.test(texto) ||
          /\bSUB\s+DB\s+ELO\b/.test(texto) ||
          /\bSUB\s+CD\s+VISA\b/.test(texto) ||
          /\bSUB\s+CD\s+(?:MASTER|MASTERCARD)\b/.test(texto) ||
          /\bSUB\s+CD\s+ELO\b/.test(texto) ||
          /\bSUB\s+CD\s+AMEX\b/.test(texto) ||
          /\bSUB\s+CD\s+HIPER(?:CARD)?\b/.test(texto) ||
          /\bSUB\s+ANTEC\s+VISA\b/.test(texto) ||
          /\bSUB\s+ANTEC\s+(?:MASTER|MASTERCARD)\b/.test(texto) ||
          /\bSUB\s+ANTEC\s+ELO\b/.test(texto) ||
          /\bSUB\s+ANTEC\s+AMEX\b/.test(texto) ||
          /\bSUB\s+ANTEC\s+HIPER(?:CARD)?\b/.test(texto)
        ) {
          return { nome: 'UNICA', base: 'UNICA', categoria: 'Cartão' }
        }

        return null
      }
    },
    
    // Safra: ÃŠnfase em SAFRAPAY
    'safra': {
      regrasCartoes: [
        { nome: 'SAFRAPAY', re: /\bSAFRAPAY\b|\bSAFRA\s?PAY\b|\bSAFRA\b/i },
        ...regrasCartoesPadrao
      ],
      aliases: {
        'SAFRAPAY': { categoria: 'CartÃ£o', aliases: ['SAFRAPAY', 'SAFRA PAY', 'SAFRA'] },
        ...vouchersComuns
      }
    },

    // Banco do Brasil: SIPAG (CR CPS VS ELECTRON)
    'banco_do_brasil': {
      regrasCartoes: regrasCartoesPadrao,
      aliases: vouchersComuns,
      customCheck: (upper) => {
        if (/CR\s+CPS\s+VS\s+ELECTRON/i.test(upper)) {
          return { nome: 'SIPAG', base: 'SIPAG', categoria: 'CartÃ£o' }
        }
        return null
      }
    },

    // Bradesco
    'bradesco': {
      regrasCartoes: regrasCartoesPadrao,
      aliases: {
        ...vouchersComuns,
        'LE CARD ADMINISTRADORA': {
          categoria: 'Voucher',
          aliases: ['LE CARD ADMINISTRADORA', 'LE CARD ADMINISTRADOR', 'LECARD']
        }
      },
      customCheck: (upper) => {
        const texto = String(upper || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[._-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        if (/\bVOUCHER\s+ELO\b.*\bCIELO\b|\bELO\s+VOUCHER\b.*\bCIELO\b/.test(texto)) {
          return { nome: 'ELO VOUCHER', base: 'ELO VOUCHER', categoria: 'Voucher' }
        }
        if (/\bVOUCHER\s+VISA\b.*\bCIELO\b|\bVISA\s+VOUCHER\b.*\bCIELO\b/.test(texto)) {
          return { nome: 'VISA VOUCHER', base: 'VISA VOUCHER', categoria: 'Voucher' }
        }
        if (/\bVOUCHER\s+(?:MASTER|MASTERCARD)\b.*\bCIELO\b|\b(?:MASTER|MASTERCARD)\s+VOUCHER\b.*\bCIELO\b/.test(texto)) {
          return { nome: 'MASTERCARD VOUCHER', base: 'MASTERCARD VOUCHER', categoria: 'Voucher' }
        }

        return null
      }
    },

    // Caixa: usa descricoes resumidas da Cielo e da Rede por bandeira
    'caixa': {
      regrasCartoes: regrasCartoesPadrao,
      aliases: vouchersComuns,
      customCheck: (upper) => {
        const texto = String(upper || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[._-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        if (/\bCIEL\s+VS\s+CD\b/.test(texto)) return { nome: 'VISA ELECTRON', base: 'VISA ELECTRON', categoria: 'Cartao' }
        if (/\bCIEL\s+EL\s+CD\b/.test(texto)) return { nome: 'ELO DEBITO', base: 'ELO DEBITO', categoria: 'Cartao' }
        if (/\bCIEL\s+MC\s+CD\b/.test(texto)) return { nome: 'MAESTRO', base: 'MAESTRO', categoria: 'Cartao' }
        if (/\bCIEL\s+VS\s+CC\b/.test(texto)) return { nome: 'VISA', base: 'VISA', categoria: 'Cartao' }
        if (/\bCIEL\s+EL\s+CC\b/.test(texto)) return { nome: 'ELO CREDITO', base: 'ELO CREDITO', categoria: 'Cartao' }
        if (/\bCIEL\s+MC\s+CC\b/.test(texto)) return { nome: 'MASTERCARD', base: 'MASTERCARD', categoria: 'Cartao' }
        if (/\bCIEL\s+AE\s+CC\b/.test(texto)) return { nome: 'AMEX', base: 'AMEX', categoria: 'Cartao' }

        if (/\bREDE\s+VS\s+CD\b/.test(texto)) return { nome: 'VISA ELECTRON', base: 'VISA ELECTRON', categoria: 'Cartao' }
        if (/\bREDE\s+EL\s+CD\b/.test(texto)) return { nome: 'ELO DEBITO', base: 'ELO DEBITO', categoria: 'Cartao' }
        if (/\bREDE\s+MC\s+CD\b/.test(texto)) return { nome: 'MAESTRO', base: 'MAESTRO', categoria: 'Cartao' }
        if (/\bREDE\s+VS\s+(?:CC|AT)\b/.test(texto)) return { nome: 'VISA', base: 'VISA', categoria: 'Cartao' }
        if (/\bREDE\s+EL\s+(?:CC|AT)\b/.test(texto)) return { nome: 'ELO CREDITO', base: 'ELO CREDITO', categoria: 'Cartao' }
        if (/\bREDE\s+MC\s+(?:CC|AT)\b/.test(texto)) return { nome: 'MASTERCARD', base: 'MASTERCARD', categoria: 'Cartao' }
        if (/\bREDE\s+AE\s+(?:CC|AT)\b/.test(texto)) return { nome: 'AMEX', base: 'AMEX', categoria: 'Cartao' }

        return null
      }
    },

    // Banrisul: Banricard e Stone aparecem em nomenclaturas resumidas no extrato.
    'banrisul': {
      regrasCartoes: regrasCartoesPadrao,
      aliases: vouchersComuns,
      customCheck: (upper) => {
        const texto = String(upper || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[._-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        if (/\bPAG\s?SEG(?:URO|UR)?\b|\bPAGUE\s+SEGURO\b|\bPAGBANK\b/.test(texto)) {
          if (/\bELO\b.*\b(DBTO|DEB|DEBITO)\b|\bDBTO\b.*\bELO\b/.test(texto)) return { nome: 'ELO DEBITO', base: 'ELO DEBITO', categoria: 'Cartão' }
          if (/\bELO\b.*\b(CRED|CREDITO|CRE|CRTO|AT)\b|\b(CRED|CREDITO|CRE|CRTO)\b.*\bELO\b/.test(texto)) return { nome: 'ELO CREDITO', base: 'ELO CREDITO', categoria: 'Cartão' }
          if (/\bVISA\b.*\b(DBTO|DEB|DEBITO)\b|\bDBTO\b.*\bVISA\b|\bVISA\b.*\bELECTRON\b/.test(texto)) return { nome: 'VISA ELECTRON', base: 'VISA ELECTRON', categoria: 'Cartão' }
          if (/\bVISA\b.*\b(CRED|CREDITO|CRE|CRTO|AT)\b|\b(CRED|CREDITO|CRE|CRTO)\b.*\bVISA\b/.test(texto)) return { nome: 'VISA', base: 'VISA', categoria: 'Cartão' }
          if (/\b(MASTER|MASTERCARD|MAESTRO)\b.*\b(DBTO|DEB|DEBITO)\b|\bDBTO\b.*\b(MASTER|MASTERCARD|MAESTRO)\b/.test(texto)) return { nome: 'MAESTRO', base: 'MAESTRO', categoria: 'Cartão' }
          if (/\b(MASTER|MASTERCARD)\b.*\b(CRED|CREDITO|CRE|CRTO|AT)\b|\b(CRED|CREDITO|CRE|CRTO)\b.*\b(MASTER|MASTERCARD)\b/.test(texto)) return { nome: 'MASTERCARD', base: 'MASTERCARD', categoria: 'Cartão' }
          if (/\bAMEX\b|\bAMERICAN\s+EXPRESS\b/.test(texto)) return { nome: 'AMEX', base: 'AMEX', categoria: 'Cartão' }
          if (/\bHIPER(?:CARD)?\b/.test(texto)) return { nome: 'HIPERCARD', base: 'HIPERCARD', categoria: 'Cartão' }
          return { nome: 'PAGSEGURO', base: 'PAGSEGURO', categoria: 'Cartão' }
        }

        return null
      }
    },

    // Itau
    'itau': {
      regrasCartoes: regrasCartoesPadrao.filter(r => r.nome !== 'PAGSEGURO' && r.nome !== 'REDE'),
      aliases: vouchersComuns,
      customCheck: (upper) => {
        if (/\bBOLETO\s*PAGO\b.*\bREDE\b/.test(upper)) return null
        const isPagSeguroContexto = /\bPAG\s?SEGURO\b|\bPAGSEGURO\b|\bPAGBANK\b|\bPAGSEG\b|PAGSEG(?:URO)?/.test(upper)

        if (isPagSeguroContexto) {
          if (/TED\s*290(?:[.,]0+)?\s*PAGSEG(?:URO)?\s*IN\w*/.test(upper)) return { nome: 'PIX', base: 'PIX', categoria: 'CartÃ£o' }
          if (/\bPAGSEG(?:URO)?\b.*\bELO\b[\s._-]*(DB(?:TO)?|DEB|DEBITO)\d*|\bPAGSEG(?:URO)?\b.*\bDBTO[\s._-]*ELO\b/.test(upper)) return { nome: 'ELO DÃ‰BITO', base: 'ELO DÃ‰BITO', categoria: 'CartÃ£o' }
          if (/\bPAGSEG(?:URO)?\b.*\bELO\b[\s._-]*(CD|AT|CRED|CREDITO)\d*|\bPAGSEG(?:URO)?\b.*\bCR(?:EDITO)?[\s._-]*ELO\b/.test(upper)) return { nome: 'ELO CRÃ‰DITO', base: 'ELO CRÃ‰DITO', categoria: 'CartÃ£o' }
          if (/\bPAGSEG(?:URO)?\b.*\bMAST(?:ER(?:CARD)?)?\b[\s._-]*(DB(?:TO)?|DEB|DEBITO)\d*|\bPAGSEG(?:URO)?\b.*\bDBTO[\s._-]*MAESTRO\b/.test(upper)) return { nome: 'MAESTRO', base: 'MAESTRO', categoria: 'CartÃ£o' }
          if (/\bPAGSEG(?:URO)?\b.*\bMAST(?:ER(?:CARD)?)?\b[\s._-]*(CD|AT|CRED|CREDITO)\d*|\bPAGSEG(?:URO)?\b.*\bCR(?:EDITO)?[\s._-]*MAST(?:ER(?:CARD)?)?\b/.test(upper)) return { nome: 'MASTERCARD', base: 'MASTERCARD', categoria: 'CartÃ£o' }
          if (/\bPAGSEG(?:URO)?\b.*\bVISA\b[\s._-]*(DB(?:TO)?|DEB|DEBITO)\d*|\bPAGSEG(?:URO)?\b.*\bDBTO[\s._-]*VISA\b|\bPAGSEG(?:URO)?\b.*\bVISA[\s._-]*ELECTRON\b/.test(upper)) return { nome: 'VISA ELECTRON', base: 'VISA ELECTRON', categoria: 'CartÃ£o' }
          if (/\bPAGSEG(?:URO)?\b.*\bVISA\b[\s._-]*(CD|AT|CRED|CREDITO)\d*|\bPAGSEG(?:URO)?\b.*\bCR(?:EDITO)?[\s._-]*VISA\b/.test(upper)) return { nome: 'VISA', base: 'VISA', categoria: 'CartÃ£o' }
          if (/\bPAGSEG(?:URO)?\b.*\bAMEX\b|\bPAGSEG(?:URO)?\b.*\bAMERICAN\s*EXPRESS\b/.test(upper)) return { nome: 'AMEX', base: 'AMEX', categoria: 'CartÃ£o' }
          if (/\bPAGSEG(?:URO)?\b.*\bHIPER(?:CARD)?\b/.test(upper)) return { nome: 'HIPERCARD', base: 'HIPERCARD', categoria: 'CartÃ£o' }
        }

        if (/REDE[\s._-]*CABA(?:L)?[\s._-]*(DB(?:TO)?|DEB|DEBITO)\d*|\bDBTO[\s._-]*CABA(?:L)?\b/.test(upper)) {
          return { nome: 'CABAL DEBITO', base: 'CABAL DEBITO', categoria: 'CartÃ£o' }
        }
        if (/REDE[\s._-]*CABA(?:L)?[\s._-]*(CD|AT|CRED|CREDITO)\d*|\bCR(?:EDITO)?[\s._-]*CABA(?:L)?\b/.test(upper)) {
          return { nome: 'CABAL CREDITO', base: 'CABAL CREDITO', categoria: 'CartÃ£o' }
        }
        if (!/\bREDE\b/.test(upper) && /\bCABAL\b[\s._-]*(CD|AT|CRED|CREDITO)\b|\b(CD|AT|CRED|CREDITO)\b[\s._-]*CABAL\b/.test(upper)) {
          return { nome: 'CABAL', base: 'CABAL', categoria: 'Voucher' }
        }
        return null
      }
    },

    // Tribanco
    'tribanco': {
      regrasCartoes: regrasCartoesPadrao,
      aliases: vouchersComuns,
      customCheck: (upper) => {
        const texto = String(upper || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[._-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        // Prioridade Tribanco: BENE/BENEFI é voucher e deve manter a bandeira.
        if (/\bBENE(?:FI)?\b/.test(texto)) {
          if (/\bVISA\b/.test(texto)) return { nome: 'VISA VOUCHER', base: 'VISA', categoria: 'Cartão' }
          if (/\b(MASTERCARD|MASTER)\b/.test(texto)) return { nome: 'MASTERCARD VOUCHER', base: 'MASTERCARD', categoria: 'Cartão' }
          if (/\bELO\b/.test(texto)) return { nome: 'ELO VOUCHER', base: 'ELO CRÉDITO', categoria: 'Cartão' }
          if (/\b(AMEX|AMERICAN\s+EXPRESS)\b/.test(texto)) return { nome: 'AMEX VOUCHER', base: 'AMEX', categoria: 'Cartão' }
        }

        if (/\bRECEBIVEIS?\s+CREDITO\b/.test(texto) && /\bREDE(?:CARD)?\b/.test(texto)) {
          const ehVoucher = /\b(PAT|BENE(?:FI)?|VOUCHER)\b/.test(texto)
          if (/\bVISA\b/.test(texto)) return { nome: ehVoucher ? 'VISA VOUCHER' : 'VISA', base: 'VISA', categoria: 'Cartão' }
          if (/\b(MASTERCARD|MASTER)\b/.test(texto)) return { nome: ehVoucher ? 'MASTERCARD VOUCHER' : 'MASTERCARD', base: 'MASTERCARD', categoria: 'Cartão' }
          if (/\bELO\b/.test(texto)) return { nome: ehVoucher ? 'ELO VOUCHER' : 'ELO CRÉDITO', base: 'ELO CRÉDITO', categoria: 'Cartão' }
          if (/\b(AMEX|AMERICAN\s+EXPRESS)\b/.test(texto)) return { nome: ehVoucher ? 'AMEX VOUCHER' : 'AMEX', base: 'AMEX', categoria: 'Cartão' }
        }

        if (/\bRECEBIVEIS?\s+CREDITO\b/.test(texto)) {
          return { nome: 'MASTERCARD VOUCHER', base: 'MASTERCARD', categoria: 'Cartão' }
        }

        // Regras EspecÃ­ficas Tribanco/Tripag/Unica (Separar por Bandeira)
        // DÃ©bito
        if (/\bDBTO\s+VISA\b/.test(upper)) return { nome: 'VISA ELECTRON', base: 'VISA ELECTRON', categoria: 'CartÃ£o' }
        if (/\bDBTO\s+ELO\b/.test(upper)) return { nome: 'ELO DÃ‰BITO', base: 'ELO DÃ‰BITO', categoria: 'CartÃ£o' }
        if (/\bDBTO\s+MAESTRO\b/.test(upper)) return { nome: 'MAESTRO', base: 'MAESTRO', categoria: 'CartÃ£o' }
        
        // CrÃ©dito
        if (/\bCREDITO\s+VISA\b|\bCR\s+VISA\b/.test(upper)) return { nome: 'VISA', base: 'VISA', categoria: 'CartÃ£o' }
        if (/\bCREDITO\s+ELO\b|\bCRTO\s+ELO\b/.test(upper)) return { nome: 'ELO CRÃ‰DITO', base: 'ELO CRÃ‰DITO', categoria: 'CartÃ£o' }
        if (/\bCR\s+MASTERCARD\b|\bCREDITO\s+MASTERCARD\b/.test(upper)) return { nome: 'MASTERCARD', base: 'MASTERCARD', categoria: 'CartÃ£o' }

        // AntecipaÃ§Ã£o (Considerar CrÃ©dito)
        if (/ANTC|ANTEC|ANTECI/.test(upper)) {
            if (/VISA/.test(upper)) return { nome: 'VISA', base: 'VISA', categoria: 'CartÃ£o' }
            if (/MASTER/.test(upper)) return { nome: 'MASTERCARD', base: 'MASTERCARD', categoria: 'CartÃ£o' }
            if (/ELO/.test(upper)) return { nome: 'ELO CRÃ‰DITO', base: 'ELO CRÃ‰DITO', categoria: 'CartÃ£o' }
        }
        
        return null
      }
    },

    // Stone: descriÃ§Ã£o costuma vir como "Recebimento vendas - Elo | DÃ©bito"
    'stone': {
      regrasCartoes: regrasCartoesPadrao,
      aliases: vouchersComuns,
      customCheck: (upper) => {
        const texto = String(upper || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[._-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

        if (/\bPIX\b|\bTRANSFERENCIA\b|\bDEVOLUCAO\b/.test(texto)) return null

        if (/RECEBIMENTO\s+VENDAS.*ELO.*DEBITO/.test(texto)) return { nome: 'ELO DÃ‰BITO', base: 'ELO DÃ‰BITO', categoria: 'CartÃ£o' }
        if (/RECEBIMENTO\s+VENDAS.*ELO.*CREDITO/.test(texto)) return { nome: 'ELO CRÃ‰DITO', base: 'ELO CRÃ‰DITO', categoria: 'CartÃ£o' }
        if (/RECEBIMENTO\s+VENDAS.*VISA.*DEBITO/.test(texto)) return { nome: 'VISA ELECTRON', base: 'VISA ELECTRON', categoria: 'CartÃ£o' }
        if (/RECEBIMENTO\s+VENDAS.*VISA.*CREDITO/.test(texto)) return { nome: 'VISA', base: 'VISA', categoria: 'CartÃ£o' }
        if (/RECEBIMENTO\s+VENDAS.*MASTER.*DEBITO/.test(texto)) return { nome: 'MAESTRO', base: 'MAESTRO', categoria: 'CartÃ£o' }
        if (/RECEBIMENTO\s+VENDAS.*MASTER.*CREDITO/.test(texto)) return { nome: 'MASTERCARD', base: 'MASTERCARD', categoria: 'CartÃ£o' }
        if (/RECEBIMENTO\s+VENDAS.*AMEX/.test(texto)) return { nome: 'AMEX', base: 'AMEX', categoria: 'CartÃ£o' }
        if (/RECEBIMENTO\s+VENDAS.*HIPER/.test(texto)) return { nome: 'HIPERCARD', base: 'HIPERCARD', categoria: 'CartÃ£o' }

        if (/\bDEBITO\s+STONE\b/.test(texto)) return { nome: 'STONE', base: 'STONE', categoria: 'CartÃ£o' }
        if (/\bANTECIP(?:ACAO)?\s+STONE\b/.test(texto) || /\bCREDIT\s+STONE\b/.test(texto)) {
          return { nome: 'STONE', base: 'STONE', categoria: 'CartÃ£o' }
        }

        // AntecipaÃ§Ã£o da Stone: manter bandeira quando estiver explÃ­cita no texto.
        if (/ANTECIPACAO/.test(texto)) {
          if (/ELO/.test(texto)) return { nome: 'ELO CRÃ‰DITO', base: 'ELO CRÃ‰DITO', categoria: 'CartÃ£o' }
          if (/VISA/.test(texto)) return { nome: 'VISA', base: 'VISA', categoria: 'CartÃ£o' }
          if (/MASTER/.test(texto)) return { nome: 'MASTERCARD', base: 'MASTERCARD', categoria: 'CartÃ£o' }
        }

        if (/\b(RECEBIMENTO|VENDAS?|ANTECIP|CREDITO|CREDIT|DEBITO)\b/.test(texto)) {
          return { nome: 'STONE', base: 'STONE', categoria: 'CartÃ£o' }
        }
        return null
      }
    }
  }

  const detectarAdquirente = (descricao, banco = null) => {
    const original = String(descricao || '')
    const upper = original.toUpperCase()
    
    // Normalizar nome do banco para chave da estratÃ©gia
    let chaveBanco = 'padrao'
    if (banco) {
      const b = banco.toLowerCase()
      if (b.includes('sicoob')) chaveBanco = 'sicoob'
      else if (b.includes('sicredi')) chaveBanco = 'sicredi'
      else if (b.includes('caixa')) chaveBanco = 'caixa'
      else if (b.includes('safra')) chaveBanco = 'safra'
      else if (b.includes('brasil') || b.includes('bb')) chaveBanco = 'banco_do_brasil'
      else if (b.includes('bradesco')) chaveBanco = 'bradesco'
      else if (b.includes('itau')) chaveBanco = 'itau'
      else if (b.includes('tribanco')) chaveBanco = 'tribanco'
      else if (b.includes('banrisul')) chaveBanco = 'banrisul'
      else if (b.includes('stone')) chaveBanco = 'stone'
    }

    const estrategia = estrategiasBancos[chaveBanco] || { 
      regrasCartoes: regrasCartoesPadrao, 
      aliases: vouchersComuns 
    }

    // Regras de exclusÃ£o/identificaÃ§Ã£o de PIX (geralmente nÃ£o Ã© cartÃ£o, mas depende do contexto)
    // No cÃ³digo original: const podeDetectarCartao = !(isPix && !regrasCartoes[5].re.test(original))
    // Simplificamos mantendo a detecÃ§Ã£o ativa.
    const podeDetectarCartao = true 

    if (podeDetectarCartao) {
      // Checagem customizada (ex: BB CR CPS VS ELECTRON)
      if (estrategia.customCheck) {
        const customResult = estrategia.customCheck(upper)
        if (customResult) return customResult
      }

      for (const r of estrategia.regrasCartoes) {
        if (r.re.test(original)) {
          return { nome: r.nome, base: r.nome, categoria: 'CartÃ£o' }
        }
      }
    }

    const texto = normalizar(descricao)
    for (const [nomeCanonico, info] of Object.entries(estrategia.aliases)) {
      if (nomeCanonico === 'VR BENEFICIOS') {
        const ehPadraoVrPix =
          texto.startsWith('RECEBIMENTO VIA PIX VR BENEF') ||
          texto.startsWith('PIX RECEBIDO VR BENEF') ||
          texto.includes('VR BENEFCIO') ||
          texto.includes('VR BENEF') ||
          texto.includes('BANCO VR') ||
          texto.includes('PIX BANCO VR') ||
          texto.includes('VR BENEFICIOS REEMBOLSO') ||
          texto.includes('VR BENEFICIOS SER PROC') ||
          texto.includes('VR BENEFCIOS SERV PROC')
        if (!ehPadraoVrPix) continue
      }
      for (const alias of info.aliases) {
        const aliasNorm = normalizar(alias)
        if (contemAliasExato(texto, aliasNorm)) {
          return { nome: nomeCanonico, base: nomeCanonico, categoria: info.categoria }
        }
      }
    }

    // Fallback global se nÃ£o encontrou na estratÃ©gia especÃ­fica
    if (chaveBanco !== 'padrao') {
       for (const r of regrasCartoesPadrao) {
        if (r.re.test(original)) {
          return { nome: r.nome, base: r.nome, categoria: 'CartÃ£o' }
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

