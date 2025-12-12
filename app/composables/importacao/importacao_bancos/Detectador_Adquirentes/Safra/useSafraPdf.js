import { ref } from 'vue'

export const useSafraPdf = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const linhas = await extrairLinhasPDF(arquivo)
      const transacoes = parseLinhas(linhas)
      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar PDF'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  const extrairLinhasPDF = async (file) => {
    const buffer = await file.arrayBuffer()
    let pdfjsLib
    await carregarScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js')
    pdfjsLib = globalThis.pdfjsLib || globalThis.window?.pdfjsLib
    if (pdfjsLib?.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js'
    }
    const loadingTask = pdfjsLib.getDocument({ data: buffer })
    const pdf = await loadingTask.promise
    const linhas = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const items = textContent.items.map(it => ({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width }))
      const grupos = agruparPorY(items)
      grupos.sort((a, b) => b.y - a.y)
      for (const g of grupos) {
        const ordenado = g.itens.sort((a, b) => a.x - b.x)
        let texto = ''
        if (ordenado.length) {
          texto = ordenado[0].str
          for (let k = 1; k < ordenado.length; k++) {
            const prev = ordenado[k-1]
            const curr = ordenado[k]
            const gap = curr.x - (prev.x + (prev.w || 0))
            texto += gap > 10 ? ' / ' + curr.str : ' ' + curr.str
          }
        }
        texto = texto.replace(/\s+/g, ' ').trim()
        if (texto) linhas.push(texto)
      }
    }
    return linhas
  }

  const carregarScript = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve(true)
    s.onerror = () => reject(new Error('Falha ao carregar script'))
    document.head.appendChild(s)
  })

  const agruparPorY = (items) => {
    const grupos = []
    const tolerancia = 6
    for (const it of items) {
      if (!it.str.trim()) continue
      let grupo = grupos.find(g => Math.abs(g.y - it.y) <= tolerancia)
      if (!grupo) { grupo = { y: it.y, itens: [] }; grupos.push(grupo) }
      grupo.itens.push(it)
    }
    return grupos
  }

  const parseLinhas = (linhas) => {
    const transacoes = []
    let idx = 0
    const anoPadrao = obterAnoExtratoSafra(linhas)
    const dataRegex = /^(\d{2}\/\d{2})(?:\/(\d{4}))?\b/
    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i]
      const dm = l.match(dataRegex)
      if (!dm) continue
      const ddmm = dm[1]
      const yyyy = dm[2] || anoPadrao
      const data = yyyy ? `${ddmm}/${yyyy}` : ddmm
      const parts = l.split(' / ').map(s => s.trim()).filter(Boolean)
      // Esperado: [Data, Lançamento, Complemento, Nº Documento, Valor]
      let lancamento = ''
      let complemento = ''
      let documento = ''
      let valorSegment = ''
      if (parts.length >= 5) {
        lancamento = parts[1]
        complemento = parts[2]
        documento = parts[3]
        valorSegment = parts[4]
      } else {
        lancamento = parts[1] || ''
        complemento = parts[2] || ''
        documento = parts[3] || ''
        valorSegment = parts.at(-1) || ''
        if (!complemento && i + 1 < linhas.length && !linhas[i+1].match(dataRegex)) {
          complemento = linhas[i+1].trim()
        }
      }
      const valorStr = extrairValor(valorSegment)
      let valorNum = aplicarSinal(valorSegment, valorParaNumero(valorStr))
      const descricao = [lancamento, complemento].filter(Boolean).join(' / ')
      if (!descricao) continue
      idx++
      transacoes.push({
        id: `SAFRA-PDF-${idx}`,
        data,
        descricao,
        documento,
        valor: formatarMoeda(valorNum),
        valorNumerico: valorNum,
        banco: 'Safra',
        origem: 'PDF'
      })
    }
    return transacoes
  }

  const obterAnoExtratoSafra = (linhas) => {
    for (const l of linhas) {
      const m = l.match(/\b(\d{2}\/\d{2}\/)(\d{4})\b/)
      if (m) return m[2]
    }
    return new Date().getFullYear().toString()
  }

  const extrairValor = (s) => {
    const str = String(s || '')
    const m = str.match(/\d{1,3}(?:\.\d{3})*,\d{2}/)
    return m ? m[0] : '0,00'
  }

  const aplicarSinal = (segmentoValor, numero) => {
    return /-/.test(String(segmentoValor || '')) ? -Math.abs(numero) : numero
  }

  const valorParaNumero = (v) => {
    const num = v.replace(/\./g, '').replace(',', '.')
    return parseFloat(num) || 0
  }

  const formatarMoeda = (n) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  return { processando, erro, processarPDF }
}
