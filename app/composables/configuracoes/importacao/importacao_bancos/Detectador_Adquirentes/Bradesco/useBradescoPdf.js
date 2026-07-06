import { ref } from 'vue'

export const useBradescoPdf = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const { linhas, colunas } = await extrairLinhasPDF(arquivo)
      const transacoes = parseLinhasBradesco(linhas, colunas)
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
    let colunas = null
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const items = textContent.items.map(it => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))
      const grupos = agruparPorY(items)
      for (const grupo of grupos) {
        const ordenado = grupo.sort((a, b) => a.x - b.x)
        const texto = ordenado.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim()
        if (!texto) continue
        linhas.push({ texto, itens: ordenado })

        if (!colunas && ehLinhaCabecalhoExtrato(texto)) {
          colunas = detectarColunas(ordenado)
        }
      }
    }
    return { linhas, colunas }
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
    const tolerancia = 1.2
    items.sort((a, b) => b.y - a.y)
    for (const it of items) {
      let grupo = grupos.find(g => Math.abs(g.y - it.y) <= tolerancia)
      if (!grupo) { grupo = { y: it.y, itens: [] }; grupos.push(grupo) }
      grupo.itens.push(it)
    }
    return grupos.map(g => g.itens)
  }

  const normalizar = (v) => String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()

  const ehLinhaCabecalhoExtrato = (texto) => {
    const t = normalizar(texto)
    return t.includes('DATA') &&
      t.includes('LANCAMENTO') &&
      t.includes('DCTO') &&
      t.includes('CREDITO') &&
      t.includes('DEBITO') &&
      t.includes('SALDO')
  }

  const detectarColunas = (itens) => {
    const acharX = (re) => {
      const it = itens.find(i => re.test(normalizar(i.str)))
      return it ? Number(it.x) : null
    }
    const dataX = acharX(/^DATA$/)
    const lancX = acharX(/^LANCAMENTO/)
    const dctoX = acharX(/^DCTO/)
    const credX = acharX(/^CREDITO/)
    const debX = acharX(/^DEBITO/)
    const saldoX = acharX(/^SALDO/)
    if ([dataX, lancX, dctoX, credX, debX, saldoX].some(v => v === null)) return null

    return { dataX, lancX, dctoX, credX, debX, saldoX }
  }

  const separarPorColuna = (itens, c) => {
    const b1 = (c.dataX + c.lancX) / 2
    const b2 = (c.lancX + c.dctoX) / 2
    const b3 = (c.dctoX + c.credX) / 2
    const b4 = (c.credX + c.debX) / 2
    const b5 = (c.debX + c.saldoX) / 2
    const out = { data: [], lancamento: [], dcto: [], credito: [], debito: [], saldo: [] }
    for (const it of itens) {
      const x = Number(it.x)
      const v = String(it.str || '').trim()
      if (!v) continue
      if (x < b1) out.data.push(v)
      else if (x < b2) out.lancamento.push(v)
      else if (x < b3) out.dcto.push(v)
      else if (x < b4) out.credito.push(v)
      else if (x < b5) out.debito.push(v)
      else out.saldo.push(v)
    }
    return {
      data: out.data.join(' ').replace(/\s+/g, ' ').trim(),
      lancamento: out.lancamento.join(' ').replace(/\s+/g, ' ').trim(),
      dcto: out.dcto.join(' ').replace(/\s+/g, ' ').trim(),
      credito: out.credito.join(' ').replace(/\s+/g, ' ').trim(),
      debito: out.debito.join(' ').replace(/\s+/g, ' ').trim(),
      saldo: out.saldo.join(' ').replace(/\s+/g, ' ').trim()
    }
  }

  const normalizarDataBradesco = (valor, anoExtrato) => {
    const s = String(valor || '').trim()
    const corrigirDiaProvavel = (diaStr, mesStr, anoStr = '') => {
      const dia = Number(diaStr)
      const mes = Number(mesStr)
      if (dia >= 1 && dia <= 31) return ''
      if (!Number.isInteger(mes) || mes < 1 || mes > 12) return ''
      if (!/^\d{2}$/.test(diaStr)) return ''

      // Alguns PDFs do Bradesco trocam o zero inicial do dia por 4/6/8.
      // Ex.: 09 -> 69, 07 -> 47.
      const diaCorrigido = `0${diaStr[1]}`
      const candidato = validarPartes(diaCorrigido, mesStr, anoStr)
      return candidato || ''
    }

    const validarPartes = (diaStr, mesStr, anoStr = '') => {
      const dia = Number(diaStr)
      const mes = Number(mesStr)
      const ano = anoStr ? Number(anoStr) : Number(anoExtrato)
      if (!Number.isInteger(dia) || !Number.isInteger(mes)) return ''
      if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return ''
      if (anoStr && (!Number.isInteger(ano) || ano < 1900 || ano > 2100)) return ''
      const data = new Date(ano || 2000, mes - 1, dia)
      if (data.getDate() !== dia || data.getMonth() !== (mes - 1)) return ''
      const diaFmt = String(dia).padStart(2, '0')
      const mesFmt = String(mes).padStart(2, '0')
      return anoStr || anoExtrato ? `${diaFmt}/${mesFmt}/${anoStr || anoExtrato}` : `${diaFmt}/${mesFmt}`
    }

    const completa = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (completa) return validarPartes(completa[1], completa[2], completa[3]) || corrigirDiaProvavel(completa[1], completa[2], completa[3])

    const parcial = s.match(/^(\d{2})\/(\d{2})$/)
    if (parcial) return validarPartes(parcial[1], parcial[2]) || corrigirDiaProvavel(parcial[1], parcial[2])

    return ''
  }

  const parseLinhasBradesco = (linhas, colunas) => {
    if (!Array.isArray(linhas) || linhas.length === 0) return []
    if (!colunas) {
      // Fallback mínimo quando o cabeçalho não for detectado.
      return []
    }

    const transacoes = []
    const anoExtrato = obterAnoExtrato(linhas.map(l => l.texto))
    const linhaRuidoRegex = /(Extrato Mensal|Por Per[ií]odo|CNPJ:|Nome do usu[aá]rio|Data da opera[cç][aã]o|Folha \d+\/\d+)/i
    let dataAtual = ''
    let bufferLancamento = ''
    let ultimoIndiceTransacao = -1

    for (let idx = 0; idx < linhas.length; idx++) {
      const row = linhas[idx]
      const texto = String(row?.texto || '').replace(/\s+/g, ' ').trim()
      if (!texto) continue
      if (ehLinhaCabecalhoExtrato(texto)) continue
      if (linhaRuidoRegex.test(texto)) continue

      const cols = separarPorColuna(row.itens || [], colunas)
      const dataLinha = normalizarDataBradesco(cols.data, anoExtrato)
      if (dataLinha) dataAtual = dataLinha

      const lanc = String(cols.lancamento || '').replace(/\s+/g, ' ').trim()
      const dcto = String(cols.dcto || '').replace(/\D/g, '')
      const creditoRaw = String(cols.credito || '').trim()
      const debitoRaw = String(cols.debito || '').trim()

      if (!lanc && !dcto && !creditoRaw && !debitoRaw) continue
      if (/^SALDO ANTERIOR$/i.test(normalizar(lanc))) continue

      const temCredito = /\d{1,3}(?:\.\d{3})*,\d{2}/.test(creditoRaw)
      const temDebito = /\d{1,3}(?:\.\d{3})*,\d{2}/.test(debitoRaw)
      const temDcto = dcto.length > 0

      // Sem valores e sem documento = continuação de lançamento.
      // Regra solicitada: se não tem numeração, é continuação da linha de cima.
      if (!temCredito && !temDebito && !temDcto && lanc) {
        if (ultimoIndiceTransacao >= 0 && transacoes[ultimoIndiceTransacao]) {
          const atualDesc = String(transacoes[ultimoIndiceTransacao].descricao || '').trim()
          transacoes[ultimoIndiceTransacao].descricao = `${atualDesc} ${lanc}`.replace(/\s+/g, ' ').trim()
        } else {
          bufferLancamento = bufferLancamento ? `${bufferLancamento} ${lanc}` : lanc
        }
        continue
      }

      const descricaoFinal = [bufferLancamento, lanc].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
      bufferLancamento = ''

      // Regra solicitada: VALOR = coluna CRÉDITO.
      if (!temCredito) continue
      // Cada lançamento deve ter seu documento (Dcto).
      if (!temDcto) continue
      const valorNumerico = valorParaNumero(creditoRaw)
      if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) continue

      transacoes.push({
        id: `BR-${idx + 1}`,
        data: dataAtual || '',
        descricao: descricaoFinal,
        documento: dcto || '',
        valor: formatarMoeda(valorNumerico),
        valorNumerico,
        banco: 'Bradesco',
        adquirente: identificarAdquirente(descricaoFinal)
      })
      ultimoIndiceTransacao = transacoes.length - 1
    }

    return transacoes
  }

  const obterAnoExtrato = (linhas) => {
    // 1) Tenta identificar pelo bloco "Período" (múltiplos formatos comuns).
    for (const l of linhas) {
      const m = l.match(/PER[IÍ]ODO:\s*\d{2}\/\d{2}\/(\d{4}).*?-.*?(\d{2}\/\d{2}\/\d{4})/i)
      if (m) { return m[1] }
      const m2 = l.match(/PER[IÍ]ODO.*?(\d{2}\/\d{2}\/\d{4}).*?(\d{2}\/\d{2}\/\d{4})/i)
      if (m2) { return m2[1].slice(-4) }
      const m3 = l.match(/PER[IÍ]ODO.*?(\d{2}\/\d{2}\/\d{4})/i)
      if (m3) { return m3[1].slice(-4) }
    }

    // 2) Fallback: usa o primeiro ano encontrado em qualquer data completa no PDF.
    for (const l of linhas) {
      const m = l.match(/\b\d{2}\/\d{2}\/(\d{4})\b/)
      if (m) { return m[1] }
    }

    return ''
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

  const formatarMoeda = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  return { processando, erro, processarPDF }
}
