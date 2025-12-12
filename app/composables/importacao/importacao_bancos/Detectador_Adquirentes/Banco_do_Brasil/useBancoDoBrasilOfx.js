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
    r.onload = (e) => resolve(e.target.result)
    r.onerror = () => reject(new Error('Erro ao ler arquivo'))
    r.readAsText(arquivo, 'UTF-8')
  })

  const parseOFXPadrao = (conteudo) => {
    const re = /<STMTTRN>(.*?)<\/STMTTRN>/gs
    return [...conteudo.matchAll(re)].map(m => parseTransacao(m[1], Date.now())).filter(Boolean)
  }

  const parseTransacao = (texto, indiceBase) => {
    const extrair = (campo) => {
      const re = new RegExp(`<${campo}>(.*?)<\/${campo}>`, 'i')
      const m = texto.match(re)
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
