import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import JSZip from 'jszip'
import { getBodyLayoutClass, normalizarParaArquivo } from '~/components/controladoria/exportacao_pdf/shared/pdfExportUtils'

const A4_WIDTH_PT = 595.28
const A4_HEIGHT_PT = 841.89

const criarCabecalhoNoClone = (target, logoSrc) => {
  const header = target.ownerDocument.createElement('div')
  header.className = 'pdf-print-header'

  const top = target.ownerDocument.createElement('div')
  top.className = 'pdf-print-header-top'

  const img = target.ownerDocument.createElement('img')
  img.className = 'pdf-print-logo'
  img.alt = 'Economic Card'
  img.src = logoSrc
  img.decoding = 'sync'
  img.loading = 'eager'

  top.appendChild(img)
  header.appendChild(top)

  const divider = target.ownerDocument.createElement('div')
  divider.className = 'pdf-print-divider'
  header.appendChild(divider)

  target.prepend(header)
}

const criarCanvasPagina = (sourceCanvas, offsetY, sliceHeight) => {
  const pageCanvas = document.createElement('canvas')
  pageCanvas.width = sourceCanvas.width
  pageCanvas.height = sliceHeight

  const context = pageCanvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
  context.drawImage(
    sourceCanvas,
    0,
    offsetY,
    sourceCanvas.width,
    sliceHeight,
    0,
    0,
    pageCanvas.width,
    pageCanvas.height
  )

  return pageCanvas
}

export const capturarTargetParaCanvas = async ({ target, option, logoSrc }) => {
  const previousScrollX = window.scrollX || window.pageXOffset || 0
  const previousScrollY = window.scrollY || window.pageYOffset || 0

  window.scrollTo(0, 0)

  try {
    return await html2canvas(target, {
      backgroundColor: '#ffffff',
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 0,
      onclone: (clonedDocument) => {
        clonedDocument.body.classList.add('printing-controladoria-pdf', getBodyLayoutClass(option.layout))
        clonedDocument.documentElement.style.background = '#ffffff'
        clonedDocument.body.style.background = '#ffffff'
        clonedDocument.body.style.margin = '0'
        clonedDocument.body.style.padding = '0'

        const clonedTarget = clonedDocument.getElementById(option.targetId)
        if (!clonedTarget) return

        clonedTarget.setAttribute('data-print-target', 'true')
        clonedTarget.style.background = '#ffffff'
        clonedTarget.style.opacity = '1'
        clonedTarget.style.filter = 'none'
        clonedTarget.style.backdropFilter = 'none'
        criarCabecalhoNoClone(clonedTarget, logoSrc)

        const elementosDecorativos = clonedTarget.querySelectorAll('.pointer-events-none.absolute')
        elementosDecorativos.forEach((elemento) => {
          elemento.style.display = 'none'
        })

        const todosElementos = clonedTarget.querySelectorAll('*')
        todosElementos.forEach((elemento) => {
          elemento.style.backdropFilter = 'none'
          elemento.style.filter = 'none'
          elemento.style.textShadow = 'none'

          const classes = String(elemento.className || '')
          if (
            classes.includes('shadow') ||
            classes.includes('blur') ||
            classes.includes('backdrop-blur')
          ) {
            elemento.style.boxShadow = 'none'
          }
        })
      }
    })
  } finally {
    window.scrollTo(previousScrollX, previousScrollY)
  }
}

export const canvasParaPdfBlob = async ({ canvas, fileName, orientation = 'portrait' }) => {
  const isLandscape = orientation === 'landscape'
  const pageWidthPt = isLandscape ? A4_HEIGHT_PT : A4_WIDTH_PT
  const pageHeightPt = isLandscape ? A4_WIDTH_PT : A4_HEIGHT_PT

  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
    compress: true
  })

  const pageHeightInPixels = Math.floor((canvas.width * pageHeightPt) / pageWidthPt)
  let offsetY = 0
  let pageIndex = 0

  while (offsetY < canvas.height) {
    const sliceHeight = Math.min(pageHeightInPixels, canvas.height - offsetY)
    const pageCanvas = criarCanvasPagina(canvas, offsetY, sliceHeight)
    const imageData = pageCanvas.toDataURL('image/png')
    const renderedHeight = (sliceHeight * pageWidthPt) / canvas.width

    if (pageIndex > 0) {
      pdf.addPage()
    }

    pdf.addImage(imageData, 'PNG', 0, 0, pageWidthPt, renderedHeight, `${fileName}-${pageIndex}`, 'FAST')

    offsetY += sliceHeight
    pageIndex += 1
  }

  return pdf.output('blob')
}

export const gerarPdfBlobDaPage = async ({ target, option, logoSrc, fileName }) => {
  const canvas = await capturarTargetParaCanvas({ target, option, logoSrc })
  return canvasParaPdfBlob({
    canvas,
    fileName,
    orientation: option?.orientation || 'portrait'
  })
}

export const criarDownloadUrl = (blob) => {
  return URL.createObjectURL(blob)
}

export const revogarDownloadUrl = (url) => {
  if (!url) return
  URL.revokeObjectURL(url)
}

export const baixarBlob = ({ blob, fileName }) => {
  const url = criarDownloadUrl(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()

  setTimeout(() => {
    revogarDownloadUrl(url)
  }, 2000)
}

export const gerarArquivoCompactado = async ({ files, nomeEmpresa }) => {
  const zip = new JSZip()

  files.forEach((file) => {
    zip.file(file.fileName, file.blob)
  })

  const bundleName = `Exportacao_PDF_${normalizarParaArquivo(nomeEmpresa)}.zip`
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })

  return {
    blob,
    fileName: bundleName
  }
}
