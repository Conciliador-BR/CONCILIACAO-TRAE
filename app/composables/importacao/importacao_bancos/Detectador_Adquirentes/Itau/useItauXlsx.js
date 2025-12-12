import { ref } from 'vue'
import * as XLSX from 'xlsx'

export const useItauXlsx = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarXLSX = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const buffer = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = (e) => resolve(e.target.result)
        r.onerror = () => reject(new Error('Erro ao ler arquivo XLSX'))
        r.readAsArrayBuffer(arquivo)
      })
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
      const sheetName = wb.SheetNames[0]
      const ws = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })
      
      const transacoes = []
      let idx = 0
      
      // Print 2 mostra que cabeçalho está na linha 10 (index 9)
      // A: Data, B: Lançamento, C: Razão Social, D: CPF/CNPJ, E: Valor (R$), F: Saldo (R$)
      
      // Encontrar onde começam os dados
      let headerRowIndex = -1
      for (let i = 0; i < Math.min(20, rows.length); i++) {
        const row = rows[i]
        // Verifica se tem "Data" e "Lançamento" (ou "Lancamento")
        if (Object.values(row).some(v => String(v).includes('Data')) && 
            Object.values(row).some(v => String(v).includes('Lançamento') || String(v).includes('Lancamento'))) {
          headerRowIndex = i
          break
        }
      }
      
      if (headerRowIndex === -1) {
        // Fallback: tentar processar tudo procurando padrão de data
      }
      
      // Mapear colunas baseado no header encontrado ou assumir padrão Itaú
      // No print: Data é coluna 0, Lançamento 1, Razão 2, CNPJ 3, Valor 4, Saldo 5
      
      const dataStart = headerRowIndex + 1
      
      for (let i = dataStart; i < rows.length; i++) {
        const row = rows[i]
        const vals = Object.values(row) // Array de valores da linha
        
        // Pega valores por índice (assumindo estrutura do print)
        // XLSX.utils.sheet_to_json com header:1 retorna array de arrays, mas sem header:1 retorna objetos
        // Vamos usar header:1 para garantir ordem posicional
      }
      
      // Refazer leitura como array de arrays para garantir posição
      const rowsArray = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })
      
      // Re-encontrar header no array de arrays
      headerRowIndex = -1
      for (let i = 0; i < Math.min(20, rowsArray.length); i++) {
        const row = rowsArray[i]
        if (row.some(v => String(v).includes('Data')) && row.some(v => String(v).includes('Lançamento') || String(v).includes('Lancamento'))) {
          headerRowIndex = i
          break
        }
      }
      
      const start = headerRowIndex !== -1 ? headerRowIndex + 1 : 10
      
      for (let i = start; i < rowsArray.length; i++) {
        const row = rowsArray[i]
        if (!row || row.length === 0) continue
        
        const dataStr = String(row[0] || '').trim() // Coluna A
        const lancamento = String(row[1] || '').trim() // Coluna B
        const razao = String(row[2] || '').trim() // Coluna C
        const cnpj = String(row[3] || '').trim() // Coluna D
        const valorStr = String(row[4] || '').trim() // Coluna E
        
        // Validar data DD/MM/AAAA
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) continue
        if (lancamento === 'SALDO ANTERIOR' || lancamento.includes('SALDO TOTAL')) continue
        
        // Construir descrição completa
        let descricao = lancamento
        if (razao) descricao += ` / ${razao}`
        if (cnpj) descricao += ` / ${cnpj}`
        
        // Converter valor
        // Formato Itaú XLSX costuma ser "2.415,84" ou "-34.654,96" (vermelho no print)
        // XLSX library pode ler como número ou string dependendo da formatação
        // O print mostra cor vermelha para negativo, o texto pode ter "-"
        
        let valorNumerico = 0
        if (valorStr) {
            // Remove R$ se tiver, remove pontos de milhar, troca vírgula por ponto
            let limpo = valorStr.replace('R$', '').trim()
            
            // Verifica se é negativo (alguns xlsx usam parenteses ou sinal)
            const isNegative = limpo.includes('-') || limpo.includes('(')
            
            limpo = limpo.replace(/[^0-9,]/g, '') // Mantém apenas números e vírgula
            limpo = limpo.replace(',', '.')
            valorNumerico = parseFloat(limpo)
            
            if (isNegative) valorNumerico = -Math.abs(valorNumerico)
        }
        
        // Se a descrição indicar débito explicitamente e valor estiver positivo, corrigir?
        // No print, SISPAG FORNECEDORES está negativo (-34.654,96).
        // RECEBIMENTOS está positivo.
        // O parser deve confiar no sinal vindo do arquivo ou detectar cor (difícil via js-xlsx padrão).
        // Assumindo que o texto extraído contenha o sinal "-" se for negativo.
        
        const adquirente = identificarAdquirente(descricao)
        
        idx++
        transacoes.push({
          id: `ITAU-XLSX-${idx}`,
          data: dataStr,
          descricao,
          documento: '',
          valor: formatarMoeda(valorNumerico),
          valorNumerico,
          banco: 'Itaú',
          adquirente
        })
      }
      
      return { sucesso: true, transacoes, total: transacoes.length }
    } catch (e) {
      erro.value = e.message || 'Erro ao processar XLSX'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  const identificarAdquirente = (texto) => {
    const s = (texto || '').toUpperCase()
    const candidatos = ['ALELO', 'SIPAG', 'STONE', 'CIELO', 'REDE', 'GETNET', 'SAFRAPAY', 'MERCADOPAGO', 'PAGSEGURO', 'UNICA', 'BIN', 'TICKET', 'PLUXEE', 'VR BENEFICIOS']
    for (const c of candidatos) { if (s.includes(c)) return c }
    return ''
  }

  const formatarMoeda = (n) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  return { processando, erro, processarXLSX }
}
