import { ref } from 'vue'
import { useBancoDoBrasilOfx } from './Detectador_Adquirentes/Banco_do_Brasil/useBancoDoBrasilOfx'
import { useBancoDoBrasilPdf } from './Detectador_Adquirentes/Banco_do_Brasil/useBancoDoBrasilPdf'
import { useBancoDoBrasilXlsx } from './Detectador_Adquirentes/Banco_do_Brasil/useBancoDoBrasilXlsx'

export const useBanco_do_brasil = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])

  const ofx = useBancoDoBrasilOfx()
  const pdf = useBancoDoBrasilPdf()
  const xlsx = useBancoDoBrasilXlsx()

  const processarOFX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []
    try {
      const r = await ofx.processarOFX(arquivo)
      if (r.sucesso) { transacoes.value = r.transacoes }
      return r
    } catch (e) {
      erro.value = e.message || 'Erro ao processar OFX'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  const processarPDF = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []
    try {
      const r = await pdf.processarPDF(arquivo)
      if (r.sucesso) { transacoes.value = r.transacoes }
      return r
    } catch (e) {
      erro.value = e.message || 'Erro ao processar PDF'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  const processarXLSX = async (arquivo) => {
    processando.value = true
    erro.value = null
    transacoes.value = []
    try {
      const r = await xlsx.processarXLSX(arquivo)
      if (r.sucesso) { transacoes.value = r.transacoes }
      return r
    } catch (e) {
      erro.value = e.message || 'Erro ao processar XLSX'
      return { sucesso: false, erro: erro.value }
    } finally {
      processando.value = false
    }
  }

  return { processando, erro, transacoes, processarOFX, processarPDF, processarXLSX }
}
