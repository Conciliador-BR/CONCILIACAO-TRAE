import { ref } from 'vue'

export const useCaixaPdf = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const linhas = await extrairLinhasPDF(arquivo)
      const transacoes = parseLinhasCaixa(linhas)
      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar PDF da Caixa'
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

  const parseLinhasCaixa = (linhas) => {
    const transacoes = []
    let anoExtrato = obterAnoExtrato(linhas)
    let atual = null
    const dataRegex = /^(\d{2}\/\d{2}\/\d{4})\b/i
    const dataEfetivaRegex = /^(\d{2}\/\d{2}\s+\d{2}:\d{2})\b/i
    const valorRegex = /(-?\s*R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}(?:[CD\*]?))/i
    const valorRegexGlobal = /(-?\s*R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}(?:[CD\*]?))/g
    const documentoRegex = /^(\d{5,})\b/
    let contador = 0

    const limparDescricao = (texto) => {
      return String(texto || '')
        .replace(valorRegexGlobal, '')
        .replace(/\b\d{2}\/\d{2}(?:\/\d{4})?\b/g, '')
        .replace(/\b\d{2}:\d{2}\b/g, '')
        .replace(documentoRegex, '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    const deveIgnorarLinha = (linha) => {
      const l = String(linha || '').trim()
      return !l ||
        /^DATA(\s*\/\s*DATA EFETIVA)?$/i.test(l) ||
        /^DATA EFETIVA$/i.test(l) ||
        /^DOCUMENTO$/i.test(l) ||
        /^VALOR$/i.test(l) ||
        /^HIST[ÓO]RICO$/i.test(l) ||
        /^SALDO$/i.test(l) ||
        /EXTRATO NO PER[IÍ]ODO/i.test(l) ||
        /SALDO ANTERIOR AO PER[IÍ]ODO SOLICITADO/i.test(l) ||
        /GERENCIADOR\s+CAIXA/i.test(l) ||
        /^AG[EÊ]NCIA:/i.test(l) ||
        /^CNPJ:/i.test(l)
    }

    const completarData = (dataCompleta) => {
      if (dataCompleta) return dataCompleta
      if (anoExtrato) return `01/01/${anoExtrato}`
      return ''
    }

    const extrairValorColuna = (texto) => {
      const valores = String(texto || '').match(valorRegexGlobal) || []
      if (!valores.length) return ''
      if (valores.length >= 2) return valores[0]
      const unico = valores[0].trim()
      if (/[CD]$/i.test(unico) && !/-/.test(unico)) return ''
      return unico
    }

    const finalizarAtual = () => {
      if (!atual) return
      const descricaoFinal = `${atual.descricaoPrimaria || ''} ${atual.detalhe || ''}`.replace(/\s+/g, ' ').trim()
      if (!descricaoFinal || /\bSALDO DIA\b/i.test(descricaoFinal)) {
        atual = null
        return
      }
      contador++
      const valorBase = atual.valorStr ? valorParaNumero(atual.valorStr) : 0
      const valorNumerico = Math.abs(valorBase)
      transacoes.push({
        id: `CAIXA-${contador}`,
        data: atual.data,
        descricao: descricaoFinal,
        documento: atual.documento || `CAIXA-${contador}`,
        valor: formatarMoeda(valorNumerico),
        valorNumerico,
        banco: 'Caixa',
        origem: 'PDF'
      })
      atual = null
    }

    for (let idx = 0; idx < linhas.length; idx++) {
      const linhaRaw = String(linhas[idx] || '').replace(/\s+/g, ' ').trim()
      if (deveIgnorarLinha(linhaRaw)) continue
      const linha = linhaRaw.replace(/^(\||\u2022|\-)\s*/, '')
      const dataMatch = linha.match(dataRegex)
      if (dataMatch) {
        finalizarAtual()
        let resto = linha.replace(dataMatch[0], '').trim()
        let dataEfetiva = ''
        let documento = ''
        let valorStr = ''
        const dataEfetivaMatch = resto.match(dataEfetivaRegex)
        if (dataEfetivaMatch) {
          dataEfetiva = dataEfetivaMatch[1]
          resto = resto.replace(dataEfetivaRegex, '').trim()
        }
        const docMatch = resto.match(documentoRegex)
        if (docMatch) {
          documento = docMatch[1]
          resto = resto.replace(documentoRegex, '').trim()
        }
        const valorColuna = extrairValorColuna(resto)
        if (valorColuna) {
          valorStr = valorColuna
          resto = resto.replace(valorColuna, '').trim()
        }
        atual = {
          id: `CX-${idx + 1}`,
          data: completarData(dataMatch[1]),
          dataEfetiva,
          documento,
          descricaoPrimaria: limparDescricao(resto),
          detalhe: '',
          valorStr
        }
        continue
      }
      if (!atual) continue
      let resto = linha
      if (!atual.dataEfetiva) {
        const matchEfetiva = resto.match(dataEfetivaRegex)
        if (matchEfetiva) {
          atual.dataEfetiva = matchEfetiva[1]
          resto = resto.replace(dataEfetivaRegex, '').trim()
        }
      }
      if (!atual.documento) {
        const matchDoc = resto.match(documentoRegex)
        if (matchDoc) {
          atual.documento = matchDoc[1]
          resto = resto.replace(documentoRegex, '').trim()
        }
      }
      if (!atual.valorStr) {
        const valorColuna = extrairValorColuna(resto)
        if (valorColuna) {
          atual.valorStr = valorColuna
          resto = resto.replace(valorColuna, '').trim()
        }
      }
      const detalhe = limparDescricao(resto)
      if (detalhe) {
        if (atual.detalhe) atual.detalhe += ` ${detalhe}`
        else atual.detalhe = detalhe
      }
    }
    finalizarAtual()
    return transacoes
  }

  const obterAnoExtrato = (linhas) => {
    for (const l of linhas) {
      const m1 = String(l).match(/EXTRATO NO PER[IÍ]ODO DE \d{2}\/\d{2}\/(\d{4})/i)
      if (m1) { return m1[1] }
      const m2 = String(l).match(/PER[IÍ]ODO[:\s]+\d{2}\/\d{2}\/(\d{4})/i)
      if (m2) { return m2[1] }
    }
    return ''
  }

  const valorParaNumero = (v) => {
    const s = String(v || '').trim()
    const c = /[CD\*]$/.test(s) ? s.slice(-1).toUpperCase() : ''
    const semIndicador = s.replace(/[CD\*]$/, '')
    const possuiSinalDebito = /^\s*-\s*(?:R\$)?\s*\d/.test(semIndicador)
    const n = parseFloat(
      semIndicador
        .replace(/[^\d,.-]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    ) || 0
    if (c === 'D' || possuiSinalDebito) return -Math.abs(n)
    return Math.abs(n)
  }

  const formatarMoeda = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)

  return { processando, erro, processarPDF }
}
