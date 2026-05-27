import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { useSantanderOfx } from './Detectador_Adquirentes/Santander/useSantanderOfx'
import { useSantanderPdf } from './Detectador_Adquirentes/Santander/useSantanderPdf'

export const useSantander = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])
  const ofx = useSantanderOfx()
  const pdf = useSantanderPdf()

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
      const texto = XLSX.SSF.format('dd/mm/yyyy', valor)
      return /^\d{2}\/\d{2}\/\d{4}$/.test(texto) ? texto : ''
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
    if (typeof valor === 'number') return Number(valor)

    const textoOriginal = String(valor).trim()
    const negativo = textoOriginal.includes('-')
    const textoLimpo = textoOriginal
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '')

    const numero = Number(textoLimpo)
    if (!Number.isFinite(numero)) return 0
    return negativo ? -Math.abs(numero) : numero
  }

  const encontrarCabecalho = (rows = []) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || []
      const normalizados = row.map((coluna) => normalizar(coluna))
      const idxData = normalizados.findIndex((c) => c === 'DATA')
      const idxHistorico = normalizados.findIndex((c) => c === 'HISTORICO')
      const idxDocumento = normalizados.findIndex((c) => c === 'DOCUMENTO')
      const idxValor = normalizados.findIndex((c) => c === 'VALOR')

      if (idxData >= 0 && idxHistorico >= 0 && idxDocumento >= 0 && idxValor >= 0) {
        return {
          linhaCabecalho: i,
          indices: {
            data: idxData,
            historico: idxHistorico,
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
        reader.onerror = () => reject(new Error('Erro ao ler arquivo XLS do Santander'))
        reader.readAsArrayBuffer(arquivo)
      })

      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        defval: '',
        dateNF: 'dd/mm/yyyy'
      })

      const cabecalho = encontrarCabecalho(rows)
      if (!cabecalho) {
        throw new Error('Não foi possível localizar o cabeçalho Data / Histórico / Documento / Valor no arquivo do Santander')
      }

      const transacoesProcessadas = []
      let indice = 0

      for (let i = cabecalho.linhaCabecalho + 1; i < rows.length; i++) {
        const row = rows[i] || []
        const data = normalizarData(row[cabecalho.indices.data])
        const descricao = String(row[cabecalho.indices.historico] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
        const documento = String(row[cabecalho.indices.documento] || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
        const valorNumerico = valorParaNumero(row[cabecalho.indices.valor])

        if (!data || !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) continue
        if (!descricao || /^SALDO\b/i.test(descricao)) continue

        indice += 1
        transacoesProcessadas.push({
          id: documento || `SANTANDER-XLS-${indice}`,
          data,
          descricao,
          documento,
          valor: formatarMoeda(valorNumerico),
          valorNumerico,
          banco: 'Santander',
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
      const resultado = await ofx.processarOFX(arquivo)
      if (resultado?.sucesso) {
        transacoes.value = resultado.transacoes || []
      } else if (resultado?.erro) {
        erro.value = resultado.erro
      }
      return resultado
    } finally {
      processando.value = false
    }
  }

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []
    try {
      const resultado = await pdf.processarPDF(arquivo)
      if (resultado?.sucesso) {
        transacoes.value = resultado.transacoes || []
      } else if (resultado?.erro) {
        erro.value = resultado.erro
      }
      return resultado
    } finally {
      processando.value = false
    }
  }

  return {
    processando,
    erro,
    transacoes,
    processarOFX,
    processarXLSX,
    processarPDF
  }
}
