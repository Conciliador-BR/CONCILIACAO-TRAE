import { ref } from 'vue'

export const useStoneOfx = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const texto = await lerArquivoTexto(arquivo)
      const transacoes = parseOFXStone(texto)
      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar OFX Stone'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  const lerArquivoTexto = (arquivo) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const buffer = reader.result
        if (!(buffer instanceof ArrayBuffer)) {
          throw new Error('Arquivo OFX inválido')
        }
        resolve(decodificarOFX(buffer))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo OFX'))
    reader.readAsArrayBuffer(arquivo)
  })

  const decodificarOFX = (buffer) => {
    const bytes = new Uint8Array(buffer)
    const headerPreview = new TextDecoder('latin1').decode(bytes.slice(0, 2048))
    const charset = extrairCharsetOFX(headerPreview)
    const encodings = obterEncodingsTentativa(charset)

    for (const encoding of encodings) {
      try {
        const texto = new TextDecoder(encoding, { fatal: false }).decode(bytes)
        if (!texto.includes('�')) return texto
      } catch {
        // Tenta o próximo encoding.
      }
    }

    return new TextDecoder('latin1').decode(bytes)
  }

  const extrairCharsetOFX = (header) => {
    const charsetMatch = header.match(/CHARSET:([^\r\n]+)/i)
    if (charsetMatch?.[1]) return charsetMatch[1].trim().toUpperCase()

    const encodingMatch = header.match(/ENCODING:([^\r\n]+)/i)
    if (encodingMatch?.[1]) return encodingMatch[1].trim().toUpperCase()

    return ''
  }

  const obterEncodingsTentativa = (charset) => {
    const mapa = {
      '1252': ['windows-1252', 'latin1', 'utf-8'],
      'CP1252': ['windows-1252', 'latin1', 'utf-8'],
      'WINDOWS-1252': ['windows-1252', 'latin1', 'utf-8'],
      'ISO-8859-1': ['latin1', 'windows-1252', 'utf-8'],
      'LATIN1': ['latin1', 'windows-1252', 'utf-8'],
      'USASCII': ['utf-8', 'latin1'],
      'UTF-8': ['utf-8', 'windows-1252', 'latin1'],
      'UNICODE': ['utf-8', 'windows-1252', 'latin1']
    }

    return mapa[charset] || ['windows-1252', 'latin1', 'utf-8']
  }

  const extrairCampo = (conteudo, tag) => {
    const regex = new RegExp(`<${tag}>\\s*([^<\\r\\n]*)`, 'i')
    const match = conteudo.match(regex)
    return match ? match[1].trim() : ''
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

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const parseOFXStone = (conteudo) => {
    const transacoes = []
    const regexTransacao = /<STMTTRN>\s*([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi
    let match
    let idx = 1
    while ((match = regexTransacao.exec(conteudo)) !== null) {
      const bloco = match[1]
      const dtPosted = extrairCampo(bloco, 'DTPOSTED')
      const trnAmtRaw = extrairCampo(bloco, 'TRNAMT')
      const fitId = extrairCampo(bloco, 'FITID')
      const memo = extrairCampo(bloco, 'MEMO')
      const trnType = extrairCampo(bloco, 'TRNTYPE')
      if (!dtPosted || !trnAmtRaw) {
        idx += 1
        continue
      }

      let valorNumerico = normalizarValor(trnAmtRaw)
      if (String(trnType || '').toUpperCase() === 'DEBIT') {
        valorNumerico = -Math.abs(valorNumerico)
      }

      transacoes.push({
        id: fitId || `STONE-OFX-${idx}`,
        data: formatarData(dtPosted),
        descricao: memo || 'Transação Stone',
        documento: fitId || '',
        valor: formatarMoeda(valorNumerico),
        valorNumerico,
        banco: 'Stone',
        origem: 'OFX'
      })
      idx += 1
    }
    return transacoes
  }

  return { processando, erro, processarOFX }
}
