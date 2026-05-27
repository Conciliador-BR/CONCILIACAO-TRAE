export const useSantanderOfx = () => {
  const lerArquivoTexto = (arquivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result
          if (!(buffer instanceof ArrayBuffer)) {
            throw new Error('Conteúdo inválido do arquivo OFX')
          }

          let texto = ''
          try {
            texto = new TextDecoder('windows-1252').decode(buffer)
          } catch {
            texto = new TextDecoder('utf-8').decode(buffer)
          }

          resolve(String(texto || '').replace(/\r\n/g, '\n'))
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Erro ao ler arquivo OFX'))
      reader.readAsArrayBuffer(arquivo)
    })
  }

  const normalizarValor = (valor) => {
    const s = String(valor || '').trim()
    if (!s) return 0
    const hasComma = s.includes(',')
    const hasDot = s.includes('.')
    let n = s
    if (hasComma && hasDot) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        n = s.replace(/\./g, '').replace(',', '.')
      } else {
        n = s.replace(/,/g, '')
      }
    } else if (hasComma) {
      n = s.replace(',', '.')
    }
    const parsed = parseFloat(n)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (dtPosted) => {
    const s = String(dtPosted || '').trim()
    if (s.length >= 8) {
      const y = s.substring(0, 4)
      const m = s.substring(4, 6)
      const d = s.substring(6, 8)
      return `${d}/${m}/${y}`
    }
    return s
  }

  const extrairCampo = (conteudo, tag) => {
    const regex = new RegExp(`<${tag}>\\s*([^<\\r\\n]*)`, 'i')
    const m = conteudo.match(regex)
    return m ? m[1].trim() : ''
  }

  const parseTransacao = (bloco, idx) => {
    const dtPosted = extrairCampo(bloco, 'DTPOSTED')
    const trnAmtRaw = extrairCampo(bloco, 'TRNAMT')
    const fitId = extrairCampo(bloco, 'FITID')
    const memo = extrairCampo(bloco, 'MEMO')
    const checkNum = extrairCampo(bloco, 'CHECKNUM')
    const trnType = extrairCampo(bloco, 'TRNTYPE')

    if (!dtPosted || !trnAmtRaw) return null

    let valorNumerico = normalizarValor(trnAmtRaw)
    if (String(trnType || '').toUpperCase() === 'DEBIT') {
      valorNumerico = -Math.abs(valorNumerico)
    }

    return {
      id: fitId || `SANTANDER-${idx}`,
      data: formatarData(dtPosted),
      descricao: memo || 'Transação Santander',
      documento: checkNum || fitId || '',
      valor: formatarMoeda(valorNumerico),
      valorNumerico,
      banco: 'Santander',
      origem: 'OFX'
    }
  }

  const parseOFX = (conteudo) => {
    const transacoes = []
    const regexTransacao = /<STMTTRN>\s*([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi
    let match
    let idx = 1
    while ((match = regexTransacao.exec(conteudo)) !== null) {
      const t = parseTransacao(match[1], idx)
      if (t) {
        transacoes.push(t)
      }
      idx += 1
    }
    return transacoes
  }

  const processarOFX = async (arquivo) => {
    try {
      const conteudo = await lerArquivoTexto(arquivo)
      const transacoes = parseOFX(conteudo)
      return {
        sucesso: true,
        transacoes,
        total: transacoes.length
      }
    } catch (error) {
      return {
        sucesso: false,
        erro: error.message || 'Erro ao processar OFX Santander'
      }
    }
  }

  return {
    processarOFX
  }
}
