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
    let dataAtual = ''
    let mesAnoAtual = ''
    let diaAtual = ''
    let descricaoAcumulada = []

    // Inicializa o mês/ano com base no rodapé do documento para salvar o 1º dia
    const periodoPadrao = extrairPeriodoPadrao(linhas)
    if (periodoPadrao) {
      mesAnoAtual = `${periodoPadrao.mes}/${periodoPadrao.ano}`
    }

    for (let i = 0; i < linhas.length; i++) {
      let linha = limparTexto(linhas[i])
      if (!linha) continue

      if (/^(Data|Lancamento|Valor|Saldo Anterior|Extrato|Saldos|Limite|Cheque Especial|Agencia|Cliente|SALDO TOTAL|ENTRADAS E SA[ÍI]DAS)/i.test(linha)) {
        continue
      }
      if (/^(Saldo Conta|Rendimento Previsto|Saldo Rende\+|Saldo Total)/i.test(linha)) {
         continue
      }

      const matchMesAno = linha.match(/\b([A-Z]{3})\/(\d{2})\b/i)
      if (matchMesAno) {
        mesAnoAtual = `${converterMes(matchMesAno[1])}/20${matchMesAno[2]}`
        linha = linha.replace(/\b[A-Z]{3}\/\d{2}\b/i, '').trim()
      }

      const matchDia = linha.match(/^(\d{2})\b/)
      if (matchDia) {
        diaAtual = matchDia[1]
        linha = linha.replace(/^(\d{2})\b/, '').trim()
      }

      if (!linha) continue 

      const matchValor = linha.match(/^(.*?)?\s*([+-]?\s?\d{1,3}(?:\.\d{3})*,\d{2})$/)

      if (matchValor) {
        let descLinha = limparDescricao(matchValor[1] || '')
        const valorNumerico = valorParaNumero(matchValor[2])

        if (/(Saldo Conta|Rende\+)/i.test(descLinha)) {
           if (descLinha.trim().toUpperCase() === 'SALDO CONTA/RENDE+') descLinha = '';
           else descLinha = descLinha.replace(/Saldo Conta\/Rende\+/ig, '').trim()
        }

        let descricaoCompleta = [...descricaoAcumulada, descLinha].filter(Boolean).join(' ')

        if (descricaoCompleta) {
          if (diaAtual && mesAnoAtual) {
            dataAtual = `${diaAtual}/${mesAnoAtual}`
          }

          if (dataAtual) {
             transacoes.push(criarTransacao(i, dataAtual, descricaoCompleta, valorNumerico))
          }
        }

        descricaoAcumulada = []

      } else {
        if (!/^(Saldo|Total)/i.test(linha)) {
          descricaoAcumulada.push(linha)
        }
      }
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

  const converterMes = (sigla) => {
    const meses = {
      JAN: '01', FEV: '02', MAR: '03', ABR: '04', MAI: '05', JUN: '06',
      JUL: '07', AGO: '08', SET: '09', OUT: '10', NOV: '11', DEZ: '12'
    }
    return meses[String(sigla).toUpperCase()] || '01'
  }

  const extrairPeriodoPadrao = (linhas) => {
    for (const linha of linhas || []) {
      // Normaliza para remover acentos (transforma "Período" em "PERIODO" e "à" em "A")
      const textoNormalizado = String(linha || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
      
      const match = textoNormalizado.match(/PERIODO:\s*\d{2}\/(\d{2})\/(\d{4})\s+A\s+\d{2}\/\d{2}\/\d{4}/i)
      if (match) {
        return { mes: match[1], ano: match[2] }
      }
    }
    return null
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