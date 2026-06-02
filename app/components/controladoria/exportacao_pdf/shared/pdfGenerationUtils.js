import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import JSZip from 'jszip'
import { getBodyLayoutClass, normalizarParaArquivo } from '~/components/controladoria/exportacao_pdf/shared/pdfExportUtils'

const A4_WIDTH_PT = 595.28
const A4_HEIGHT_PT = 841.89

const aplicarEstilosImportantes = (elemento, estilos) => {
  Object.entries(estilos).forEach(([propriedade, valor]) => {
    elemento.style.setProperty(propriedade, valor, 'important')
  })
}

const aguardarImagemPronta = async (img) => {
  if (!img) return

  if (img.complete && img.naturalWidth > 0) {
    if (typeof img.decode === 'function') {
      try {
        await img.decode()
      } catch (_) {}
    }
    return
  }

  await new Promise((resolve) => {
    let finalizado = false

    const encerrar = () => {
      if (finalizado) return
      finalizado = true
      img.removeEventListener('load', encerrar)
      img.removeEventListener('error', encerrar)
      resolve()
    }

    img.addEventListener('load', encerrar, { once: true })
    img.addEventListener('error', encerrar, { once: true })
    setTimeout(encerrar, 1500)
  })
}

const criarCabecalhoNoClone = (target, logoSrc, option) => {
  const header = target.ownerDocument.createElement('div')
  header.className = 'pdf-print-header'
  aplicarEstilosImportantes(header, {
    display: 'block',
    'margin-bottom': '14px',
    'border-radius': '10px',
    overflow: 'hidden',
    'box-shadow': '0 1px 2px rgba(0, 0, 0, 0.08)',
    background: '#ffffff'
  })

  const top = target.ownerDocument.createElement('div')
  top.className = 'pdf-print-header-top'
  aplicarEstilosImportantes(top, {
    background: 'linear-gradient(90deg, #102a43 0%, #163a5a 50%, #1f4f77 100%)',
    display: 'flex',
    'justify-content': 'center',
    'align-items': 'center',
    padding: '12px 10px',
    'min-height': '92px'
  })

  const img = target.ownerDocument.createElement('img')
  img.className = 'pdf-print-logo'
  img.alt = 'Economic Card'
  img.src = logoSrc
  img.decoding = 'sync'
  img.loading = 'eager'
  aplicarEstilosImportantes(img, {
    width: '260px',
    'max-width': '85%',
    height: 'auto',
    'object-fit': 'contain',
    display: 'block'
  })

  top.appendChild(img)
  header.appendChild(top)

  const divider = target.ownerDocument.createElement('div')
  divider.className = 'pdf-print-divider'
  aplicarEstilosImportantes(divider, {
    height: '4px',
    background: 'linear-gradient(90deg, #73c77d 0%, #7ece89 50%, #8ad795 100%)'
  })
  header.appendChild(divider)

  if (option?.layout === 'analise') {
    aplicarEstilosImportantes(header, {
      'margin-bottom': '8px',
      'border-radius': '0'
    })
    aplicarEstilosImportantes(top, {
      'min-height': '80px',
      padding: '8px'
    })
    aplicarEstilosImportantes(img, {
      width: '230px',
      'max-width': '92%'
    })
  }

  target.prepend(header)

  return img
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

const removerColunasDeAcaoDoClone = (clonedTarget) => {
  const marcados = clonedTarget.querySelectorAll('.col-acoes-pdf')
  marcados.forEach((elemento) => {
    elemento.remove()
  })

  const tabelas = clonedTarget.querySelectorAll('table')
  tabelas.forEach((tabela) => {
    const headerRows = tabela.querySelectorAll('thead tr')
    headerRows.forEach((row) => {
      const headers = Array.from(row.children)
      const indicesParaRemover = headers
        .map((cell, index) => ({ cell, index }))
        .filter(({ cell }) => {
          const texto = String(cell.textContent || '').trim().toUpperCase()
          return texto === 'ACAO' || texto === 'AÇÃO' || texto === 'ADICIONAR LINHA'
        })
        .map(({ index }) => index)
        .sort((a, b) => b - a)

      if (!indicesParaRemover.length) return

      indicesParaRemover.forEach((index) => {
        row.children[index]?.remove()
      })

      tabela.querySelectorAll('tbody tr, tfoot tr').forEach((bodyRow) => {
        indicesParaRemover.forEach((index) => {
          bodyRow.children[index]?.remove()
        })
      })
    })
  })
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
      onclone: async (clonedDocument) => {
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
        const logoImg = criarCabecalhoNoClone(clonedTarget, logoSrc, option)
        removerColunasDeAcaoDoClone(clonedTarget)

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

        await aguardarImagemPronta(logoImg)
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
