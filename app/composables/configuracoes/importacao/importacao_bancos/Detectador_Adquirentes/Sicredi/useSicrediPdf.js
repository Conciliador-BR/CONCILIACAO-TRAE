import { ref } from 'vue'

export const useSicrediPdf = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const linhas = await extrairLinhasPDF(arquivo)
      const transacoes = parseLinhasSicredi(linhas)
      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar PDF Sicredi'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  const extrairLinhasPDF = async (file) => {
    const buffer = await file.arrayBuffer()
    await carregarScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js')
    const pdfjsLib = globalThis.pdfjsLib || globalThis.window?.pdfjsLib
    if (!pdfjsLib) throw new Error('Leitor de PDF indisponível (pdf.js)')

    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js'
    }

    const loadingTask = pdfjsLib.getDocument({ data: buffer })
    const pdf = await loadingTask.promise
    const linhas = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const itens = textContent.items.map(it => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5]
      }))
      const grupos = agruparPorY(itens)
      for (const grupo of grupos) {
        const ordenado = grupo.sort((a, b) => a.x - b.x)
        const texto = ordenado.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim()
        if (texto) linhas.push(texto)
      }
    }

    return linhas
  }

  const carregarScript = (src) => new Promise((resolve, reject) => {
    const existente = Array.from(document.querySelectorAll('script')).find(s => s.src === src)
    if (existente) {
      resolve(true)
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve(true)
    s.onerror = () => reject(new Error('Falha ao carregar script de PDF'))
    document.head.appendChild(s)
  })

  const agruparPorY = (items) => {
    const grupos = []
    const tolerancia = 2
    items.sort((a, b) => b.y - a.y)
    for (const it of items) {
      if (!String(it.str || '').trim()) continue
      let grupo = grupos.find(g => Math.abs(g.y - it.y) <= tolerancia)
      if (!grupo) {
        grupo = { y: it.y, itens: [] }
        grupos.push(grupo)
      }
      grupo.itens.push(it)
    }
    return grupos.map(g => g.itens)
  }

  const parseLinhasSicredi = (linhas) => {
    const transacoes = []
    const regexDataLinha = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(\S+)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i]

      if (/^Data\s+Descri/i.test(linha)) continue
      if (/^SALDO ANTERIOR/i.test(linha)) continue

      const m = linha.match(regexDataLinha)
      if (!m) continue

      const data = m[1]
      const descricao = m[2].trim()
      const documento = m[3].trim()
      const valorNumerico = valorParaNumero(m[4])

      transacoes.push({
        id: `SICREDI-PDF-${i + 1}`,
        data,
        descricao,
        documento,
        valor: formatarMoeda(valorNumerico),
        valorNumerico,
        banco: 'Sicredi',
        origem: 'PDF'
      })
    }

    return transacoes
  }

  const valorParaNumero = (valorPtBr) => {
    return parseFloat(String(valorPtBr).replace(/\./g, '').replace(',', '.')) || 0
  }

  const formatarMoeda = (n) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  return { processando, erro, processarPDF }
}
