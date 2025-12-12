import { ref } from 'vue'
import { useItauOfx } from './Detectador_Adquirentes/Itau/useItauOfx'
import { useItauPdf } from './Detectador_Adquirentes/Itau/useItauPdf'
import { useItauXlsx } from './Detectador_Adquirentes/Itau/useItauXlsx'

export const useItau = () => {
  const processando = ref(false)
  const erro = ref(null)
  const transacoes = ref([])

  const ofx = useItauOfx()
  const pdf = useItauPdf()
  const xlsx = useItauXlsx()

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

  return { 
    processando, 
    erro, 
    transacoes, 
    processarOFX, 
    processarPDF, 
    processarXLSX 
  }
}
