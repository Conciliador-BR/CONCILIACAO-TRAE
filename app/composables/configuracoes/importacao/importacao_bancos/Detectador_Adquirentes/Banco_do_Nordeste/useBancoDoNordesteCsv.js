import { ref } from 'vue'

export const useBancoDoNordesteCsv = () => {
  const processando = ref(false)
  const erro = ref(null)

  const normalizar = (texto) => {
    return String(texto || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const lerArquivoTexto = (arquivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(String(e.target?.result || ''))
      reader.onerror = () => reject(new Error('Erro ao ler arquivo CSV'))
      reader.readAsText(arquivo, 'utf-8')
    })
  }

  const detectarDelimitador = (linhas) => {
    const amostra = linhas.find(l => String(l || '').trim())
    if (!amostra) return ';'
    const candidatos = [';', ',', '\t']
    let melhor = ';'
    let maior = -1
    for (const d of candidatos) {
      const qtd = (amostra.match(new RegExp(`\\${d}`, 'g')) || []).length
      if (qtd > maior) {
        maior = qtd
        melhor = d
      }
    }
    return melhor
  }

  const parseLinhaCSV = (linha, delimitador) => {
    const out = []
    let atual = ''
    let emAspas = false
    for (let i = 0; i < linha.length; i++) {
      const ch = linha[i]
      if (ch === '"') {
        if (emAspas && linha[i + 1] === '"') {
          atual += '"'
          i++
        } else {
          emAspas = !emAspas
        }
      } else if (ch === delimitador && !emAspas) {
        out.push(atual.trim())
        atual = ''
      } else {
        atual += ch
      }
    }
    out.push(atual.trim())
    return out
  }

  const indiceColuna = (cabecalhoNorm, palavras, excluir = []) => {
    return cabecalhoNorm.findIndex((c) => {
      if (!c) return false
      const ok = palavras.some(p => c.includes(p))
      if (!ok) return false
      return !excluir.some(e => c.includes(e))
    })
  }

  const parseData = (valor) => {
    const s = String(valor || '').trim()
    if (!s) return ''
    const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (m1) {
      const d = String(m1[1]).padStart(2, '0')
      const m = String(m1[2]).padStart(2, '0')
      return `${d}/${m}/${m1[3]}`
    }
    const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m2) {
      return `${m2[3]}/${m2[2]}/${m2[1]}`
    }
    return s
  }

  const parseValor = (valorRaw, indicadorRaw = '') => {
    const valor = String(valorRaw || '').trim()
    const indicador = normalizar(indicadorRaw)
    if (!valor) return 0
    const negativoPorSinal = /^\s*-/.test(valor)
    const numero = parseFloat(
      valor
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^\d.-]/g, '')
    ) || 0
    if (negativoPorSinal) return -Math.abs(numero)
    if (indicador === 'D') return -Math.abs(numero)
    if (indicador === 'C') return Math.abs(numero)
    return numero
  }

  const processarCSV = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const texto = await lerArquivoTexto(arquivo)
      const linhas = texto.split(/\r?\n/).filter(l => String(l || '').trim())
      if (!linhas.length) {
        return { sucesso: true, transacoes: [], total: 0 }
      }

      const delimitador = detectarDelimitador(linhas)
      const matriz = linhas.map(l => parseLinhaCSV(l, delimitador))

      let idxCabecalho = 0
      for (let i = 0; i < matriz.length; i++) {
        const linhaNorm = matriz[i].map(normalizar)
        const temData = linhaNorm.some(c => c === 'DATA')
        const temDesc = linhaNorm.some(c => c.includes('DESCR'))
        const temValor = linhaNorm.some(c => c.includes('VALOR'))
        if (temData && temDesc && temValor) {
          idxCabecalho = i
          break
        }
      }

      const cabecalho = matriz[idxCabecalho] || []
      const cabecalhoNorm = cabecalho.map(normalizar)
      const idxData = indiceColuna(cabecalhoNorm, ['DATA'])
      const idxDocumento = indiceColuna(cabecalhoNorm, ['DOCUMENTO'])
      const idxDescricao = indiceColuna(cabecalhoNorm, ['DESCRICAO', 'DESCRIÇÃO', 'HISTORICO', 'HISTÓRICO'])
      const idxValor = indiceColuna(cabecalhoNorm, ['VALOR'], ['SALDO'])
      const idxDebitoCredito = indiceColuna(cabecalhoNorm, ['DEBITO/CREDITO', 'DÉBITO/CRÉDITO', 'DEBITO', 'CREDITO'])

      const fallback = {
        data: 3,
        descricao: 5,
        documento: 6,
        valor: 8,
        dc: 7
      }

      const iData = idxData >= 0 ? idxData : fallback.data
      const iDescricao = idxDescricao >= 0 ? idxDescricao : fallback.descricao
      const iDocumento = idxDocumento >= 0 ? idxDocumento : fallback.documento
      const iValor = idxValor >= 0 ? idxValor : fallback.valor
      const iDC = idxDebitoCredito >= 0 ? idxDebitoCredito : fallback.dc
      const ehRecebimentoPixVr = (textoNorm) => /^(RECEBIMENTO VIA PIX|PIX RECEBIDO)\s+VR\s+BENEF(?:ICIOS|ICOS)\b/.test(textoNorm || '')

      const transacoes = []
      let contador = 0
      for (let i = idxCabecalho + 1; i < matriz.length; i++) {
        const row = matriz[i]
        const data = parseData(row[iData])
        const descricao = String(row[iDescricao] || '').trim()
        const documento = String(row[iDocumento] || '').trim()
        const valorNumerico = parseValor(row[iValor], row[iDC])
        const descricaoNormalizada = normalizar(descricao)
        const documentoForcadoVR = ehRecebimentoPixVr(descricaoNormalizada) ? '11971' : ''
        const documentoFinal = documentoForcadoVR || documento || `BNC-${contador + 1}`
        if (!data && !descricao && !documento) continue
        if (!descricao) continue
        contador += 1
        transacoes.push({
          id: `BNC-${contador}`,
          data,
          descricao,
          documento: documentoFinal,
          valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico),
          valorNumerico,
          banco: 'Banco do Nordeste',
          origem: 'CSV'
        })
      }

      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar CSV do Banco do Nordeste'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  return { processando, erro, processarCSV }
}
