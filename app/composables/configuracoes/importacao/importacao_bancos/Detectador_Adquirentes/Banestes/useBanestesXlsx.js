import { ref } from 'vue'
import * as XLSX from 'xlsx'

export const useBanestesXlsx = () => {
  const processando = ref(false)
  const erro = ref(null)

  const normalizarData = (valor) => {
    if (!valor) return ''
    if (typeof valor === 'number') {
      const d = XLSX.SSF.parse_date_code(valor)
      if (d && d.y && d.m && d.d) {
        const dia = String(d.d).padStart(2, '0')
        const mes = String(d.m).padStart(2, '0')
        const ano = String(d.y)
        return `${dia}/${mes}/${ano}`
      }
    }
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
      const dia = String(valor.getDate()).padStart(2, '0')
      const mes = String(valor.getMonth() + 1).padStart(2, '0')
      const ano = String(valor.getFullYear())
      return `${dia}/${mes}/${ano}`
    }
    const s = String(valor).trim()
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-')
      return `${d}/${m}/${y}`
    }
    return s
  }

  const normalizarNumero = (valor) => {
    if (valor === null || valor === undefined || valor === '') return 0
    if (typeof valor === 'number') {
      return Number.isFinite(valor) ? valor : 0
    }
    const original = String(valor).trim().replace(/\s+/g, '')
    const limpo = original.replace(/[R$\u00A0]/g, '')

    const temPonto = limpo.includes('.')
    const temVirgula = limpo.includes(',')
    let normalizado = limpo

    if (temPonto && temVirgula) {
      // Usa o último separador como decimal e remove os demais.
      const ultimoPonto = limpo.lastIndexOf('.')
      const ultimaVirgula = limpo.lastIndexOf(',')
      const decimal = ultimoPonto > ultimaVirgula ? '.' : ','
      if (decimal === ',') {
        normalizado = limpo.replace(/\./g, '').replace(',', '.')
      } else {
        normalizado = limpo.replace(/,/g, '')
      }
    } else if (temVirgula) {
      normalizado = limpo.replace(',', '.')
    } else if (temPonto) {
      // Se houver apenas ponto e 3 dígitos após ele, assume milhar.
      const partes = limpo.split('.')
      if (partes.length === 2 && partes[1].length === 3) {
        normalizado = limpo.replace(/\./g, '')
      } else {
        normalizado = limpo
      }
    }

    const n = parseFloat(normalizado)
    return Number.isFinite(n) ? n : 0
  }

  const formatarMoeda = (n) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  const processarXLSX = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const buffer = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = () => reject(new Error('Erro ao ler arquivo XLSX'))
        reader.readAsArrayBuffer(arquivo)
      })

      const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      // Usa valores formatados da planilha para respeitar separador decimal exibido (pt-BR),
      // evitando casos em que o valor bruto vem 100x maior/menor no valor numérico interno.
      const rows = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        raw: false,
        defval: '',
        dateNF: 'dd/mm/yyyy'
      })

      const transacoes = []
      let idx = 0

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] || []
        const data = normalizarData(row[0])
        const lancamento = String(row[1] || '').trim()
        const complemento = String(row[2] || '').trim()
        const valorBruto = row[3]

        if (!data || !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) continue
        if (!lancamento || /^saldo/i.test(lancamento)) continue

        const valorNumerico = normalizarNumero(valorBruto)
        const descricao = `${lancamento}/${complemento}`.replace(/\/+$/, '').trim()

        idx += 1
        transacoes.push({
          id: `BANESTES-XLSX-${idx}`,
          data,
          descricao,
          documento: '0',
          valor: formatarMoeda(valorNumerico),
          valorNumerico,
          banco: 'Banestes',
          origem: 'XLSX'
        })
      }

      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar XLSX Banestes'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  return {
    processando,
    erro,
    processarXLSX
  }
}
