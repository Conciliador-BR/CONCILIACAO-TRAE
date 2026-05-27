import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { useSicrediPdf } from './Detectador_Adquirentes/Sicredi/useSicrediPdf'

export const useSicredi = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])
  const { processarPDF } = useSicrediPdf()

  const normalizar = (valor) => {
    return String(valor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim()
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(valor || 0))
  }

  const normalizarData = (valor) => {
    if (valor === null || valor === undefined || valor === '') return ''

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      const partes = XLSX.SSF.format('dd/mm/yyyy', valor)
      return /^\d{2}\/\d{2}\/\d{4}$/.test(partes) ? partes : ''
    }

    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
      const dia = String(valor.getDate()).padStart(2, '0')
      const mes = String(valor.getMonth() + 1).padStart(2, '0')
      const ano = valor.getFullYear()
      return `${dia}/${mes}/${ano}`
    }

    const texto = String(valor).trim()
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) return texto
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
      const [ano, mes, dia] = texto.split('-')
      return `${dia}/${mes}/${ano}`
    }
    return ''
  }

  const valorParaNumero = (valor) => {
    if (valor === null || valor === undefined || valor === '') return 0
    if (typeof valor === 'number' && Number.isFinite(valor)) return Number(valor)

    const textoOriginal = String(valor).trim()
    const negativo = textoOriginal.includes('-')
    const textoBase = textoOriginal
      .replace(/[R$\s]/g, '')
      .replace(/[^0-9,.-]/g, '')

    const ultimoPonto = textoBase.lastIndexOf('.')
    const ultimaVirgula = textoBase.lastIndexOf(',')
    const separadorDecimal = ultimoPonto > ultimaVirgula ? '.' : (ultimaVirgula > ultimoPonto ? ',' : '')

    let textoLimpo = textoBase

    if (separadorDecimal === '.') {
      textoLimpo = textoBase.replace(/,/g, '')
    } else if (separadorDecimal === ',') {
      textoLimpo = textoBase.replace(/\./g, '').replace(',', '.')
    } else {
      textoLimpo = textoBase.replace(/[.,]/g, '')
    }

    const numero = Number(textoLimpo)
    if (!Number.isFinite(numero)) return 0
    return negativo ? -Math.abs(numero) : numero
  }

  const encontrarCabecalho = (rows = []) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || []
      const normalizados = row.map((coluna) => normalizar(coluna))
      const idxData = normalizados.findIndex((c) => c === 'DATA')
      const idxDescricao = normalizados.findIndex((c) => c === 'DESCRICAO')
      const idxDocumento = normalizados.findIndex((c) => c === 'DOCUMENTO')
      const idxValor = normalizados.findIndex((c) => c.startsWith('VALOR'))

      if (idxData >= 0 && idxDescricao >= 0 && idxDocumento >= 0 && idxValor >= 0) {
        return {
          linhaCabecalho: i,
          indices: {
            data: idxData,
            descricao: idxDescricao,
            documento: idxDocumento,
            valor: idxValor
          }
        }
      }
    }

    return null
  }

  const processarXLSX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []

    try {
      const buffer = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = () => reject(new Error('Erro ao ler arquivo XLS do Sicredi'))
        reader.readAsArrayBuffer(arquivo)
      })

      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: true,
        defval: '',
        dateNF: 'dd/mm/yyyy'
      })

      const cabecalho = encontrarCabecalho(rows)
      if (!cabecalho) {
        throw new Error('Não foi possível localizar o cabeçalho Data / Descrição / Documento / Valor no arquivo do Sicredi')
      }

      const transacoesProcessadas = []
      let indice = 0

      for (let i = cabecalho.linhaCabecalho + 1; i < rows.length; i++) {
        const row = rows[i] || []
        const data = normalizarData(row[cabecalho.indices.data])
        const descricao = String(row[cabecalho.indices.descricao] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
        const documento = String(row[cabecalho.indices.documento] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
        const valorNumerico = valorParaNumero(row[cabecalho.indices.valor])

        if (!data || !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) continue
        if (!descricao || /^SALDO\b/i.test(descricao)) continue

        indice += 1
        transacoesProcessadas.push({
          id: documento || `SICREDI-XLS-${indice}`,
          data,
          descricao,
          documento,
          valor: formatarMoeda(valorNumerico),
          valorNumerico,
          banco: 'Sicredi',
          origem: 'XLS'
        })
      }

      transacoes.value = transacoesProcessadas

      return {
        sucesso: true,
        transacoes: transacoesProcessadas,
        total: transacoesProcessadas.length
      }
    } catch (error) {
      erro.value = error.message
      return {
        sucesso: false,
        erro: error.message
      }
    } finally {
      processando.value = false
    }
  }

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []

    try {
      const texto = await lerArquivoTexto(arquivo)
      const transacoesProcessadas = parseOFXSicredi(texto)
      transacoes.value = transacoesProcessadas
      
      return {
        sucesso: true,
        transacoes: transacoesProcessadas,
        total: transacoesProcessadas.length
      }
    } catch (error) {
      erro.value = error.message
      return {
        sucesso: false,
        erro: error.message
      }
    } finally {
      processando.value = false
    }
  }

  const lerArquivoTexto = (arquivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsText(arquivo, 'UTF-8')
    })
  }

  const parseOFXSicredi = (textoOFX) => {
    const transacoes = []
    
    try {
      const regexTransacao = /<STMTTRN>(.*?)<\/STMTTRN>/gs
      const matches = textoOFX.match(regexTransacao)
      
      if (!matches) {
        throw new Error('Nenhuma transação encontrada no arquivo OFX')
      }

      matches.forEach((match, index) => {
        try {
          const transacao = parseTransacaoOFX(match, index + 1)
          if (transacao) {
            transacoes.push(transacao)
          }
        } catch (error) {
          console.warn(`Erro ao processar transação ${index + 1}:`, error)
        }
      })

      return transacoes
    } catch (error) {
      throw new Error(`Erro ao processar OFX do Sicredi: ${error.message}`)
    }
  }

  const parseTransacaoOFX = (textoTransacao, indice) => {
    const extrairCampo = (campo) => {
      const regex = new RegExp(`<${campo}>(.*?)</${campo}>`, 'i')
      const match = textoTransacao.match(regex)
      return match ? match[1].trim() : ''
    }

    const data = extrairCampo('DTPOSTED')
    const valor = extrairCampo('TRNAMT')
    const descricao = extrairCampo('MEMO') || extrairCampo('NAME') || 'Sem descrição'
    const documento = extrairCampo('FITID') || extrairCampo('REFNUM') || `SICREDI-${indice}`

    let dataFormatada = ''
    if (data && data.length >= 8) {
      const ano = data.substring(0, 4)
      const mes = data.substring(4, 6)
      const dia = data.substring(6, 8)
      dataFormatada = `${dia}/${mes}/${ano}`
    }

    const valorNumerico = parseFloat(valor) || 0
    const valorFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valorNumerico)

    return {
      id: documento,
      data: dataFormatada,
      descricao: descricao,
      documento: documento,
      valor: valorFormatado,
      valorNumerico: valorNumerico,
      banco: 'Sicredi'
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarOFX,
    processarPDF,
    processarXLSX
  }
}
