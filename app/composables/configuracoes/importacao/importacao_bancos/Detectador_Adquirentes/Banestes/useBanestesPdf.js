import { ref } from 'vue'

export const useBanestesPdf = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const linhas = await extrairLinhasPDF(arquivo)
      let transacoes = parseLinhasBanestes(linhas)
      if (!transacoes.length) {
        const linhasOcr = await extrairLinhasPDFViaOCR(arquivo)
        transacoes = parseLinhasBanestes(linhasOcr)
      }
      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar PDF Banestes'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  const extrairLinhasPDF = async (file) => {
    const buffer = await file.arrayBuffer()
    const pdfjsLib = await carregarPdfJs()

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

  const extrairLinhasPDFViaOCR = async (file) => {
    const buffer = await file.arrayBuffer()
    const pdfjsLib = await carregarPdfJs()
    const Tesseract = await carregarTesseract()

    const loadingTask = pdfjsLib.getDocument({ data: buffer })
    const pdf = await loadingTask.promise
    const linhas = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 2 })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) continue

      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)

      await page.render({ canvasContext: context, viewport }).promise
      prepararCanvasParaOCR(canvas, context)

      const resultado = await Tesseract.recognize(canvas, 'por', {
        logger: () => {}
      })

      const texto = String(resultado?.data?.text || '')
      const linhasPagina = texto
        .split(/\r?\n/)
        .map((linha) => limparTextoOCR(linha))
        .filter(Boolean)

      linhas.push(...linhasPagina)
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

  const carregarPdfJs = async () => {
    await carregarScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js')
    const pdfjsLib = globalThis.pdfjsLib || globalThis.window?.pdfjsLib
    if (!pdfjsLib) throw new Error('Leitor de PDF indisponível (pdf.js)')

    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js'
    }

    return pdfjsLib
  }

  const carregarTesseract = async () => {
    await carregarScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js')
    const Tesseract = globalThis.Tesseract || globalThis.window?.Tesseract
    if (!Tesseract?.recognize) throw new Error('Leitor OCR indisponível (Tesseract)')
    return Tesseract
  }

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

  const parseLinhasBanestes = (linhas) => {
    const transacoes = []
    let dataContexto = ''
    let diaPendente = ''
    let ultimaTransacao = null
    const periodoPadrao = extrairPeriodoPadrao(linhas)

    for (let i = 0; i < linhas.length; i++) {
      const linhaOriginal = linhas[i]
      const linha = limparTexto(linhaOriginal)
      if (!linha) continue

      if (/^Data\s+Lancamento/i.test(linha) || /^Saldo\s+Total/i.test(linha) || /^Extrato de Conta Corrente/i.test(linha)) {
        continue
      }
      if (/^Saldo\s+Anterior/i.test(linha) || /^Saldo\s+Conta\/Rende\+/i.test(linha)) {
        continue
      }

      const dataNoInicioComResto = linha.match(/^(\d{2})\s+([A-Z]{3}\/\d{2})(?:\s+|$)(.*)$/i)
      let linhaTrabalho = linha
      if (dataNoInicioComResto) {
        dataContexto = montarData(dataNoInicioComResto[1], dataNoInicioComResto[2])
        linhaTrabalho = String(dataNoInicioComResto[3] || '').trim()
      }

      const diaMesAno = linha.match(/^(\d{2})\s+([A-Z]{3}\/\d{2})$/i)
      if (diaMesAno) {
        dataContexto = montarData(diaMesAno[1], diaMesAno[2])
        continue
      }

      const apenasDia = linha.match(/^(\d{2})$/)
      if (apenasDia) {
        diaPendente = apenasDia[1]
        continue
      }

      const mesAno = linha.match(/^([A-Z]{3}\/\d{2})$/i)
      if (mesAno && diaPendente) {
        dataContexto = montarData(diaPendente, mesAno[1])
        diaPendente = ''
        continue
      }

      const diaComValor = linha.match(/^(\d{2})\s+(.+?)\s+([+-]?\s?\d{1,3}(?:\.\d{3})*,\d{2})\s*[^\d,.-]*$/)
      if (diaComValor) {
        const data = montarDataComContexto(diaComValor[1], dataContexto, periodoPadrao)
        const descricao = limparDescricao(diaComValor[2])
        if (data && descricao && !/^(TOTAL|ENTRADAS|SAIDAS|AGENCIA|CLIENTE|CONTA|PERIODO|EXTRATO)/i.test(descricao)) {
          const valorNumerico = valorParaNumero(diaComValor[3])
          const nova = criarTransacao(i, data, descricao, valorNumerico)
          transacoes.push(nova)
          ultimaTransacao = nova
          dataContexto = data
          diaPendente = ''
          continue
        }
      }

      if (diaPendente && periodoPadrao) {
        const pendenteComValor = linha.match(/^(.+?)\s+([+-]?\s?\d{1,3}(?:\.\d{3})*,\d{2})\s*[^\d,.-]*$/)
        if (pendenteComValor) {
          const data = montarDataComContexto(diaPendente, dataContexto, periodoPadrao)
          const descricao = limparDescricao(pendenteComValor[1])
          if (data && descricao && !/^(TOTAL|ENTRADAS|SAIDAS|AGENCIA|CLIENTE|CONTA|PERIODO|EXTRATO)/i.test(descricao)) {
            const valorNumerico = valorParaNumero(pendenteComValor[2])
            const nova = criarTransacao(i, data, descricao, valorNumerico)
            transacoes.push(nova)
            ultimaTransacao = nova
            dataContexto = data
            diaPendente = ''
            continue
          }
        }
      }

      const comDataCompleta = linha.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/)
      if (comDataCompleta) {
        const data = comDataCompleta[1]
        const descricao = limparDescricao(comDataCompleta[2])
        const valorNumerico = valorParaNumero(comDataCompleta[3])
        const nova = criarTransacao(i, data, descricao, valorNumerico)
        transacoes.push(nova)
        ultimaTransacao = nova
        continue
      }

      const valorNoFim = linhaTrabalho.match(/^(.+?)\s+([+-]?\s?\d{1,3}(?:\.\d{3})*,\d{2})\s*[^\d,.-]*$/)
      if (valorNoFim && dataContexto) {
        const descricao = limparDescricao(valorNoFim[1])
        if (!descricao || /^(TOTAL|ENTRADAS|SAIDAS|AGENCIA|CLIENTE|CONTA|PERIODO|EXTRATO)/i.test(descricao)) continue
        const valorNumerico = valorParaNumero(valorNoFim[2])
        const nova = criarTransacao(i, dataContexto, descricao, valorNumerico)
        transacoes.push(nova)
        ultimaTransacao = nova
        continue
      }

      // Em alguns PDFs do Banestes a descrição vem quebrada em 2 linhas sem valor na linha complementar.
      if (ultimaTransacao && dataContexto && linhaTrabalho && !/[R$]/i.test(linhaTrabalho) && !/^\d{2}$/.test(linhaTrabalho)) {
        const complemento = limparDescricao(linhaTrabalho)
        if (complemento && !/^(Saldo|Data|Lancamento|Valor)/i.test(complemento)) {
          if (pareceDocumento(complemento)) {
            ultimaTransacao.documento = `${ultimaTransacao.documento || ''} ${complemento}`.replace(/\s+/g, ' ').trim()
          } else {
            ultimaTransacao.descricao = `${ultimaTransacao.descricao} ${complemento}`.replace(/\s+/g, ' ').trim()
          }
        }
      }
    }

    if (transacoes.length > 0) return transacoes
    return parseFallbackBanestes(linhas)
  }

  const parseFallbackBanestes = (linhas) => {
    const transacoes = []
    let dataContexto = ''
    let diaPendente = ''
    const periodoPadrao = extrairPeriodoPadrao(linhas)

    for (let i = 0; i < linhas.length; i++) {
      let linha = limparTexto(linhas[i])
      if (!linha) continue
      if (/^(Data|Lancamento|Valor|Extrato|Saldo|Agencia|Cliente|Conta|Periodo)/i.test(linha)) continue

      const dataNoInicio = linha.match(/^(\d{2})\s+([A-Z]{3}\/\d{2})(?:\s+|$)(.*)$/i)
      if (dataNoInicio) {
        dataContexto = montarData(dataNoInicio[1], dataNoInicio[2])
        linha = String(dataNoInicio[3] || '').trim()
      }

      const apenasDia = linha.match(/^(\d{2})$/)
      if (apenasDia) {
        diaPendente = apenasDia[1]
        continue
      }

      const mesAno = linha.match(/^([A-Z]{3}\/\d{2})$/i)
      if (mesAno && diaPendente) {
        dataContexto = montarData(diaPendente, mesAno[1])
        diaPendente = ''
        continue
      }

      const diaComValor = linha.match(/^(\d{2})\s+(.+?)\s+([+-]?\s?\d{1,3}(?:\.\d{3})*,\d{2})\s*[^\d,.-]*$/)
      if (diaComValor) {
        const data = montarDataComContexto(diaComValor[1], dataContexto, periodoPadrao)
        const descricao = limparDescricao(diaComValor[2])
        if (data && descricao && !/^(Saldo|Data|Lancamento|Valor|Extrato)/i.test(descricao)) {
          const valorNumerico = valorParaNumero(diaComValor[3])
          transacoes.push(criarTransacao(i, data, descricao, valorNumerico))
          dataContexto = data
          diaPendente = ''
          continue
        }
      }

      if (!dataContexto) continue

      const valorNoFim = linha.match(/([+-]?\s?\d{1,3}(?:\.\d{3})*,\d{2})\s*[^\d,.-]*$/)
      if (!valorNoFim) continue

      const valorTexto = valorNoFim[1]
      let descricao = linha.slice(0, linha.lastIndexOf(valorTexto)).trim()
      descricao = limparDescricao(descricao)
      if (!descricao || /^(Saldo|Data|Lancamento|Valor|Extrato)/i.test(descricao)) continue

      const valorNumerico = valorParaNumero(valorTexto)
      transacoes.push(criarTransacao(i, dataContexto, descricao, valorNumerico))
    }

    return transacoes
  }

  const limparTexto = (texto) => {
    return String(texto || '')
      .replace(/[↑↓]/g, ' ')
      .replace(/[□■▪▫◻◼]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const limparTextoOCR = (texto) => {
    return String(texto || '')
      .replace(/[|]/g, ' ')
      .replace(/[—–_]{2,}/g, ' ')
      .replace(/\bJUN26\b/gi, 'JUN/26')
      .replace(/\bJUL26\b/gi, 'JUL/26')
      .replace(/\bAGO26\b/gi, 'AGO/26')
      .replace(/\bSET26\b/gi, 'SET/26')
      .replace(/\bOUT26\b/gi, 'OUT/26')
      .replace(/\bNOV26\b/gi, 'NOV/26')
      .replace(/\bDEZ26\b/gi, 'DEZ/26')
      .replace(/\bJAN26\b/gi, 'JAN/26')
      .replace(/\bFEV26\b/gi, 'FEV/26')
      .replace(/\bMAR26\b/gi, 'MAR/26')
      .replace(/\bABR26\b/gi, 'ABR/26')
      .replace(/\bMAI26\b/gi, 'MAI/26')
      .replace(/\bJUN\/2G\b/gi, 'JUN/26')
      .replace(/\bPER[ÍI]ODO\b/gi, 'PERIODO')
      .replace(/\bLAN[ÇC]AMENTO\b/gi, 'LANCAMENTO')
      .replace(/\bCONTA\/RENDE\+\b/gi, 'Saldo Conta/Rende+')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const prepararCanvasParaOCR = (canvas, context) => {
    const imagem = context.getImageData(0, 0, canvas.width, canvas.height)
    const dados = imagem.data

    for (let i = 0; i < dados.length; i += 4) {
      const media = Math.round((dados[i] + dados[i + 1] + dados[i + 2]) / 3)
      const valor = media > 180 ? 255 : 0
      dados[i] = valor
      dados[i + 1] = valor
      dados[i + 2] = valor
      dados[i + 3] = 255
    }

    context.putImageData(imagem, 0, 0)
    context.drawImage(canvas, 0, 0, canvas.width, canvas.height)
  }

  const limparDescricao = (texto) => {
    return String(texto || '')
      .replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const normalizar = (texto) => {
    return limparTexto(texto)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
  }

  const extrairPeriodoPadrao = (linhas) => {
    for (const linha of linhas || []) {
      const texto = limparTexto(linha)
      const match = texto.match(/PERIODO:\s*\d{2}\/(\d{2})\/(\d{4})\s+A\s+\d{2}\/\d{2}\/\d{4}/i)
      if (match) {
        return { mes: match[1], ano: match[2] }
      }
    }
    return null
  }

  const montarData = (dia, mesAno) => {
    const meses = {
      JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06',
      JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12'
    }
    const [mesSigla, ano2] = String(mesAno || '').toUpperCase().split('/')
    const mes = meses[mesSigla] || '01'
    const ano = `20${ano2 || '00'}`
    return `${String(dia).padStart(2, '0')}/${mes}/${ano}`
  }

  const montarDataDiaMesAno = (dia, mes, ano) => {
    if (!dia || !mes || !ano) return ''
    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`
  }

  const extrairMesAnoData = (data) => {
    const match = String(data || '').match(/^\d{2}\/(\d{2})\/(\d{4})$/)
    if (!match) return null
    return { mes: match[1], ano: match[2] }
  }

  const montarDataComContexto = (dia, dataContexto, periodoPadrao) => {
    const contexto = extrairMesAnoData(dataContexto)
    if (contexto?.mes && contexto?.ano) return montarDataDiaMesAno(dia, contexto.mes, contexto.ano)
    if (periodoPadrao?.mes && periodoPadrao?.ano) return montarDataDiaMesAno(dia, periodoPadrao.mes, periodoPadrao.ano)
    return ''
  }

  const pareceDocumento = (texto) => {
    const base = normalizar(texto)
    if (!base) return false
    return (
      /\d{6,}/.test(base) ||
      /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/.test(base) ||
      /\bAG\s*\d+\b/.test(base) ||
      /\bC\d+\b/.test(base) ||
      /\bPIX\b/.test(base)
    )
  }

  const valorParaNumero = (valorPtBr) => {
    const normalizado = String(valorPtBr || '')
      .replace(/\s+/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
    return parseFloat(normalizado) || 0
  }

  const formatarMoeda = (n) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  const criarTransacao = (idx, data, descricao, valorNumerico) => ({
    id: `BANESTES-PDF-${idx + 1}`,
    data,
    descricao,
    documento: '',
    valor: formatarMoeda(valorNumerico),
    valorNumerico,
    banco: 'Banestes',
    origem: 'PDF'
  })

  return { processando, erro, processarPDF }
}
