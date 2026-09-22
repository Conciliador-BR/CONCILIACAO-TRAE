let chartPromise = null
let chartRegistered = false
let html2canvasPromise = null
let jsPdfPromise = null
let jsZipPromise = null
let excelJsPromise = null
let xlsxPromise = null

export const getChartJS = async () => {
  if (!chartPromise) {
    chartPromise = import('chart.js').then((mod) => {
      const Chart = mod.Chart || mod.default?.Chart || mod.default
      const registerables = mod.registerables || mod.default?.registerables || []

      if (Chart && !chartRegistered) {
        Chart.register(...registerables)
        chartRegistered = true
      }

      return { Chart, registerables }
    })
  }

  return chartPromise
}

export const getHtml2canvas = async () => {
  if (!html2canvasPromise) {
    html2canvasPromise = import('html2canvas').then((mod) => mod.default || mod)
  }

  return html2canvasPromise
}

export const getJsPDF = async () => {
  if (!jsPdfPromise) {
    jsPdfPromise = import('jspdf').then((mod) => mod.default || mod.jsPDF || mod)
  }

  return jsPdfPromise
}

export const getJSZip = async () => {
  if (!jsZipPromise) {
    jsZipPromise = import('jszip').then((mod) => mod.default || mod)
  }

  return jsZipPromise
}

export const getExcelJS = async () => {
  if (!excelJsPromise) {
    excelJsPromise = import('exceljs').then((mod) => mod.default || mod)
  }

  return excelJsPromise
}

export const getXLSX = async () => {
  if (!xlsxPromise) {
    xlsxPromise = import('xlsx').then((mod) => mod.default || mod)
  }

  return xlsxPromise
}
