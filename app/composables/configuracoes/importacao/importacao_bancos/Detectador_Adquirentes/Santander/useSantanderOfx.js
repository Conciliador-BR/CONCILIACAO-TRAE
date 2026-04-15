export const useSantanderOfx = () => {
  const lerArquivoTexto = (arquivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('Erro ao ler arquivo OFX'))
      reader.readAsText(arquivo, 'UTF-8')
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
    const s = String(dtPosted || '')
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

    if (!dtPosted || !trnAmtRaw) return null

    const valorNumerico = normalizarValor(trnAmtRaw)
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
