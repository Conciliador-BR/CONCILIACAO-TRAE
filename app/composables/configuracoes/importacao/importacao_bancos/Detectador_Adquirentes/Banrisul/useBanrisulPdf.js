import { ref } from 'vue'

export const useBanrisulPdf = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null

    try {
      const linhas = await extrairLinhasPDF(arquivo)
      const transacoes = parseLinhasBanrisul(linhas)

      return {
        sucesso: true,
        transacoes,
        total: transacoes.length
      }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar PDF Banrisul'
      return {
        sucesso: false,
        erro: erro.value
      }
    } finally {
      processando.value = false
    }
  }

  const extrairLinhasPDF = async (file) => {
    const buffer = await file.arrayBuffer()
    await carregarScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js')

    const pdfjsLib = globalThis.pdfjsLib || globalThis.window?.pdfjsLib
    if (!pdfjsLib) throw new Error('Leitor de PDF indisponivel (pdf.js)')

    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js'
    }

    const loadingTask = pdfjsLib.getDocument({ data: buffer })
    const pdf = await loadingTask.promise
    const linhas = []

    for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
      const page = await pdf.getPage(pagina)
      const textContent = await page.getTextContent()
      const items = textContent.items.map((it) => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5]
      }))

      const grupos = agruparPorY(items)
      for (const grupo of grupos) {
        const ordenado = grupo.sort((a, b) => a.x - b.x)
        const texto = ordenado.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim()
        if (texto) linhas.push(texto)
      }
    }

    return linhas
  }

  const carregarScript = (src) => new Promise((resolve, reject) => {
    const existente = Array.from(document.querySelectorAll('script')).find((s) => s.src === src)
    if (existente) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Falha ao carregar script de PDF'))
    document.head.appendChild(script)
  })

  const agruparPorY = (items) => {
    const grupos = []
    const tolerancia = 2
    items.sort((a, b) => b.y - a.y)

    for (const item of items) {
      if (!String(item.str || '').trim()) continue

      let grupo = grupos.find((g) => Math.abs(g.y - item.y) <= tolerancia)
      if (!grupo) {
        grupo = { y: item.y, itens: [] }
        grupos.push(grupo)
      }

      grupo.itens.push(item)
    }

    return grupos.map((g) => g.itens)
  }

  const limparTexto = (texto) => String(texto || '')
    .replace(/[↑↓]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const normalizar = (texto) => limparTexto(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(valor || 0))

  const valorParaNumero = (valorPtBr) => {
    const textoOriginal = limparTexto(valorPtBr)
    if (!textoOriginal) return 0

    const negativo = textoOriginal.includes('-')
    const numero = parseFloat(
      textoOriginal
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '')
    ) || 0

    return negativo ? -Math.abs(numero) : numero
  }

  const montarData = (dia, mes, ano) => {
    if (!dia || !mes || !ano) return ''
    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`
  }

  const extrairMesAnoMovimento = (linha) => {
    const match = normalizar(linha).match(/MOVIMENTOS\s+([A-Z]{3})\/(\d{4})/)
    if (!match) return null

    const meses = {
      JAN: '01',
      FEV: '02',
      MAR: '03',
      ABR: '04',
      MAI: '05',
      JUN: '06',
      JUL: '07',
      AGO: '08',
      SET: '09',
      OUT: '10',
      NOV: '11',
      DEZ: '12'
    }

    return {
      mes: meses[match[1]] || '',
      ano: match[2]
    }
  }

  const ehLinhaIgnorada = (linha) => {
    const base = normalizar(linha)
    if (!base) return true

    return (
      base.includes('DIA HISTORICO') ||
      base.includes('MOVIMENTOS DA CONTA CORRENTE') ||
      /^BANRISUL\b/.test(base) ||
      /^AGENCIA:/.test(base) ||
      /^CONTA:/.test(base) ||
      /^NOME\.\.\.:/.test(base) ||
      /^IDENTIFICACAO:/.test(base) ||
      /^PREZADO CLIENTE:/.test(base) ||
      /^SALDO DISPONIVEL/.test(base) ||
      /^INVEST RESGATE/.test(base) ||
      /^CDB AUTOMATICO/.test(base) ||
      /^QUANTIDADE DE OPER\./.test(base) ||
      /^SALDO ATUAL/.test(base) ||
      /^POSICAO EM /.test(base) ||
      /^-+$/.test(base) ||
      /^\++$/.test(base)
    )
  }

  const parseLinhaTransacao = (linha, contexto) => {
    const texto = limparTexto(linha)
    if (!texto) return null

    const regex = /^(?:(\d{2})\s+)?(.+?)\s+(\d{6,}|0{6})\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/
    const match = texto.match(regex)
    if (!match) return null

    const dia = match[1] || contexto.diaAtual
    const descricao = limparTexto(match[2])
    const documento = limparTexto(match[3])
    const valorTexto = limparTexto(match[4])

    if (!dia || !contexto.mes || !contexto.ano) return null
    if (!descricao) return null
    if (/^SALDO\b/i.test(descricao)) return null

    const data = montarData(dia, contexto.mes, contexto.ano)
    const valorNumerico = valorParaNumero(valorTexto)

    return {
      id: documento || `BANRISUL-PDF-${contexto.indice + 1}`,
      data,
      descricao,
      documento,
      valor: formatarMoeda(valorNumerico),
      valorNumerico,
      banco: 'Banrisul',
      origem: 'PDF'
    }
  }

  const parseLinhasBanrisul = (linhas) => {
    if (!Array.isArray(linhas) || linhas.length === 0) return []

    const transacoes = []
    let dentroMovimentos = false
    let mesAtual = ''
    let anoAtual = ''
    let diaAtual = ''

    for (let i = 0; i < linhas.length; i++) {
      const linha = limparTexto(linhas[i])
      if (!linha) continue

      if (normalizar(linha).includes('MOVIMENTOS DA CONTA CORRENTE')) {
        dentroMovimentos = true
        continue
      }

      if (!dentroMovimentos) continue

      const mesAno = extrairMesAnoMovimento(linha)
      if (mesAno) {
        mesAtual = mesAno.mes
        anoAtual = mesAno.ano
        continue
      }

      if (ehLinhaIgnorada(linha)) continue

      const base = normalizar(linha)
      if (/^SALDO ANT EM \d{2}\/\d{2}\/\d{4}\s+[-]?\d{1,3}(?:\.\d{3})*,\d{2}$/.test(base)) {
        continue
      }
      if (/^SALDO NA DATA\s+[-]?\d{1,3}(?:\.\d{3})*,\d{2}$/.test(base)) {
        continue
      }

      const matchDia = linha.match(/^(\d{2})\s+/)
      if (matchDia) {
        diaAtual = matchDia[1]
      }

      const transacao = parseLinhaTransacao(linha, {
        mes: mesAtual,
        ano: anoAtual,
        diaAtual,
        indice: i
      })

      if (transacao) {
        if (matchDia) diaAtual = transacao.data.slice(0, 2)
        transacoes.push(transacao)
      }
    }

    return transacoes
  }

  return { processando, erro, processarPDF }
}
