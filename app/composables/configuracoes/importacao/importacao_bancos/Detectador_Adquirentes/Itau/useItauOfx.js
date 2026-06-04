import { ref } from 'vue'

export const useItauOfx = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const texto = await lerArquivoTexto(arquivo)
      const transacoes = parseOFXItau(texto)
      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar OFX'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  const lerArquivoTexto = (arquivo) => new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      try {
        const buffer = r.result
        if (!(buffer instanceof ArrayBuffer)) {
          throw new Error('Arquivo OFX inválido')
        }
        resolve(decodificarOFX(buffer))
      } catch (error) {
        reject(error)
      }
    }
    r.onerror = () => reject(new Error('Erro ao ler arquivo'))
    r.readAsArrayBuffer(arquivo)
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

  const parseOFXItau = (textoOFX) => {
    // Print 3 mostra tags padrão: <STMTTRN>, <TRNTYPE>, <DTPOSTED>, <TRNAMT>, <FITID>, <CHECKNUM>, <MEMO>
    // Algumas tags podem não ter fechamento dependendo da versão, mas no print parecem ter.
    // O <MEMO> contém info concatenada.
    
    const transacoes = []
    const re = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g
    let match
    
    while ((match = re.exec(textoOFX)) !== null) {
      const t = parseTransacao(match[1])
      if (t) transacoes.push(t)
    }
    
    return transacoes
  }

  const parseTransacao = (texto) => {
    const extrair = (campo) => {
      let re = new RegExp(`<${campo}>([^<]*)`, 'i') // Tenta pegar até o próximo <
      let m = texto.match(re)
      return m ? m[1].trim() : ''
    }
    
    const data = extrair('DTPOSTED')
    const valor = extrair('TRNAMT')
    const memo = extrair('MEMO')
    const fitId = extrair('FITID')
    const checkNum = extrair('CHECKNUM')
    
    if (!data || !valor) return null
    
    // Formatar data YYYYMMDD -> DD/MM/YYYY
    // Ex: 20251103 -> 03/11/2025
    let dataFormatada = data
    if (data.length >= 8) {
      dataFormatada = `${data.substring(6,8)}/${data.substring(4,6)}/${data.substring(0,4)}`
    }
    
    const valorNumerico = parseFloat(valor.replace(',', '.')) || 0
    
    const adquirente = identificarAdquirente(memo)
    
    return {
      id: fitId || checkNum || `ITAU-OFX-${Math.random()}`,
      data: dataFormatada,
      descricao: memo,
      documento: checkNum || fitId || '',
      valor: formatarMoeda(valorNumerico),
      valorNumerico,
      banco: 'Itaú',
      adquirente
    }
  }

  const identificarAdquirente = (texto) => {
    const s = (texto || '').toUpperCase()
    const candidatos = ['ALELO', 'SIPAG', 'STONE', 'CIELO', 'REDE', 'GETNET', 'SAFRAPAY', 'MERCADOPAGO', 'PAGSEGURO', 'UNICA', 'BIN', 'TICKET', 'PLUXEE', 'VR BENEFICIOS']
    for (const c of candidatos) { if (s.includes(c)) return c }
    return ''
  }

  const formatarMoeda = (n) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  return { processando, erro, processarOFX }
}
