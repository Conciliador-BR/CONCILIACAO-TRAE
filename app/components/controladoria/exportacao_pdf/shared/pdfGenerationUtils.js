import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import JSZip from 'jszip'
import { getBodyLayoutClass, normalizarParaArquivo } from '~/components/controladoria/exportacao_pdf/shared/pdfExportUtils'

const A4_WIDTH_PT = 595.28
const A4_HEIGHT_PT = 841.89
const PAGE_BREAK_BUFFER_PX = 10

const HOST_WIDTH_BY_LAYOUT = {
  vendas: 1480,
  recebimentos: 1180,
  analise: 1180
}

const FIRST_COLUMN_WIDTH_BY_LAYOUT = {
  vendas: '18%',
  recebimentos: '16%',
  analise: '16%'
}

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

const aguardarProximoFrame = async (quantidade = 2) => {
  for (let index = 0; index < quantidade; index += 1) {
    await new Promise(resolve => requestAnimationFrame(() => resolve()))
  }
}

const aguardarImagensDoElemento = async (elemento) => {
  const imagens = Array.from(elemento.querySelectorAll('img'))
  await Promise.all(imagens.map(img => aguardarImagemPronta(img)))
}

const aguardarCarregamentoLogo = async (img) => {
  if (!img) return
  await aguardarImagemPronta(img)
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

const obterDimensoesPaginaPt = (orientation = 'portrait') => {
  const isLandscape = orientation === 'landscape'
  return {
    pageWidthPt: isLandscape ? A4_HEIGHT_PT : A4_WIDTH_PT,
    pageHeightPt: isLandscape ? A4_WIDTH_PT : A4_HEIGHT_PT
  }
}

const calcularAlturaPaginaEmPixels = (targetWidthPx, orientation = 'portrait') => {
  const { pageWidthPt, pageHeightPt } = obterDimensoesPaginaPt(orientation)
  return (targetWidthPx * pageHeightPt) / pageWidthPt
}

const criarLinhaEspacadora = (documento, colspan, alturaPx) => {
  const spacerRow = documento.createElement('tr')
  spacerRow.className = 'pdf-page-spacer-row'

  const spacerCell = documento.createElement('td')
  spacerCell.colSpan = Math.max(1, colspan)
  aplicarEstilosImportantes(spacerCell, {
    height: `${Math.max(0, Math.ceil(alturaPx))}px`,
    padding: '0',
    margin: '0',
    border: '0',
    background: '#ffffff',
    'font-size': '0',
    'line-height': '0'
  })
  spacerCell.innerHTML = '&nbsp;'

  spacerRow.appendChild(spacerCell)
  return spacerRow
}

const evitarCorteDeLinhasNoClone = (clonedTarget, option) => {
  if (!['vendas', 'recebimentos'].includes(option?.layout)) return

  const targetWidth = clonedTarget.getBoundingClientRect().width || clonedTarget.scrollWidth || clonedTarget.clientWidth
  if (!targetWidth) return

  const pageHeightPx = calcularAlturaPaginaEmPixels(targetWidth, option?.orientation || 'portrait')
  if (!pageHeightPx) return

  const targetRect = clonedTarget.getBoundingClientRect()
  const tabelas = clonedTarget.querySelectorAll('table')

  tabelas.forEach((tabela) => {
    const totalColunas = Math.max(
      ...Array.from(tabela.querySelectorAll('thead tr, tbody tr, tfoot tr')).map((row) => row.children.length || 0),
      1
    )

    const linhas = Array.from(tabela.querySelectorAll('tbody tr, tfoot tr'))

    for (const linha of linhas) {
      let tentativas = 0

      while (tentativas < 3) {
        tentativas += 1

        const rect = linha.getBoundingClientRect()
        const top = rect.top - targetRect.top
        const bottom = rect.bottom - targetRect.top
        const height = rect.height

        if (top < 0 || height <= 0 || height >= pageHeightPx - PAGE_BREAK_BUFFER_PX) {
          break
        }

        const limitePagina = (Math.floor(top / pageHeightPx) + 1) * pageHeightPx
        const cruzaPagina = bottom > (limitePagina - 1)

        if (!cruzaPagina) {
          break
        }

        const alturaEspaco = limitePagina - top + PAGE_BREAK_BUFFER_PX
        if (alturaEspaco <= 0) {
          break
        }

        const spacerRow = criarLinhaEspacadora(clonedTarget.ownerDocument, totalColunas, alturaEspaco)
        linha.parentNode?.insertBefore(spacerRow, linha)
      }
    }
  })
}

const removerColunasDeAcaoDoClone = (clonedTarget) => {
  clonedTarget.querySelectorAll('.col-acoes-pdf').forEach((elemento) => {
    elemento.remove()
  })

  clonedTarget.querySelectorAll('table').forEach((tabela) => {
    tabela.querySelectorAll('thead tr').forEach((row) => {
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

const obterLarguraDoHost = (option) => {
  return HOST_WIDTH_BY_LAYOUT[option?.layout] || 1180
}

const obterLarguraPrimeiraColuna = (option) => {
  return FIRST_COLUMN_WIDTH_BY_LAYOUT[option?.layout] || '16%'
}

const normalizarTextoTruncado = (clonedTarget) => {
  clonedTarget.querySelectorAll('.truncate').forEach((elemento) => {
    aplicarEstilosImportantes(elemento, {
      overflow: 'visible',
      'text-overflow': 'clip',
      'white-space': 'normal',
      'word-break': 'break-word',
      'overflow-wrap': 'anywhere',
      'min-width': '0'
    })
  })
}

const copiarConteudoDosCanvas = (targetOriginal, clonedTarget) => {
  const canvasOriginais = Array.from(targetOriginal.querySelectorAll('canvas'))
  const canvasClonados = Array.from(clonedTarget.querySelectorAll('canvas'))

  canvasClonados.forEach((canvasClonado, index) => {
    const canvasOriginal = canvasOriginais[index]
    if (!canvasOriginal) return

    canvasClonado.width = canvasOriginal.width || canvasClonado.width
    canvasClonado.height = canvasOriginal.height || canvasClonado.height

    aplicarEstilosImportantes(canvasClonado, {
      width: `${canvasOriginal.clientWidth || canvasOriginal.width || 0}px`,
      height: `${canvasOriginal.clientHeight || canvasOriginal.height || 0}px`,
      display: 'block',
      visibility: 'visible',
      opacity: '1'
    })

    const context = canvasClonado.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, canvasClonado.width, canvasClonado.height)
    context.drawImage(canvasOriginal, 0, 0, canvasClonado.width, canvasClonado.height)
  })
}

const criarRestauradorDeEstilos = () => {
  const estilosOriginais = new Map()

  const registrar = (elemento) => {
    if (!elemento || estilosOriginais.has(elemento)) return
    estilosOriginais.set(elemento, elemento.getAttribute('style'))
  }

  const aplicar = (elemento, estilos) => {
    if (!elemento) return
    registrar(elemento)
    aplicarEstilosImportantes(elemento, estilos)
  }

  const restaurar = () => {
    estilosOriginais.forEach((valorAnterior, elemento) => {
      if (valorAnterior === null) {
        elemento.removeAttribute('style')
      } else {
        elemento.setAttribute('style', valorAnterior)
      }
    })
  }

  return { aplicar, restaurar }
}

const aplicarLayoutLegadoDeAnaliseRecebimentos = (target, restaurador) => {
  restaurador.aplicar(target, {
    position: 'static',
    inset: 'auto',
    width: '100%',
    'min-height': 'auto',
    margin: '0',
    padding: '0',
    'box-sizing': 'border-box',
    transform: 'none',
    'z-index': 'auto',
    background: '#ffffff',
    display: 'block',
    overflow: 'visible'
  })

  target.querySelectorAll('button').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      display: 'none'
    })
  })

  target.querySelectorAll('.pointer-events-none.absolute').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      display: 'none'
    })
  })

  target.querySelectorAll('.analise-recebimentos-print-header, .analise-recebimentos-print-stats, .analise-recebimentos-print-section, .analise-recebimentos-print-grafico').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      'box-shadow': 'none',
      'backdrop-filter': 'none'
    })
  })

  target.querySelectorAll('.analise-recebimentos-print-header > .relative > .flex').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      gap: '10px'
    })
  })

  target.querySelectorAll('.analise-recebimentos-print-primary').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      display: 'grid',
      'grid-template-columns': 'repeat(2, minmax(0, 1fr))',
      gap: '8px'
    })
  })

  target.querySelectorAll('.analise-recebimentos-print-insights').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      display: 'grid',
      'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
      gap: '8px'
    })
  })

  target.querySelectorAll('.analise-recebimentos-print-secondary').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      display: 'grid',
      'grid-template-columns': 'repeat(3, minmax(0, 1fr))',
      gap: '8px'
    })
  })

  target.querySelectorAll('.analise-recebimentos-print-grafico-body').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      display: 'block'
    })
  })

  target.querySelectorAll('.analise-recebimentos-print-canvas, .analise-recebimentos-print-grafico .h-80').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      height: '220px'
    })
  })

  target.querySelectorAll('.analise-recebimentos-print-tabela').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      overflow: 'visible'
    })
  })

  target.querySelectorAll('.analise-recebimentos-print-tabela thead').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      position: 'static'
    })
  })

  target.querySelectorAll('.analise-recebimentos-print-tabela th, .analise-recebimentos-print-tabela td').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      'font-size': '9px',
      padding: '6px 8px',
      'line-height': '1.35',
      'white-space': 'normal'
    })
  })

  target.querySelectorAll('.grid.grid-cols-1.gap-8').forEach((elemento) => {
    restaurador.aplicar(elemento, {
      display: 'block'
    })

    Array.from(elemento.children).slice(1).forEach((filho) => {
      restaurador.aplicar(filho, {
        'margin-top': '10px'
      })
    })
  })
}

