import { ref } from 'vue'

export const useSafraTxt = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarTXT = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const texto = await lerArquivoTexto(arquivo)
      const linhasRaw = texto.split(/\r?\n/)
      const transacoes = parseLinhasSafraTxt(linhasRaw)
      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar TXT'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  const lerArquivoTexto = (arquivo) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsText(arquivo, 'UTF-8')
  })

  const parseLinhasSafraTxt = (linhasRaw) => {
    const linhas = linhasRaw.map(l => l.replace(/\s+$/,'')).filter(l => l && !/^\s*$/.test(l))
    const headerIdx = linhas.findIndex(l => /\bData\b/.test(l) && /NrDocumento/i.test(l) && /Valor/i.test(l))
    if (headerIdx === -1) { return [] }
    const header = linhas[headerIdx]
    const idxData = header.indexOf('Data')
    const idxLanc = header.search(/L[aã]n[cç]amento/i)
    const idxCompl = header.indexOf('Complemento')
    const idxDoc = header.indexOf('NrDocumento')
    const idxTipo = header.search(/TipoL[aã]n[cç]amento/i)
    const idxValor = header.indexOf('Valor')
    const inicioDados = headerIdx + 2 // pula a linha dos traços

    const transacoes = []
    let seq = 0
    for (let i = inicioDados; i < linhas.length; i++) {
      const l = linhas[i]
      if (!l || l.trim().length === 0) continue
      const dataRaw = (idxLanc > idxData) ? l.slice(idxData, idxLanc).trim() : ''
      const lancRaw = (idxCompl > idxLanc) ? l.slice(idxLanc, idxCompl).trim() : ''
      const complRaw = (idxDoc > idxCompl) ? l.slice(idxCompl, idxDoc).trim() : ''
      const docRaw = (idxTipo > idxDoc ? l.slice(idxDoc, idxTipo) : l.slice(idxDoc, idxValor)).trim()
      const valorRaw = l.slice(idxValor).trim()

      const data = normalizarDataSafra(dataRaw)
      const descricao = [lancRaw, complRaw].filter(Boolean).join(' / ')
      const documento = docRaw || ''
      const { numero, negativo } = extrairNumeroMoeda(valorRaw)
      const valorNumerico = negativo ? -Math.abs(numero) : numero
      const valor = formatarMoeda(valorNumerico)

      if (!data || !descricao) continue
      seq++
      transacoes.push({
        id: `SAFRA-TXT-${seq}`,
        data,
        descricao,
        documento,
        valor,
        valorNumerico,
        banco: 'Safra',
        origem: 'TXT'
      })
    }
    return transacoes
  }

  const normalizarDataSafra = (s) => {
    const t = String(s || '').trim()
    if (!t) return ''
    if (/\d{2}\/\d{2}\/\d{4}/.test(t)) return t
    const digits = t.replace(/\D/g,'')
    if (digits.length === 8) {
      const dd = digits.slice(0,2)
      const mm = digits.slice(2,4)
      const yyyy = digits.slice(4,8)
      return `${dd}/${mm}/${yyyy}`
    }
    return t
  }

  const extrairNumeroMoeda = (s) => {
    const str = String(s || '')
    const negativo = /-/.test(str)
    const m = str.match(/\d{1,3}(?:\.\d{3})*,\d{2}/)
    const valorStr = m ? m[0] : '0,00'
    const numero = valorParaNumero(valorStr)
    return { numero, negativo }
  }

  const valorParaNumero = (v) => {
    const s = String(v).replace(/\./g, '').replace(',', '.')
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : 0
  }

  const formatarMoeda = (n) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  return { processando, erro, processarTXT }
}
