import { ref } from 'vue'
import { useSicoobPdf } from './Detectador_Adquirentes/Sicoob/useSicoobPdf'
import { useSicoobXlsx } from './Detectador_Adquirentes/Sicoob/useSicoobXlsx'

export const useSicoob = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])
  const { processarPDF } = useSicoobPdf()
  const { processarXLSX } = useSicoobXlsx()

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []

    try {
      const texto = await lerArquivoTexto(arquivo)
      const transacoesProcessadas = parseOFXSicoob(texto)
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
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsText(arquivo, 'UTF-8')
    })
  }

  const parseOFXSicoob = (textoOFX) => {
    const transacoes = []
    
    try {
      const regexTransacao = /<STMTTRN>(.*?)<\/STMTTRN>/gs
      const matches = textoOFX.match(regexTransacao)
      
      if (!matches) {
        throw new Error('Nenhuma transação encontrada no arquivo OFX')
      }

      matches.forEach((match, index) => {
        try {
          const transacao = parseTransacaoOFX(match, index + 1)
          if (transacao) {
            transacoes.push(transacao)
          }
        } catch (error) {
          console.warn(`Erro ao processar transação ${index + 1}:`, error)
        }
      })

      return transacoes
    } catch (error) {
      throw new Error(`Erro ao processar OFX do Sicoob: ${error.message}`)
    }
  }

  const parseTransacaoOFX = (textoTransacao, indice) => {
    const extrairCampo = (campo) => {
      const regexFechado = new RegExp(`<${campo}>\\s*([^<\\r\\n]*)\\s*</${campo}>`, 'i')
      const regexAberto = new RegExp(`<${campo}>\\s*([^<\\r\\n]*)`, 'i')
      let m = textoTransacao.match(regexFechado)
      if (!m) { m = textoTransacao.match(regexAberto) }
      return m ? m[1].trim() : ''
    }

    const limpar = (s) => String(s || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()

    const data = extrairCampo('DTPOSTED')
    const valor = extrairCampo('TRNAMT')
    const nameRaw = extrairCampo('NAME')
    const memoRaw = extrairCampo('MEMO')
    const documento = extrairCampo('FITID') || extrairCampo('REFNUM') || `SICOOB-${indice}`

    let dataFormatada = ''
    if (data && data.length >= 8) {
      const ano = data.substring(0, 4)
      const mes = data.substring(4, 6)
      const dia = data.substring(6, 8)
      dataFormatada = `${dia}/${mes}/${ano}`
    }

    const valorNumerico = parseFloat(valor) || 0
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorNumerico)

    const titulo = limpar(nameRaw) || ''
    const memoLinhas = (memoRaw || '')
      .split(/\r?\n+/)
      .map(l => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean)

    const conteudoParaPix = [titulo, ...memoLinhas].join(' ')
    const temPix = /RECEBIMENTO\s+PIX|\bPIX\b/i.test(conteudoParaPix)

    const descricaoPartes = []
    if (titulo) {
      descricaoPartes.push(temPix ? `${titulo} — Recebimento Pix` : titulo)
    } else if (memoLinhas.length > 0) {
      const primeiro = memoLinhas.shift()
      descricaoPartes.push(temPix ? `${primeiro} — Recebimento Pix` : primeiro)
    }

    for (const l of memoLinhas) {
      if (!descricaoPartes.includes(l)) { descricaoPartes.push(l) }
    }

    const descricaoFinal = descricaoPartes.join(' / ')

    return {
      id: documento,
      data: dataFormatada,
      descricao: descricaoFinal || (limpar(memoRaw) || 'Sem descrição'),
      documento: documento,
      valor: valorFormatado,
      valorNumerico: valorNumerico,
      banco: 'Sicoob'
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarOFX,
    processarPDF,
    processarXLSX
  }
}