const transformarBotaoDeTabelaEmBlocoEstatico = (botao) => {
  const replacement = botao.ownerDocument.createElement('div')
  replacement.className = 'pdf-static-button'

  aplicarEstilosImportantes(replacement, {
    display: 'flex',
    'align-items': 'flex-start',
    'justify-content': 'flex-start',
    width: '100%',
    gap: '6px',
    padding: '3px 0',
    margin: '0',
    border: '0',
    background: 'transparent',
    'box-shadow': 'none',
    'line-height': '1.45',
    'min-height': '28px'
  })

  while (botao.firstChild) {
    replacement.appendChild(botao.firstChild)
  }

  botao.replaceWith(replacement)
}

const obterTextoDoCampo = (campo) => {
  if (campo instanceof HTMLTextAreaElement) {
    return String(campo.value || campo.placeholder || '').trim()
  }

  if (campo instanceof HTMLSelectElement) {
    const selecionado = campo.options[campo.selectedIndex]
    return String(selecionado?.text || campo.value || '').trim()
  }

  const tipo = String(campo.getAttribute('type') || '').toLowerCase()
  if (tipo === 'checkbox' || tipo === 'radio') {
    return campo.checked ? 'Sim' : 'Nao'
  }

  return String(campo.value || campo.getAttribute('value') || campo.placeholder || '').trim()
}

