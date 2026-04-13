import { ref } from 'vue'

export const useItauPdf = () => {
  const processando = ref(false)
  const erro = ref(null)

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    try {
      const linhas = await extrairLinhasPDF(arquivo)
      const transacoes = parseLinhasItau(linhas)
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
    
    // Iterar por todas as páginas
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      
      // Agrupar itens por linha (coordenada Y)
      const items = textContent.items.map(it => ({ 
        str: it.str, 
        x: it.transform[4], 
        y: it.transform[5],
        w: it.width
      }))
      
      const grupos = agruparPorY(items)
      
      // Ordenar linhas de cima para baixo
      grupos.sort((a, b) => b.y - a.y)
      
      for (const grupo of grupos) {
        // Ordenar itens da esquerda para a direita dentro da linha
        const ordenado = grupo.itens.sort((a, b) => a.x - b.x)
        
        // Juntar texto da linha com detecção de colunas
        let texto = ''
        if (ordenado.length > 0) {
          texto = ordenado[0].str
          for (let k = 1; k < ordenado.length; k++) {
            const prev = ordenado[k-1]
            const curr = ordenado[k]
            // Detectar gap entre o fim do anterior e inicio do atual
            // item.w (width) pode não estar perfeito, mas gap grande indica coluna
            // Se gap > 15 (unidade do PDF), considera nova coluna e põe separator
            const gap = curr.x - (prev.x + (prev.w || 0))
            // Se w não estiver disponível, gap será maior, então threshold alto ajuda
            // Mas 'items' mapeia w: it.width.
            
            // Threshold empírico: texto normal tem gap pequeno ou negativo (kerning)
            // Colunas tem gap visual.
            if (gap > 10) { 
              texto += ' / ' + curr.str
            } else {
              texto += ' ' + curr.str
            }
          }
        }
        texto = texto.replace(/\s+/g, ' ').trim()
        
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
    const tolerancia = 6 // Aumentado para capturar itens levemente desalinhados
    
    for (const it of items) {
      // Ignorar textos vazios
      if (!it.str.trim()) continue
      
      let grupo = grupos.find(g => Math.abs(g.y - it.y) <= tolerancia)
      if (!grupo) { 
        grupo = { y: it.y, itens: [] }
        grupos.push(grupo) 
      }
      grupo.itens.push(it)
    }
    return grupos
  }

  const parseLinhasItau = (linhas) => {
    const transacoes = []
    let anoExtrato = obterAnoExtrato(linhas)
    let idx = 0
    
    // Regex para identificar início de transação: DD/MM/AAAA
    // Ex: 03/11/2025
    const dataRegex = /^(\d{2}\/\d{2}\/\d{4})\b/
    
    // Regex para capturar valores no final da linha (com possível R$ ou saldo depois)
    // Ex: ... 2.415,84 ou ... 2.415,84 -8.036,46
    // O valor da transação geralmente é o penúltimo ou último número
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i]
      
      // Verifica se a linha começa com data
      const dataMatch = linha.match(dataRegex)
      if (!dataMatch) continue
      
      const dataCompleta = dataMatch[1] // DD/MM/AAAA
      
      // Ignorar linhas de "SALDO ANTERIOR" ou "SALDO DO DIA" se não forem transações reais
      if (linha.includes('SALDO ANTERIOR') || linha.includes('SALDO TOTAL')) continue
      
      // Tentar extrair o valor da transação
      // A estrutura é: DATA | DESCRIÇÃO | RAZÃO SOCIAL | CNPJ | VALOR | SALDO
      // Às vezes RAZÃO/CNPJ não existem.
      // O valor é um número formatado (ex: 2.415,84) que pode estar no final ou antes do saldo
      
      // Pega todos os números formatados como valor na linha
      const valoresMatch = [...linha.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})/g)]
      
      if (valoresMatch.length > 0) {
        // Se tiver mais de um valor, o último costuma ser o saldo e o penúltimo o valor da transação
        // Mas nem sempre tem saldo na linha.
        // Assumindo que o último valor da linha de transação é o valor dela (saldo costuma vir na linha seguinte ou ser ignorado na importação de fluxo)
        // No print 1, parece ter VALOR e SALDO na mesma linha para Saldo Anterior, mas para transações parece ser:
        // 03/11/2025 RECEBIMENTOS... ... 2.415,84
        
        // Vamos pegar o último valor encontrado que não seja parte de data/CNPJ
        // Mas regex acima só pega formato monetário X.XXX,XX
        
        let valorStr = valoresMatch[valoresMatch.length - 1][0]
        
        // Se houver dois valores, e o último for saldo, precisamos distinguir
        // No print: Valor (R$) Saldo (R$)
        // Ex linha 1: ... 2.415,84 (não mostra saldo)
        // Ex linha Saldo Anterior: ... -8.036,46
        
        // Vamos assumir o último match monetário como o valor da transação
        
        // Construir descrição removendo data e valor
        let descricao = linha
          .replace(dataCompleta, '')
          .replace(valorStr, '')
          .trim()
          
        // Tentar identificar se é débito ou crédito
        // No Itaú PDF, valores negativos costumam ter um "-" na frente ou ser indicados por coluna (D/C) que o PDF text extract perde
        // No print, valores parecem verdes (crédito) e vermelhos (débito com -).
        // Se tiver sinal de menos colado ou próximo ao valor
        const valorComSinalRegex = new RegExp(`(-?\\s*${valorStr.replace('.', '\\.').replace(',', '\\,')})`)
        const sinalMatch = linha.match(valorComSinalRegex)
        let isDebito = false
        if (sinalMatch && sinalMatch[1].includes('-')) {
          isDebito = true
        }
        
        // Ajuste fino: se a descrição contiver palavras chave de débito
        if (descricao.includes('PAGAMENTO') || descricao.includes('TARIFA') || descricao.includes('IOF') || descricao.includes('SISPAG') || descricao.includes('DEBITO')) {
           // Nem sempre garantido, melhor confiar no sinal se houver
        }
        
        // Converter valor
        let valorNumerico = valorParaNumero(valorStr)
        if (isDebito) valorNumerico = -Math.abs(valorNumerico)
        
        // Tentar detectar se o PDF extraiu o sinal de menos "solto" antes do número
        // Ex: ... SIS PAG - 34.654,96
        if (linha.match(new RegExp(`-\\s*${valorStr.replace('.', '\\.')}`))) {
            valorNumerico = -Math.abs(valorNumerico)
        }
        
        // Detectar adquirente
        const adquirente = identificarAdquirente(descricao)
        
        // Extrair documento (CNPJ/CPF) da descrição se houver
        // Formato comum no Itaú PDF: "LANÇAMENTO / RAZÃO / CNPJ"
        // Ou o CNPJ pode estar "solto" na descrição
        let documento = ''
        const partesDescricao = descricao.split(' / ')
        const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}/
        
        // Tentar encontrar CNPJ nas partes separadas
        for (let i = 0; i < partesDescricao.length; i++) {
          const parte = partesDescricao[i].trim()
          if (cnpjRegex.test(parte)) {
            // Se encontrou, move para documento e remove da descrição
            const match = parte.match(cnpjRegex)
            if (match) {
              documento = match[0]
              // Se a parte for APENAS o CNPJ, remove a parte toda
              // Se tiver texto junto, remove só o CNPJ? Melhor remover a parte se for majoritariamente CNPJ
              if (parte.replace(cnpjRegex, '').trim().length < 5) {
                partesDescricao.splice(i, 1)
                i-- // Ajustar índice
              } else {
                partesDescricao[i] = parte.replace(match[0], '').trim()
              }
            }
          }
        }
        
        // Reconstruir descrição limpa
        descricao = partesDescricao.filter(Boolean).join(' / ')
        
        // Se a descrição ficou vazia, tentar buscar na linha seguinte (se não tiver data)
        if (!descricao && i + 1 < linhas.length) {
          const proximaLinha = linhas[i + 1]
          if (!proximaLinha.match(dataRegex)) {
             // Se a próxima linha não é uma nova transação, assume que é a descrição desta
             descricao = proximaLinha.trim()
             // Opcional: remover partes que pareçam lixo da próxima linha se necessário
          }
        }
        
        idx++
        transacoes.push({
          id: `ITAU-PDF-${idx}`,
          data: dataCompleta, // Já está em DD/MM/AAAA
          descricao: descricao,
          documento: documento, // Agora contém o CNPJ/CPF extraído
          valor: formatarMoeda(valorNumerico),
          valorNumerico: valorNumerico,
          banco: 'Itaú',
          adquirente
        })
      }
    }
    
    return transacoes
  }

  const obterAnoExtrato = (linhas) => {
    // Tenta achar ano no cabeçalho ou na primeira data
    for (const l of linhas) {
      const m = l.match(/(\d{2}\/\d{2}\/\d{4})/)
      if (m) return m[1].split('/')[2]
    }
    return new Date().getFullYear().toString()
  }

  const valorParaNumero = (v) => {
    const num = v.replace(/\./g, '').replace(',', '.')
    return parseFloat(num) || 0
  }

  const identificarAdquirente = (texto) => {
    const s = (texto || '').toUpperCase()
    const candidatos = ['ALELO', 'SIPAG', 'STONE', 'CIELO', 'REDE', 'GETNET', 'SAFRAPAY', 'MERCADOPAGO', 'PAGSEGURO', 'UNICA', 'BIN', 'TICKET', 'PLUXEE', 'VR BENEFICIOS', 'SODEXO']
    for (const c of candidatos) { if (s.includes(c)) return c }
    return ''
  }

  const formatarMoeda = (n) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
  }

  return { processando, erro, processarPDF }
}
