import { ref } from 'vue'

export const useTribanco_OFX = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []

    try {
      const texto = await lerArquivoTexto(arquivo)
      const transacoesProcessadas = parseOFXTribanco(texto)
      transacoes.value = transacoesProcessadas
      
      return {
        sucesso: true,
        transacoes: transacoesProcessadas,
        total: transacoesProcessadas.length
      }
    } catch (error) {
      erro.value = error.message
      return {
        sucesso: false,
        erro: error.message
      }
    } finally {
      processando.value = false
    }
  }

  const lerArquivoTexto = (arquivo) => {
    return new Promise((resolve, reject) => {
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
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsArrayBuffer(arquivo)
    })
  }

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

  const parseOFXTribanco = (textoOFX) => {
    const transacoes = []
    
    try {
      // Regex para capturar blocos STMTTRN do Tribanco (sem tags de fechamento)
      const regexTransacao = /<STMTTRN>\s*([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/g
      let match
      
      while ((match = regexTransacao.exec(textoOFX)) !== null) {
        try {
          const transacao = parseTransacaoTribancoOFX(match[1], transacoes.length + 1)
          if (transacao) {
            transacoes.push(transacao)
          }
        } catch (error) {
          console.warn(`Erro ao processar transação ${transacoes.length + 1}:`, error)
        }
      }

      if (transacoes.length === 0) {
        throw new Error('Nenhuma transação encontrada no arquivo OFX do Tribanco')
      }

      return transacoes
    } catch (error) {
      throw new Error(`Erro ao processar OFX do Tribanco: ${error.message}`)
    }
  }

  const parseTransacaoTribancoOFX = (textoTransacao, indice) => {
    // Função para extrair campos do formato Tribanco (sem tags de fechamento)
    const extrairCampoTribanco = (campo) => {
      const regex = new RegExp(`<${campo}>([^<]*?)(?=\\s*<|$)`, 'i')
      const match = textoTransacao.match(regex)
      return match ? match[1].trim() : ''
    }

    const tipo = extrairCampoTribanco('TRNTYPE')
    const data = extrairCampoTribanco('DTPOSTED')
    const valor = extrairCampoTribanco('TRNAMT')
    const fitid = extrairCampoTribanco('FITID')
    const checknum = extrairCampoTribanco('CHECKNUM')
    const memo = extrairCampoTribanco('MEMO')
    
    // Formatação da data (20250801030000.000 -> 01/08/2025)
    let dataFormatada = ''
    if (data && data.length >= 8) {
      const ano = data.substring(0, 4)
      const mes = data.substring(4, 6)
      const dia = data.substring(6, 8)
      dataFormatada = `${dia}/${mes}/${ano}`
    }

    // Processamento do valor
    const valorNumerico = parseFloat(valor) || 0
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(valorNumerico))

    // Documento: usar FITID ou CHECKNUM como identificador
    const documento = fitid || checknum || `TRIBANCO-${indice}`
    
    // Descrição: usar MEMO ou criar descrição baseada no tipo
    let descricao = memo || 'Transação bancária'
    if (!memo) {
      descricao = tipo === 'CREDIT' ? 'Crédito' : 'Débito'
    }

    return {
      id: documento,
      data: dataFormatada,
      descricao: descricao,
      documento: documento,
      valor: valorFormatado,
      valorNumerico: valorNumerico,
      tipo: tipo,
      banco: 'Tribanco',
      origem: 'OFX'
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarOFX
  }
}