const transformarCampoInterativoEmTexto = (campo) => {
  const replacement = campo.ownerDocument.createElement(campo.tagName === 'TEXTAREA' ? 'div' : 'span')
  replacement.className = 'pdf-static-field'
  replacement.textContent = obterTextoDoCampo(campo) || ' '

  const estilosComputados = window.getComputedStyle(campo)
  aplicarEstilosImportantes(replacement, {
    display: 'inline-flex',
    'align-items': 'center',
    'justify-content': estilosComputados.textAlign === 'right' ? 'flex-end' : 'flex-start',
    width: estilosComputados.width,
    'min-width': estilosComputados.width,
    'min-height': estilosComputados.height === 'auto' ? '34px' : estilosComputados.height,
    padding: estilosComputados.padding,
    margin: estilosComputados.margin,
    border: estilosComputados.border,
    'border-radius': estilosComputados.borderRadius,
    'background-color': estilosComputados.backgroundColor || '#ffffff',
    color: estilosComputados.color || '#111827',
    'font-size': estilosComputados.fontSize,
    'font-weight': estilosComputados.fontWeight,
    'line-height': '1.45',
    'white-space': 'normal',
    'word-break': 'break-word',
    'overflow-wrap': 'anywhere',
    'box-sizing': 'border-box',
    'text-align': estilosComputados.textAlign,
    overflow: 'visible'
  })

  campo.replaceWith(replacement)
}

const sanitizarControlesDeTabela = (clonedTarget) => {
  clonedTarget.querySelectorAll('table tbody button, table tfoot button').forEach((botao) => {
    transformarBotaoDeTabelaEmBlocoEstatico(botao)
  })

  clonedTarget.querySelectorAll('table input, table textarea, table select').forEach((campo) => {
    transformarCampoInterativoEmTexto(campo)
  })
}

const isTextoNumerico = (texto) => {
  const valor = String(texto || '').replace(/\s+/g, ' ').trim()
  if (!valor) return false
  return /^[R$\s()%+\-.,0-9]+$/.test(valor)
}

