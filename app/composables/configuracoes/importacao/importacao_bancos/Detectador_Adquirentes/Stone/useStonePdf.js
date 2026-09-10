import { ref } from 'vue'

export const useStonePdf = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const linhas = await extrairLinhasPDF(arquivo)
      const transacoes = parseLinhasStone(linhas)
      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar PDF Stone'
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
      const items = textContent.items.map(it => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        w: it.width
      }))

      const grupos = agruparPorY(items)
      grupos.sort((a, b) => b.y - a.y)

      for (const grupo of grupos) {
        const ordenado = grupo.itens.sort((a, b) => a.x - b.x)
        if (!ordenado.length) continue
        let texto = ordenado[0].str
        for (let k = 1; k < ordenado.length; k++) {
          const prev = ordenado[k - 1]
          const curr = ordenado[k]
          const gap = curr.x - (prev.x + (prev.w || 0))
          texto += gap > 10 ? ` / ${curr.str}` : ` ${curr.str}`
        }
        texto = texto.replace(/\s+/g, ' ').trim()
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
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Falha ao carregar script de PDF'))
    document.head.appendChild(script)
  })

  const agruparPorY = (items) => {
    const grupos = []
    const tolerancia = 3
    for (const it of items) {
      if (!String(it.str || '').trim()) continue
      let grupo = grupos.find(g => Math.abs(g.y - it.y) <= tolerancia)
      if (!grupo) {
        grupo = { y: it.y, itens: [] }
        grupos.push(grupo)
      }
      grupo.itens.push(it)
    }
    return grupos
  }

  const parseLinhasStone = (linhas) => {
    const transacoes = []
    let idx = 1
    let ultimaTransacao = null
    const regexData = /^(\d{2}\/\d{2}\/\d{2}|\d{2}\/\d{2}\/\d{4})\b/
    const regexValor = /-?\s*R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}/
    const regexSeparadorColuna = /\s+\/\s+/

    const ehSegmentoContraparte = (texto) => {
      const valor = String(texto || '').trim()
      if (!valor) return false
      return /^(?:Ag:|Cc:|Conta:|Agência:|CNPJ:|CPF:)/i.test(valor)
        || /PAGAMENTO S\.A\./i.test(valor)
        || /STONE INSTITUIÇÃO DE/i.test(valor)
        || /STONE INSTITUICAO DE/i.test(valor)
        || /INSTITUIÇÃO/i.test(valor)
        || /INSTITUICAO/i.test(valor)
    }

    const removerValoresMonetarios = (str) => {
      return String(str || '')
        .replace(/-?\s*R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    const extrairApenasDescricao = (textoCompleto) => {
      const semData = String(textoCompleto || '')
        .replace(regexData, '')
        .trim()
      const partes = semData
        .split(regexSeparadorColuna)
        .map(parte => removerValoresMonetarios(parte))
        .map(parte => parte.trim())
        .filter(Boolean)

      if (!partes.length) return ''

      while (partes.length && /^(Saída|Entrada)$/i.test(partes[0])) {
        partes.shift()
      }

      while (partes.length && ehSegmentoContraparte(partes[partes.length - 1])) {
        partes.pop()
      }

      const descricaoPartes = partes.filter((parte) => {
        if (!parte) return false
        if (/^(Saída|Entrada)$/i.test(parte)) return false
        if (ehSegmentoContraparte(parte)) return false
        if (regexValor.test(parte)) return false
        return true
      })

      return descricaoPartes.join(' ').replace(/\s+/g, ' ').trim()
    }

    const eLinhaContinucaoDescricao = (linha) => {
      const limpa = removerValoresMonetarios(linha)
      if (!limpa) return false
      const parte = extrairApenasDescricao(linha)
      if (!parte) return false
      if (ehSegmentoContraparte(parte)) return false
      if (/^(DATA|TIPO|DESCRIÇÃO|VALOR|SALDO|CONTRAPARTE|Período|Dados da conta|Extrato|Nome|Documento|Instituição|Agência|Conta|Página)/i.test(limpa)) return false
      return true
    }

    for (const linhaOriginal of linhas) {
      const linha = String(linhaOriginal || '').trim()
      if (!linha) continue

      const dataMatch = linha.match(regexData)

      if (dataMatch) {
        const valorMatch = linha.match(/(-?\s*R\$\s*\d{1,3}(?:\.\d{3})*,\d{2})/)
        if (!valorMatch) continue

        const data = normalizarData(dataMatch[1])
        const valorNumerico = valorParaNumero(valorMatch[1])
        let descricao = extrairApenasDescricao(linha)
        if (!descricao) continue

        ultimaTransacao = {
          id: `STONE-PDF-${idx}`,
          data,
          descricao,
          documento: '',
          valor: formatarMoeda(valorNumerico),
          valorNumerico,
          banco: 'Stone',
          origem: 'PDF'
        }
        transacoes.push(ultimaTransacao)
        idx += 1
      } else if (ultimaTransacao && eLinhaContinucaoDescricao(linha)) {
        const continuao = extrairApenasDescricao(linha)
        if (continuao) {
          const jaExiste = ultimaTransacao.descricao.toLowerCase().includes(continuao.toLowerCase())
          if (!jaExiste) {
            ultimaTransacao.descricao = `${ultimaTransacao.descricao} ${continuao}`.trim()
          }
        }
      }
    }

    return transacoes
  }

  const normalizarData = (d) => {
    const p = String(d || '').split('/')
    if (p.length !== 3) return d
    let [dia, mes, ano] = p
    if (ano.length === 2) ano = `20${ano}`
    return `${dia}/${mes}/${ano}`
  }

  const valorParaNumero = (valorPtBr) => {
    const limpo = String(valorPtBr || '')
      .replace(/\s/g, '')
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
    const n = parseFloat(limpo)
    return Number.isFinite(n) ? n : 0
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  return { processando, erro, processarPDF }
}
