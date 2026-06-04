import { ref } from 'vue'

export const useBancoDoBrasilOfx = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const texto = await lerArquivoTexto(arquivo)
      const transacoes = parseOFXPadrao(texto)
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

    // O cabeçalho do OFX é ASCII; usamos latin1 para conseguir ler CHARSET/ENCODING sem perder bytes.
    const headerPreview = new TextDecoder('latin1').decode(bytes.slice(0, 2048))
    const charset = extrairCharsetOFX(headerPreview)
    const encodings = obterEncodingsTentativa(charset)

    for (const encoding of encodings) {
      try {
        const texto = new TextDecoder(encoding, { fatal: false }).decode(bytes)
        if (!texto.includes('�')) return texto
      } catch {
        // Ignora encoding inválido e tenta o próximo.
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

  const parseOFXPadrao = (conteudo) => {
    const re = /<STMTTRN>(.*?)<\/STMTTRN>/gs
    return [...conteudo.matchAll(re)].map(m => parseTransacao(m[1], Date.now())).filter(Boolean)
  }

  const parseTransacao = (texto, indiceBase) => {
    const extrair = (campo) => {
      // Tenta primeiro encontrar com tag de fechamento
      let re = new RegExp(`<${campo}>(.*?)<\/${campo}>`, 'i')
      let m = texto.match(re)
      if (m) return m[1].trim()
      
      // Se não encontrar, tenta encontrar sem tag de fechamento (até a próxima tag ou fim da string)
      // A regex procura <CAMPO> seguido de qualquer coisa que não seja <
      re = new RegExp(`<${campo}>([^<]*)`, 'i')
      m = texto.match(re)
      return m ? m[1].trim() : ''
    }
    const data = extrair('DTPOSTED')
    const valor = extrair('TRNAMT')
    const descricao = extrair('MEMO') || extrair('NAME') || 'Sem descrição'
    const documento = extrair('FITID') || extrair('REFNUM') || `BB-${indiceBase}`
    if (!data || !valor) return null
    const dataFormatada = data.length >= 8 ? `${data.substring(6,8)}/${data.substring(4,6)}/${data.substring(0,4)}` : data
    const valorNumerico = parseFloat(valor) || 0
    const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico)
    return {
      id: documento,
      data: dataFormatada,
      descricao,
      documento,
      valor: valorFormatado,
      valorNumerico,
      banco: 'Banco do Brasil'
    }
  }

  return { processando, erro, processarOFX }
}