const normalizarFlexInternoDaCelula = (celula) => {
  celula.querySelectorAll('*').forEach((elemento) => {
    const classes = String(elemento.className || '')
    if (classes.includes('flex')) {
      aplicarEstilosImportantes(elemento, {
        'align-items': 'flex-start',
        'justify-content': 'flex-start',
        'flex-wrap': 'wrap',
        gap: '6px'
      })
    }
  })
}

const isTabelaVouchersRecebimentos = (tabela) => {
  return tabela.classList.contains('pdf-vouchers-recebimentos-table')
}

const isTabelaAnaliseRecebimentos = (tabela) => {
  return tabela.classList.contains('pdf-analise-recebimentos-table')
}

const normalizarTipografiaNumericaDeVendas = (celula) => {
  aplicarEstilosImportantes(celula, {
    'font-size': '9.5px',
    'font-weight': '700',
    'line-height': '1.55'
  })

  celula.querySelectorAll('span, div, p, strong, b').forEach((elemento) => {
    aplicarEstilosImportantes(elemento, {
      'font-size': 'inherit',
      'font-weight': 'inherit',
      'line-height': 'inherit'
    })
  })

  celula.querySelectorAll('.pdf-static-field').forEach((campo) => {
    aplicarEstilosImportantes(campo, {
      'font-size': 'inherit',
      'font-weight': 'inherit',
      'line-height': 'inherit'
    })
  })
}

const normalizarTabelasDoClone = (clonedTarget, option) => {
  const larguraPrimeiraColuna = obterLarguraPrimeiraColuna(option)

  clonedTarget.querySelectorAll('table').forEach((tabela) => {
    const ehTabelaVouchersRecebimentos = isTabelaVouchersRecebimentos(tabela)
    const ehTabelaAnaliseRecebimentos = isTabelaAnaliseRecebimentos(tabela)
    const quantidadeColunas = Math.max(
      ...Array.from(tabela.querySelectorAll('thead tr, tbody tr, tfoot tr')).map((row) => row.children.length || 0),
      1
    )
    const larguraColunaEqualizada = `${(100 / quantidadeColunas).toFixed(4)}%`
    const larguraPrimeiraColunaAnaliseRecebimentos = '22%'
    const larguraRestanteAnaliseRecebimentos = quantidadeColunas > 1
      ? `${(78 / (quantidadeColunas - 1)).toFixed(4)}%`
      : '100%'

    aplicarEstilosImportantes(tabela, {
      width: '100%',
      'table-layout': 'fixed',
      'border-collapse': 'collapse',
      overflow: 'visible'
    })

    tabela.querySelectorAll('thead tr, tbody tr, tfoot tr').forEach((linha) => {
      aplicarEstilosImportantes(linha, {
        'page-break-inside': 'avoid',
        'break-inside': 'avoid'
      })
    })

    Array.from(tabela.querySelectorAll('thead tr')).forEach((linha) => {
      Array.from(linha.children).forEach((celula, indice) => {
        aplicarEstilosImportantes(celula, {
          padding: '9px 7px',
          'font-size': option?.layout === 'vendas' ? '8px' : '9px',
          'font-weight': '700',
          'line-height': '1.45',
          'letter-spacing': '0',
          'white-space': 'normal',
          'word-break': 'break-word',
          'overflow-wrap': 'anywhere',
          'vertical-align': 'middle'
        })

        if (ehTabelaVouchersRecebimentos) {
          aplicarEstilosImportantes(celula, {
            width: larguraColunaEqualizada,
            'min-width': larguraColunaEqualizada,
            'max-width': larguraColunaEqualizada
          })
        } else if (ehTabelaAnaliseRecebimentos) {
          const larguraAnalise = indice === 0 ? larguraPrimeiraColunaAnaliseRecebimentos : larguraRestanteAnaliseRecebimentos
          aplicarEstilosImportantes(celula, {
            width: larguraAnalise,
            'min-width': larguraAnalise,
            'max-width': larguraAnalise
          })
        } else if (indice === 0 || celula.classList.contains('col-adquirente-pdf')) {
          aplicarEstilosImportantes(celula, {
            width: larguraPrimeiraColuna,
            'min-width': larguraPrimeiraColuna,
            'max-width': larguraPrimeiraColuna
          })
        }
      })
    })

    Array.from(tabela.querySelectorAll('tbody tr, tfoot tr')).forEach((linha) => {
      Array.from(linha.children).forEach((celula, indice) => {
        const texto = String(celula.textContent || '').trim()
        const colunaNome = indice === 0 || celula.classList.contains('col-adquirente-pdf')
        const textoNumerico = !colunaNome && isTextoNumerico(texto)

        aplicarEstilosImportantes(celula, {
          padding: option?.layout === 'vendas' ? '10px 6px' : '12px 8px',
          'font-size': option?.layout === 'vendas' ? '8px' : '10px',
          'line-height': colunaNome ? '1.5' : '1.55',
          'white-space': textoNumerico ? 'nowrap' : 'normal',
          'word-break': textoNumerico ? 'normal' : 'break-word',
          'overflow-wrap': textoNumerico ? 'normal' : 'anywhere',
          'vertical-align': colunaNome ? 'top' : 'middle',
          overflow: 'visible',
          'text-overflow': 'clip',
          height: 'auto',
          'min-height': colunaNome ? '40px' : '36px'
        })

        if (ehTabelaVouchersRecebimentos) {
          aplicarEstilosImportantes(celula, {
            width: larguraColunaEqualizada,
            'min-width': larguraColunaEqualizada,
            'max-width': larguraColunaEqualizada
          })
        } else if (ehTabelaAnaliseRecebimentos) {
          const larguraAnalise = indice === 0 ? larguraPrimeiraColunaAnaliseRecebimentos : larguraRestanteAnaliseRecebimentos
          aplicarEstilosImportantes(celula, {
            width: larguraAnalise,
            'min-width': larguraAnalise,
            'max-width': larguraAnalise
          })
        } else if (colunaNome) {
          aplicarEstilosImportantes(celula, {
            width: larguraPrimeiraColuna,
            'min-width': larguraPrimeiraColuna,
            'max-width': larguraPrimeiraColuna
          })
        }

        normalizarFlexInternoDaCelula(celula)

        if (ehTabelaVouchersRecebimentos) {
          celula.querySelectorAll('.pdf-static-field').forEach((campo) => {
            aplicarEstilosImportantes(campo, {
              width: '100%',
              'min-width': '0',
              'max-width': '100%'
            })
          })
        }

        if (option?.layout === 'vendas' && textoNumerico) {
          normalizarTipografiaNumericaDeVendas(celula)
        }
      })
    })
  })
}

