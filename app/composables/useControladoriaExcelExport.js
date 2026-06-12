import { ref } from 'vue'
import { useToast } from '~/composables/useToast'

const MAX_SHEET_NAME_LENGTH = 31

const limparTexto = (valor = '') => String(valor || '').replace(/\s+/g, ' ').trim()

const normalizarNomeAba = (valor, fallback) => {
  const texto = limparTexto(valor).replace(/[\\/?*\[\]:]/g, ' ')
  return (texto || fallback).slice(0, MAX_SHEET_NAME_LENGTH)
}

const criarNomeUnico = (nomeBase, nomesUsados) => {
  let nome = nomeBase
  let contador = 2

  while (nomesUsados.has(nome)) {
    const sufixo = ` ${contador}`
    const limite = MAX_SHEET_NAME_LENGTH - sufixo.length
    nome = `${nomeBase.slice(0, limite)}${sufixo}`
    contador += 1
  }

  nomesUsados.add(nome)
  return nome
}

const obterTituloDaTabela = (root, table, index) => {
  const containerComTitulo = table.closest('[data-excel-sheet-name]')
  if (containerComTitulo) {
    return containerComTitulo.getAttribute('data-excel-sheet-name')
  }

  let atual = table.parentElement
  while (atual && atual !== root) {
    const titulo = atual.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4')
    if (titulo && limparTexto(titulo.textContent)) {
      return titulo.textContent
    }
    atual = atual.parentElement
  }

  return `Tabela ${index + 1}`
}

const obterTabelasVisiveis = (root) => {
  return Array.from(root.querySelectorAll('table')).filter((table) => {
    if (table.closest('[data-export-ignore="true"]')) return false
    return table.getClientRects().length > 0
  })
}

const gerarNomeArquivo = (base) => {
  const agora = new Date()
  const yyyy = agora.getFullYear()
  const mm = String(agora.getMonth() + 1).padStart(2, '0')
  const dd = String(agora.getDate()).padStart(2, '0')
  const hh = String(agora.getHours()).padStart(2, '0')
  const mi = String(agora.getMinutes()).padStart(2, '0')
  return `${base}-${yyyy}${mm}${dd}-${hh}${mi}.xlsx`
}

export const useControladoriaExcelExport = () => {
  const exporting = ref(false)
  const toast = useToast()

  const exportarTabelas = async ({ rootId, fileName = 'exportacao-controladoria' }) => {
    if (!process.client || exporting.value) return false

    const root = document.getElementById(rootId)
    if (!root) {
      toast.error('Nao foi possivel localizar a area para exportacao.')
      return false
    }

    const tabelas = obterTabelasVisiveis(root)
    if (tabelas.length === 0) {
      toast.warning('Nenhuma tabela visivel foi encontrada para exportar.')
      return false
    }

    exporting.value = true

    try {
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()
      const linhasConsolidadas = []

      tabelas.forEach((table, index) => {
        const titulo = limparTexto(obterTituloDaTabela(root, table, index))
        const worksheetTemporaria = XLSX.utils.table_to_sheet(table, { raw: true })
        const linhasTabela = XLSX.utils.sheet_to_json(worksheetTemporaria, {
          header: 1,
          raw: true,
          defval: ''
        })

        if (titulo) {
          linhasConsolidadas.push([titulo])
        }

        linhasTabela.forEach((linha) => {
          linhasConsolidadas.push(Array.isArray(linha) ? linha : [linha])
        })

        linhasConsolidadas.push([])
      })

      const worksheet = XLSX.utils.aoa_to_sheet(linhasConsolidadas)
      const nomesUsados = new Set()
      const nomeAba = criarNomeUnico(
        normalizarNomeAba(fileName.replace(/[-_]+/g, ' '), 'Controladoria'),
        nomesUsados
      )
      XLSX.utils.book_append_sheet(workbook, worksheet, nomeAba)

      XLSX.writeFile(workbook, gerarNomeArquivo(fileName))
      toast.success(`Excel exportado em uma planilha com ${tabelas.length} tabelas.`)
      return true
    } catch (error) {
      toast.error(error?.message || 'Erro ao exportar Excel.')
      return false
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    exportarTabelas
  }
}
