import { ref } from 'vue'

export const useSicoobPdf = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const linhas = await extrairLinhasPDF(arquivo)
      const transacoes = parseLinhasSicoob(linhas)
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
    try {
      await carregarScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js')
      pdfjsLib = globalThis.pdfjsLib || globalThis.window?.pdfjsLib
    } catch (e) {
      throw new Error('Leitor de PDF indisponível (pdf.js)')
    }
    if (!pdfjsLib) { throw new Error('pdfjsLib não carregado') }
    try {
      if (pdfjsLib.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js'
      }
    } catch (_) {}
    const loadingTask = pdfjsLib.getDocument({ data: buffer })
    const pdf = await loadingTask.promise
    const linhas = []
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const items = textContent.items.map(it => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))
      const grupos = agruparPorY(items)
      for (const grupo of grupos) {
        const ordenado = grupo.sort((a, b) => a.x - b.x)
        const texto = ordenado.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim()
        if (texto) { linhas.push(texto) }
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
    const tolerancia = 2
    items.sort((a, b) => b.y - a.y)
    for (const it of items) {
      let grupo = grupos.find(g => Math.abs(g.y - it.y) <= tolerancia)
      if (!grupo) { grupo = { y: it.y, itens: [] }; grupos.push(grupo) }
      grupo.itens.push(it)
    }
    return grupos.map(g => g.itens)
  }

  const parseLinhasSicoob = (linhas) => {
    const transacoes = []
    let anoExtrato = obterAnoExtrato(linhas)
    let atual = null
    const dataRegex = /^(\d{2}\/\d{2})\b/i
    for (let idx = 0; idx < linhas.length; idx++) {
      const linha = linhas[idx]
      const dataMatch = linha.match(dataRegex)
      if (dataMatch) {
        if (atual) { finalizarTransacao(atual, transacoes) }
        const dataDDMM = dataMatch[1]
        const valorMatch = linha.match(/(\d{1,3}(?:\.\d{3})*,\d{2})([CD\*]?)/)
        const descricaoPrimaria = linha
          .replace(dataRegex, '')
          .replace(/\s+/g, ' ')
          .trim()
        const valorStr = valorMatch ? valorMatch[1] + (valorMatch[2] || '') : ''
        const valorNumerico = valorStr ? valorParaNumero(valorStr) : 0
        const dataCompleta = anoExtrato ? `${dataDDMM}/${anoExtrato}` : dataDDMM
        atual = {
          id: `SC-${idx + 1}`,
          data: dataCompleta,
          descricaoPrimaria,
          documento: '',
          subtitulo: '',
          detalhe: '',
          adquirente: identificarAdquirente(descricaoPrimaria),
          valorNumerico,
          valor: formatarMoeda(valorNumerico),
          banco: 'Sicoob'
        }
        continue
      }
      if (!atual) { continue }
      if (/^DOC\.?:/i.test(linha)) {
        const docMatch = linha.match(/DOC\.?\s*(\S+)/i)
        atual.documento = docMatch ? docMatch[1] : atual.documento
        continue
      }
      if (!atual.subtitulo && /Recebimento\s+Pix/i.test(linha)) {
        atual.subtitulo = 'Recebimento Pix'
      }
      const nomeAdq = identificarAdquirente(linha)
      if (nomeAdq) { atual.adquirente = nomeAdq }
      if (!/^(\d{2}\/\d{2})\b/i.test(linha)) {
        if (!/^DOC\.?/i.test(linha)) {
          if (atual.detalhe) { atual.detalhe += ' ' + linha }
          else { atual.detalhe = linha }
        }
      }
    }
    if (atual) { finalizarTransacao(atual, transacoes) }
    return transacoes
  }

  const obterAnoExtrato = (linhas) => {
    for (const l of linhas) {
      const m = l.match(/PER[IÍ]ODO:\s*\d{2}\/\d{2}\/(\d{4}).*?-.*?(\d{2}\/\d{2}\/\d{4})/i)
      if (m) { return m[1] }
    }
    return ''
  }

  const finalizarTransacao = (t, lista) => {
    const desc = t.subtitulo ? `${t.descricaoPrimaria} — ${t.subtitulo}` : t.descricaoPrimaria
    const detalhe = t.detalhe || ''
    const adquirente = t.adquirente || identificarAdquirente(`${t.descricaoPrimaria} ${detalhe}`) || ''
    lista.push({
      id: t.id,
      data: t.data,
      descricao: desc + (detalhe ? ` | ${detalhe}` : ''),
      documento: t.documento,
      valor: t.valor,
      valorNumerico: t.valorNumerico,
      banco: 'Sicoob',
      adquirente
    })
  }

  const valorParaNumero = (v) => {
    const c = /[CD\*]$/.test(v) ? v.slice(-1) : ''
    const num = v.replace(/[CD\*]$/, '').replace(/\./g, '').replace(',', '.')
    const n = parseFloat(num) || 0
    if (c === 'D') { return -Math.abs(n) }
    return Math.abs(n)
  }

  const identificarAdquirente = (texto) => {
    const s = (texto || '').toUpperCase()
    const candidatos = ['ALELO', 'SIPAG', 'STONE', 'CIELO', 'REDE', 'GETNET', 'SAFRAPAY', 'MERCADOPAGO', 'PAGSEGURO', 'UNICA', 'BIN']
    for (const c of candidatos) { if (s.includes(c)) return c }
    if (s.includes('CR CPS VS ELECTRON')) return 'SIPAG'
    return ''
  }

  const formatarMoeda = (n) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  return { processando, erro, processarPDF }
}