const esconderDecoracoesDoClone = (clonedTarget) => {
  clonedTarget.querySelectorAll('.pointer-events-none.absolute').forEach((elemento) => {
    elemento.style.display = 'none'
  })
}

const removerEfeitosVisuaisPesados = (clonedTarget) => {
  clonedTarget.querySelectorAll('*').forEach((elemento) => {
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

const criarHostDeRenderizacao = (option) => {
  const host = document.createElement('div')
  host.className = 'controladoria-pdf-render-host'

  aplicarEstilosImportantes(host, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: `${obterLarguraDoHost(option)}px`,
    'max-width': 'none',
    padding: '0',
    margin: '0',
    background: '#ffffff',
    overflow: 'visible',
    'pointer-events': 'none',
    'z-index': '-1',
    'box-sizing': 'border-box'
  })

  return host
}

const prepararSnapshotParaCanvas = async ({ target, option, logoSrc }) => {
  const layoutClass = getBodyLayoutClass(option?.layout)
  const host = criarHostDeRenderizacao(option)
  const clone = target.cloneNode(true)

  clone.setAttribute('data-print-target', 'true')
  aplicarEstilosImportantes(clone, {
    width: '100%',
    margin: '0',
    padding: '0',
    background: '#ffffff',
    opacity: '1',
    filter: 'none',
    'backdrop-filter': 'none'
  })

  host.appendChild(clone)
  document.body.appendChild(host)
  document.body.classList.add('printing-controladoria-pdf', layoutClass)

  const logoImg = criarCabecalhoNoClone(clone, logoSrc, option)
  copiarConteudoDosCanvas(target, clone)
  removerColunasDeAcaoDoClone(clone)
  sanitizarControlesDeTabela(clone)
  normalizarTextoTruncado(clone)
  normalizarTabelasDoClone(clone, option)
  esconderDecoracoesDoClone(clone)
  removerEfeitosVisuaisPesados(clone)

  await aguardarImagensDoElemento(clone)
  await aguardarImagemPronta(logoImg)
  await aguardarProximoFrame(3)
  evitarCorteDeLinhasNoClone(clone, option)
  await aguardarProximoFrame(2)

  return {
    host,
    cleanup: () => {
      document.body.classList.remove('printing-controladoria-pdf', layoutClass)
      host.remove()
    }
  }
}

const prepararCapturaLegadaDeAnaliseRecebimentos = async ({ target, option, logoSrc }) => {
  const layoutClass = getBodyLayoutClass(option?.layout)
  const previousScrollX = window.scrollX || window.pageXOffset || 0
  const previousScrollY = window.scrollY || window.pageYOffset || 0
  const originalTargetAttr = target.getAttribute('data-print-target')
  const originalParent = target.parentNode
  const originalNextSibling = target.nextSibling
  const restaurador = criarRestauradorDeEstilos()
  const larguraCaptura = Math.max(
    Math.ceil(target.getBoundingClientRect().width || 0),
    Math.ceil(document.documentElement?.clientWidth || 0),
    Math.ceil(window.innerWidth || 0),
    1
  )

  document.body.classList.add('printing-controladoria-pdf', layoutClass)
  window.scrollTo(0, 0)
  document.body.prepend(target)
  target.setAttribute('data-print-target', 'true')

  const logoImg = criarCabecalhoNoClone(target, logoSrc, option)
  aplicarLayoutLegadoDeAnaliseRecebimentos(target, restaurador)
  restaurador.aplicar(target, {
    position: 'fixed',
    top: '0',
    left: '-20000px',
    width: `${larguraCaptura}px`,
    'max-width': `${larguraCaptura}px`,
    'min-width': `${larguraCaptura}px`,
    margin: '0',
    'pointer-events': 'none',
    'z-index': '-1'
  })

  await aguardarImagensDoElemento(target)
  await aguardarCarregamentoLogo(logoImg)
  await aguardarProximoFrame(3)

  return {
    node: target,
    cleanup: () => {
      restaurador.restaurar()
      document.body.classList.remove('printing-controladoria-pdf', layoutClass)

      if (logoImg?.parentNode?.parentNode === target) {
        logoImg.parentNode.parentNode.remove()
      }

      if (originalTargetAttr === null) {
        target.removeAttribute('data-print-target')
      } else {
        target.setAttribute('data-print-target', originalTargetAttr)
      }

      if (originalParent) {
        if (originalNextSibling?.parentNode === originalParent) {
          originalParent.insertBefore(target, originalNextSibling)
        } else {
          originalParent.appendChild(target)
        }
      }

      window.scrollTo(previousScrollX, previousScrollY)
    }
  }
}

export const capturarTargetParaCanvas = async ({ target, option, logoSrc }) => {
  const previousScrollX = window.scrollX || window.pageXOffset || 0
  const previousScrollY = window.scrollY || window.pageYOffset || 0
  let snapshot = null

  if (option?.id === 'analise_de_recebimentos') {
    try {
      snapshot = await prepararCapturaLegadaDeAnaliseRecebimentos({ target, option, logoSrc })
      const largura = Math.ceil(snapshot.node.scrollWidth || snapshot.node.getBoundingClientRect().width || 1)
      const altura = Math.ceil(snapshot.node.scrollHeight || snapshot.node.getBoundingClientRect().height || 1)

      return await html2canvas(snapshot.node, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 0,
        width: largura,
        height: altura,
        windowWidth: Math.max(largura, window.innerWidth || largura),
        windowHeight: Math.max(altura, window.innerHeight || altura),
        scrollX: 0,
        scrollY: 0
      })
    } finally {
      snapshot?.cleanup?.()
    }
  }

  window.scrollTo(0, 0)

  try {
    snapshot = await prepararSnapshotParaCanvas({ target, option, logoSrc })
    const largura = Math.ceil(snapshot.host.scrollWidth || snapshot.host.getBoundingClientRect().width || 1)
    const altura = Math.ceil(snapshot.host.scrollHeight || snapshot.host.getBoundingClientRect().height || 1)

    return await html2canvas(snapshot.host, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 0,
      width: largura,
      height: altura,
      windowWidth: largura,
      windowHeight: altura,
      scrollX: 0,
      scrollY: 0
    })
  } finally {
    snapshot?.cleanup?.()
    window.scrollTo(previousScrollX, previousScrollY)
  }
}

export const canvasParaPdfBlob = async ({ canvas, fileName, orientation = 'portrait' }) => {
  const { pageWidthPt, pageHeightPt } = obterDimensoesPaginaPt(orientation)

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

export const gerarArquivoCompactado = async ({ files, nomeEmpresa, fileName }) => {
  const zip = new JSZip()

  files.forEach((file) => {
    zip.file(file.fileName, file.blob)
  })

  const bundleName = fileName || `Exportacao_PDF_${normalizarParaArquivo(nomeEmpresa)}.zip`
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
