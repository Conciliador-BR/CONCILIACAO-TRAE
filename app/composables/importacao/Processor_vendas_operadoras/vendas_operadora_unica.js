import * as XLSX from 'xlsx'
import { useEmpresas } from '../../useEmpresas'

export const useVendasOperadoraUnica = () => {
  const { getValorMatrizPorEmpresa, fetchEmpresas, empresas } = useEmpresas()
  
  const processarArquivoComPython = async (arquivo, operadora, nomeEmpresa = '') => {
    try {
      if (!arquivo) throw new Error('Nenhum arquivo recebido.')
      const dados = await lerArquivo(arquivo)
      if ((operadora || '').toLowerCase() !== 'unica') {
        throw new Error(`Operadora '${operadora}' não suportada por este processador.`)
      }

      // Garantir que as empresas estejam carregadas
      if (!empresas.value || empresas.value.length === 0) {
        await fetchEmpresas()
      }
      
      const resultado = processarDados(dados, nomeEmpresa, operadora)
      return {
        sucesso: true,
        registros: resultado.dados,
        total: resultado.total,
        erros: resultado.erros
      }
    } catch (error) {
      return {
        sucesso: false,
        erro: error.message,
        registros: [],
        total: 0,
        erros: [error.message]
      }
    }
  }

  const processarDados = (dados, nomeEmpresa, operadora) => {
    const erros = []
    const out = []

    if (!Array.isArray(dados) || dados.length === 0) {
      return { dados: [], total: 0, erros: ['Arquivo vazio.'] }
    }

    const { idx: headerRowIdx, headersRaw, headersNorm } = detectarLinhaCabecalho(dados)
    if (!headersNorm || headersNorm.length === 0) {
      return { dados: [], total: 0, erros: ['Cabeçalhos não encontrados.'] }
    }

    // ALIASES POR COLUNA (todas já normalizadas)
    const ALIASES = {
      data_venda: [
        'DATA VENDA','DATA DA VENDA','DATA','DATA MOVIMENTO','DATA DO MOVIMENTO'
      ],
      modalidade: [
        'MODALIDADE','FORMA DE PAGAMENTO','FORMA PAGAMENTO','PRODUTO'
      ],
      nsu: [
        'NSU','N S U'
      ],
      valor_bruto: [
        'VALOR DA VENDA','VALOR VENDA','VALOR BRUTO','VALOR DA VENDA BRUTA','VALOR BRUTO DA VENDA'
      ],
      valor_liquido: [
        'VALOR A RECEBER','VALOR LIQUIDO','VALOR LÍQUIDO','VALOR LIQUIDO A RECEBER'
      ],
      taxa_mdr: [
        'VALOR DA TAXA','VALOR TAXA','TAXA','TAXA MDR','VALOR DA TAXA MDR','VALOR TAXA MDR'
      ],
      despesa_mdr: [
        'VALOR DO DESCONTO','DESCONTO','DESPESA MDR','TARIFA MDR','VALOR DA DESPESA','DESCONTO MDR'
      ],
      numero_parcelas: [
        'NUMERO PARCELAS','NÚMERO PARCELAS','PARCELAS','QTD PARCELAS','QUANTIDADE PARCELAS'
      ],
      bandeira: [
        'BANDEIRA','BANDEIRAS'
      ],
      valor_antecipacao: [
        'VALOR ANTECIPADO','ANTECIPADO','VALOR DA ANTECIPACAO','VALOR DA ANTECIPAÇÃO'
      ]
    }

    // monta índice -> campo Supabase
    const colIndexParaCampo = {}
    Object.entries(ALIASES).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(headersNorm, aliases.map(normalizar))
      if (idx >= 0) colIndexParaCampo[idx] = campoDb
    })

    // sanity check: pelo menos uma das colunas-chave deve existir
    const chavesMin = ['valor_bruto','valor_liquido','nsu']
    const temAlgumaChave = chavesMin.some(k => Object.values(colIndexParaCampo).includes(k))
    if (!temAlgumaChave) {
      return { dados: [], total: 0, erros: ['Nenhuma coluna essencial foi mapeada a partir dos cabeçalhos.'] }
    }

    // processa a partir da linha seguinte ao cabeçalho
    for (let i = headerRowIdx + 1; i < dados.length; i++) {
      const linha = dados[i]
      if (!linha || linha.length === 0 || linha.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) {
        continue
      }

      try {
        const r = {
          data_venda: null,
          modalidade: '',
          nsu: '',
          valor_bruto: 0.0,
          valor_liquido: 0.0,
          taxa_mdr: 0.0,
          despesa_mdr: 0.0,
          numero_parcelas: 0,
          bandeira: '',
          valor_antecipacao: 0.0
        }

        for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
          const idx = Number(idxStr)
          const valor = linha[idx]

          switch (campoDb) {
            case 'data_venda': r.data_venda = formatarData(valor); break
            case 'valor_bruto':
            case 'valor_liquido':
            case 'taxa_mdr':
            case 'despesa_mdr':
            case 'valor_antecipacao':
              r[campoDb] = formatarValor(valor); break
            case 'numero_parcelas':
              r.numero_parcelas = formatarInteiro(valor); break
            case 'modalidade':
            case 'bandeira':
              r[campoDb] = valor != null ? String(valor).trim() : ''; break
            case 'nsu':
              r.nsu = valor != null ? String(valor).trim() : ''; break
            default: break
          }
        }

        // fórmulas solicitadas (sem clamps):
        // despesa_antecipacao = valor_liquido - valor_antecipacao
        // valor_liquido_antecipacao = valor_liquido - despesa_antecipacao
        const despesa_antecipacao = (r.valor_liquido || 0) - (r.valor_antecipacao || 0)
        const valor_liquido_antecipacao = (r.valor_liquido || 0) - despesa_antecipacao

        r.despesa_antecipacao = despesa_antecipacao
        r.valor_liquido_antecipacao = valor_liquido_antecipacao

        // Removido: esses campos não existem na tabela
        // r.operadora = 'unica'
        // r.created_at = new Date().toISOString()

        // Adiciona lógica para determinar o valor da matriz baseado na empresa selecionada
        if (nomeEmpresa) {
          r.empresa = nomeEmpresa
          r.matriz = getValorMatrizPorEmpresa(nomeEmpresa)
        } else {
          r.empresa = ''
          r.matriz = ''
        }

        // Adiciona o campo adquirente baseado na operadora selecionada
        if (operadora) {
          r.adquirente = operadora.toUpperCase() === 'UNICA' ? 'UNICA' : operadora.toUpperCase()
        } else {
          r.adquirente = 'UNICA' // valor padrão
        }
        // validade mínima do registro
        const valido = (r.valor_bruto !== 0) || (r.valor_liquido !== 0) || (r.nsu && r.nsu.length > 0)
        if (valido) out.push(r)
      } catch (e) {
        erros.push(`Linha ${i + 1}: ${e?.message || String(e)}`)
      }
    }

    return { dados: out, total: out.length, erros }
  }

  const lerArquivo = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true })
        resolve(jsonData)
      } catch (err) { reject(err) }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })

  // ───────────────────────────────── helpers ───────────────────────────────────
  const normalizar = (s) => {
    if (s == null) return ''
    return s
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // acentos
      .replace(/\s+/g, ' ')            // espaços repetidos
      .trim()
      .toUpperCase()
  }

  const formatarData = (valor) => {
    if (valor === undefined || valor === null || valor === '') return null
    try {
      if (typeof valor === 'number') {
        const d = XLSX.SSF.parse_date_code(valor)
        if (d) {
          const yyyy = String(d.y).padStart(4, '0')
          const mm = String(d.m).padStart(2, '0')
          const dd = String(d.d).padStart(2, '0')
          return `${yyyy}-${mm}-${dd}`
        }
      }
      if (valor instanceof Date) return valor.toISOString().split('T')[0]
      const s = String(valor).trim()
      const ddmmyyyy = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
      const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/
      if (ddmmyyyy.test(s)) {
        const [, d, m, y] = s.match(ddmmyyyy)
        return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
      }
      if (yyyymmdd.test(s)) return s
      return s // fallback
    } catch {
      return null
    }
  }

  const formatarValor = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0.0
    try {
      if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0.0
      // trata formatos BR: "R$ 1.234,56", negativos com "-", "%", NBSP, etc.
      const limpo = String(valor)
        .replace(/\u00A0/g, ' ')
        .replace(/\s/g, '')
        .replace(/R\$/gi, '')
        .replace(/%/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
      const n = parseFloat(limpo)
      return Number.isFinite(n) ? n : 0.0
    } catch {
      return 0.0
    }
  }

  const formatarInteiro = (valor) => {
    if (valor === undefined || valor === null || valor === '') return 0
    try {
      if (typeof valor === 'number') return Math.trunc(valor)
      const limpo = String(valor).match(/-?\d+/)?.[0] ?? '0'
      const n = parseInt(limpo, 10)
      return Number.isFinite(n) ? n : 0
    } catch {
      return 0
    }
  }

  // encontra a linha de cabeçalho nas primeiras N linhas
  const detectarLinhaCabecalho = (matriz, maxLinhas=15) => {
    const candidatos = [
      'DATA VENDA','VALOR DA VENDA','VALOR A RECEBER','VALOR DA TAXA','VALOR DO DESCONTO','BANDEIRA','NSU'
    ]
    for (let i = 0; i < Math.min(maxLinhas, matriz.length); i++) {
      const row = matriz[i] || []
      const norm = row.map(normalizar)
      const hits = candidatos.filter(c => norm.includes(c)).length
      if (hits >= 3) return { idx: i, headersRaw: row, headersNorm: norm }
    }
    // fallback: linha 8 (padrão da Única)
    const i = 7
    const row = matriz[i] || []
    return { idx: i, headersRaw: row, headersNorm: row.map(normalizar) }
  }

  // busca índice pelo conjunto de aliases (igualdade ou "includes" se nada bater)
  const findIndexByAliases = (headersNorm, aliases) => {
    for (const a of aliases) {
      const idx = headersNorm.indexOf(a)
      if (idx >= 0) return idx
    }
    // fallback suave: tenta contains
    for (const a of aliases) {
      const idx = headersNorm.findIndex(h => h.includes(a))
      if (idx >= 0) return idx
    }
    return -1
  }

  // ───────────────────────────────── principal ──────────────────────────────────
  const processarVendasUnica = (dados) => {
    const erros = []
    const out = []

    if (!Array.isArray(dados) || dados.length === 0) {
      return { dados: [], total: 0, erros: ['Arquivo vazio.'] }
    }

    const { idx: headerRowIdx, headersRaw, headersNorm } = detectarLinhaCabecalho(dados)
    if (!headersNorm || headersNorm.length === 0) {
      return { dados: [], total: 0, erros: ['Cabeçalhos não encontrados.'] }
    }

    // ALIASES POR COLUNA (todas já normalizadas)
    const ALIASES = {
      data_venda: [
        'DATA VENDA','DATA DA VENDA','DATA','DATA MOVIMENTO','DATA DO MOVIMENTO'
      ],
      modalidade: [
        'MODALIDADE','FORMA DE PAGAMENTO','FORMA PAGAMENTO','PRODUTO'
      ],
      nsu: [
        'NSU','N S U'
      ],
      valor_bruto: [
        'VALOR DA VENDA','VALOR VENDA','VALOR BRUTO','VALOR DA VENDA BRUTA','VALOR BRUTO DA VENDA'
      ],
      valor_liquido: [
        'VALOR A RECEBER','VALOR LIQUIDO','VALOR LÍQUIDO','VALOR LIQUIDO A RECEBER'
      ],
      taxa_mdr: [
        'VALOR DA TAXA','VALOR TAXA','TAXA','TAXA MDR','VALOR DA TAXA MDR','VALOR TAXA MDR'
      ],
      despesa_mdr: [
        'VALOR DO DESCONTO','DESCONTO','DESPESA MDR','TARIFA MDR','VALOR DA DESPESA','DESCONTO MDR'
      ],
      numero_parcelas: [
        'NUMERO PARCELAS','NÚMERO PARCELAS','PARCELAS','QTD PARCELAS','QUANTIDADE PARCELAS'
      ],
      bandeira: [
        'BANDEIRA','BANDEIRAS'
      ],
      valor_antecipacao: [
        'VALOR ANTECIPADO','ANTECIPADO','VALOR DA ANTECIPACAO','VALOR DA ANTECIPAÇÃO'
      ]
    }

    // monta índice -> campo Supabase
    const colIndexParaCampo = {}
    Object.entries(ALIASES).forEach(([campoDb, aliases]) => {
      const idx = findIndexByAliases(headersNorm, aliases.map(normalizar))
      if (idx >= 0) colIndexParaCampo[idx] = campoDb
    })

    // sanity check: pelo menos uma das colunas-chave deve existir
    const chavesMin = ['valor_bruto','valor_liquido','nsu']
    const temAlgumaChave = chavesMin.some(k => Object.values(colIndexParaCampo).includes(k))
    if (!temAlgumaChave) {
      return { dados: [], total: 0, erros: ['Nenhuma coluna essencial foi mapeada a partir dos cabeçalhos.'] }
    }

    // processa a partir da linha seguinte ao cabeçalho
    for (let i = headerRowIdx + 1; i < dados.length; i++) {
      const linha = dados[i]
      if (!linha || linha.length === 0 || linha.every(c => c === undefined || c === null || (typeof c === 'string' && c.trim() === ''))) {
        continue
      }

      try {
        const r = {
          data_venda: null,
          modalidade: '',
          nsu: '',
          valor_bruto: 0.0,
          valor_liquido: 0.0,
          taxa_mdr: 0.0,
          despesa_mdr: 0.0,
          numero_parcelas: 0,
          bandeira: '',
          valor_antecipacao: 0.0,
          matriz: '' // ✅ Adiciona o campo matriz
        }

        for (const [idxStr, campoDb] of Object.entries(colIndexParaCampo)) {
          const idx = Number(idxStr)
          const valor = linha[idx]

          switch (campoDb) {
            case 'data_venda': r.data_venda = formatarData(valor); break
            case 'valor_bruto':
            case 'valor_liquido':
            case 'taxa_mdr':
            case 'despesa_mdr':
            case 'valor_antecipacao':
              r[campoDb] = formatarValor(valor); break
            case 'numero_parcelas':
              r.numero_parcelas = formatarInteiro(valor); break
            case 'modalidade':
            case 'bandeira':
              r[campoDb] = valor != null ? String(valor).trim() : ''; break
            case 'nsu':
              r.nsu = valor != null ? String(valor).trim() : ''; break
            default: break
          }
        }

        // fórmulas solicitadas (sem clamps):
        // despesa_antecipacao = valor_liquido - valor_antecipacao
        // valor_liquido_antecipacao = valor_liquido - despesa_antecipacao
        const despesa_antecipacao = (r.valor_liquido || 0) - (r.valor_antecipacao || 0)
        const valor_liquido_antecipacao = (r.valor_liquido || 0) - despesa_antecipacao

        r.despesa_antecipacao = despesa_antecipacao
        r.valor_liquido_antecipacao = valor_liquido_antecipacao

        // Removido: esses campos não existem na tabela
        // r.operadora = 'unica'
        // r.created_at = new Date().toISOString()

        // Adiciona lógica para determinar o valor da matriz baseado na empresa selecionada
        // Assumindo que a empresa selecionada está disponível globalmente
        const empresaSelecionada = globalThis.empresaSelecionada || ''
        if (empresaSelecionada) {
          r.matriz = getValorMatrizPorEmpresa(empresaSelecionada)
        }

        // validade mínima do registro
        const valido = (r.valor_bruto !== 0) || (r.valor_liquido !== 0) || (r.nsu && r.nsu.length > 0)
        if (valido) out.push(r)
      } catch (e) {
        erros.push(`Linha ${i + 1}: ${e?.message || String(e)}`)
      }
    }

    return { dados: out, total: out.length, erros }
  }

  return { processarArquivoComPython }
}
