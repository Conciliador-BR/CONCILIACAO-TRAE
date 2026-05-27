import { ref } from 'vue'

export const useSantanderPdf = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null

    try {
      const { linhas, colunas } = await extrairLinhasPDF(arquivo)
      const transacoes = parseLinhasSantander(linhas, colunas)

      return {
        sucesso: true,
        transacoes,
        total: transacoes.length
      }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar PDF Santander'
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
    let colunas = null

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
        if (!texto) continue

        linhas.push({
          texto,
          itens: ordenado
        })

        if (!colunas && ehLinhaCabecalhoExtrato(texto)) {
          colunas = detectarColunas(ordenado)
        }
      }
    }

    return { linhas, colunas }
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

  const normalizar = (valor) => String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()

  const limparTexto = (valor) => String(valor || '').replace(/\s+/g, ' ').trim()

  const ehDataBr = (valor) => /^\d{2}\/\d{2}\/\d{4}$/.test(limparTexto(valor))

  const ehValorBr = (valor) => /^-?\d{1,3}(?:\.\d{3})*,\d{2}$/.test(limparTexto(valor))

  const ehLinhaCabecalhoExtrato = (texto) => {
    const base = normalizar(texto)
    return base.includes('DATA') &&
      base.includes('HISTORICO') &&
      base.includes('DOCUMENTO') &&
      base.includes('VALOR') &&
      base.includes('SALDO')
  }

  const ehLinhaIgnorada = (texto) => {
    const base = normalizar(texto)
    if (!base) return true

    return (
      ehLinhaCabecalhoExtrato(texto) ||
      /^SANTANDER\b/.test(base) ||
      /^SANTANDER EMPRESAS\b/.test(base) ||
      /^PERIODOS?:/.test(base) ||
      /^DATA\/HORA:/.test(base) ||
      /^SALDO DISPONIVEL/.test(base) ||
      /^AGENCIA:/.test(base) ||
      /^CONTA:/.test(base) ||
      /^SHOW /.test(base)
    )
  }

  const detectarColunas = (itens) => {
    const acharX = (regex) => {
      const item = itens.find((it) => regex.test(normalizar(it.str)))
      return item ? Number(item.x) : null
    }

    const dataX = acharX(/^DATA$/)
    const historicoX = acharX(/^HISTORICO$/)
    const documentoX = acharX(/^DOCUMENTO$/)
    const valorX = acharX(/^VALOR/)
    const saldoX = acharX(/^SALDO/)

    if ([dataX, historicoX, documentoX, valorX, saldoX].some((valor) => valor === null)) {
      return null
    }

    return { dataX, historicoX, documentoX, valorX, saldoX }
  }

  const separarPorColuna = (itens, colunas) => {
    if (!colunas) {
      return { data: '', historico: '', documento: '', valor: '', saldo: '' }
    }

    const limiteData = (colunas.dataX + colunas.historicoX) / 2
    const limiteHistorico = (colunas.historicoX + colunas.documentoX) / 2
    const limiteDocumento = (colunas.documentoX + colunas.valorX) / 2
    const limiteValor = (colunas.valorX + colunas.saldoX) / 2

    const partes = {
      data: [],
      historico: [],
      documento: [],
      valor: [],
      saldo: []
    }

    for (const item of itens) {
      const x = Number(item.x)
      const texto = limparTexto(item.str)
      if (!texto) continue

      if (x < limiteData) partes.data.push(texto)
      else if (x < limiteHistorico) partes.historico.push(texto)
      else if (x < limiteDocumento) partes.documento.push(texto)
      else if (x < limiteValor) partes.valor.push(texto)
      else partes.saldo.push(texto)
    }

    return {
      data: limparTexto(partes.data.join(' ')),
      historico: limparTexto(partes.historico.join(' ')),
      documento: limparTexto(partes.documento.join(' ')),
      valor: limparTexto(partes.valor.join(' ')),
      saldo: limparTexto(partes.saldo.join(' '))
    }
  }

  const valorParaNumero = (valorPtBr) => {
    const texto = limparTexto(valorPtBr)
    if (!texto) return 0

    const negativo = texto.includes('-')
    const numero = parseFloat(
      texto
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^0-9.-]/g, '')
    ) || 0

    return negativo ? -Math.abs(numero) : numero
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const normalizarHistoricoEDocumento = (historicoOriginal, documentoOriginal = '') => {
    let historico = limparTexto(historicoOriginal)
    let documento = limparTexto(documentoOriginal)
    const base = normalizar(historico)

    const manterNumeroNaDescricao = (
      base.startsWith('PIX RECEBIDO') ||
      base.startsWith('PIX ENVIADO') ||
      base.startsWith('RECEBIMENTO PIX') ||
      base.startsWith('PAGAMENTO PIX')
    )

    if (manterNumeroNaDescricao) {
      if (documento) historico = limparTexto(`${historico} ${documento}`)
      return { historico, documento: '' }
    }

    if (!documento) {
      const matchDocumentoNoFim = historico.match(/^(.*?)(?:\s+)(\d{6,})$/)
      if (matchDocumentoNoFim) {
        historico = limparTexto(matchDocumentoNoFim[1])
        documento = limparTexto(matchDocumentoNoFim[2])
      }
    }

    return { historico, documento }
  }

  const parseLinhaFallback = (texto, indice) => {
    const linha = limparTexto(texto)
    if (!linha || ehLinhaIgnorada(linha)) return null

    const regexComDocumento = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(\d{6,})\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/
    const regexSemDocumento = /^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})\s+(-?\d{1,3}(?:\.\d{3})*,\d{2})$/

    const matchComDocumento = linha.match(regexComDocumento)
    const matchSemDocumento = linha.match(regexSemDocumento)
    const match = matchComDocumento || matchSemDocumento

    if (!match) return null

    const data = limparTexto(match[1])
    const historicoBruto = limparTexto(match[2])
    const documentoBruto = matchComDocumento ? limparTexto(match[3]) : ''
    const valorRaw = limparTexto(matchComDocumento ? match[4] : match[3])
    const saldoRaw = limparTexto(matchComDocumento ? match[5] : match[4])

    const { historico, documento } = normalizarHistoricoEDocumento(historicoBruto, documentoBruto)
    if (!historico || /^SALDO ANTERIOR$/i.test(normalizar(historico))) return null

    return {
      id: documento || `SANTANDER-PDF-${indice + 1}`,
      data,
      descricao: historico,
      documento,
      valorRaw,
      saldoRaw,
      valorNumerico: valorParaNumero(valorRaw)
    }
  }

  const criarTransacao = (registro, indice) => {
    const { historico, documento } = normalizarHistoricoEDocumento(registro.descricao, registro.documento)
    const valorNumerico = valorParaNumero(registro.valorRaw)

    return {
      id: documento || `SANTANDER-PDF-${indice + 1}`,
      data: limparTexto(registro.data),
      descricao: historico,
      documento,
      valor: formatarMoeda(valorNumerico),
      valorNumerico,
      banco: 'Santander',
      origem: 'PDF'
    }
  }

  const parseLinhasSantander = (linhas, colunas) => {
    if (!Array.isArray(linhas) || linhas.length === 0) return []

    const transacoes = []
    let pendente = null

    const finalizarPendente = () => {
      if (!pendente) return

      const descricao = limparTexto(pendente.descricao)
      const data = limparTexto(pendente.data)
      const valorRaw = limparTexto(pendente.valorRaw)

      if (data && descricao && valorRaw && !/^SALDO ANTERIOR$/i.test(normalizar(descricao))) {
        transacoes.push(criarTransacao({
          data,
          descricao,
          documento: pendente.documento,
          valorRaw
        }, transacoes.length))
      }

      pendente = null
    }

    for (let indice = 0; indice < linhas.length; indice++) {
      const row = linhas[indice]
      const texto = limparTexto(row?.texto)
      if (!texto || ehLinhaIgnorada(texto)) continue

      const fallback = parseLinhaFallback(texto, indice)
      const colunasLinha = separarPorColuna(row.itens || [], colunas)

      const dataColuna = ehDataBr(colunasLinha.data) ? colunasLinha.data : ''
      const historicoColuna = limparTexto(colunasLinha.historico)
      const documentoColuna = limparTexto(colunasLinha.documento)
      const valorColuna = ehValorBr(colunasLinha.valor) ? colunasLinha.valor : ''

      const iniciaTransacao = Boolean(
        fallback ||
        (dataColuna && valorColuna)
      )

      if (iniciaTransacao) {
        finalizarPendente()

        if (fallback) {
          pendente = {
            data: fallback.data,
            descricao: fallback.descricao,
            documento: fallback.documento,
            valorRaw: fallback.valorRaw
          }
          continue
        }

        const campos = normalizarHistoricoEDocumento(historicoColuna, documentoColuna)
        pendente = {
          data: dataColuna,
          descricao: campos.historico,
          documento: campos.documento,
          valorRaw: valorColuna
        }
        continue
      }

      const textoContinuacao = limparTexto(
        historicoColuna ||
        texto
      )

      if (!pendente || !textoContinuacao) continue

      if (ehDataBr(textoContinuacao) || ehValorBr(textoContinuacao)) continue
      if (ehLinhaIgnorada(textoContinuacao)) continue

      pendente.descricao = limparTexto(`${pendente.descricao} ${textoContinuacao}`)
    }

    finalizarPendente()
    return transacoes
  }

  return {
    processando,
    erro,
    processarPDF
  }
}
