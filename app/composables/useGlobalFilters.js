import { ref, reactive, watch } from 'vue'

// Função para obter datas padrão de setembro (mês específico)
const obterDatasPadraoSetembro = () => {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mesSetembro = 8 // Setembro = 8 (0-11)
  
  const primeiroDia = new Date(ano, mesSetembro, 1)
  const ultimoDia = new Date(ano, mesSetembro + 1, 0)
  
  const formatarData = (data) => {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }
  
  const resultado = {
    dataInicial: formatarData(primeiroDia),
    dataFinal: formatarData(ultimoDia)
  }
  
  return resultado
}

// Função para obter datas padrão do mês atual
const obterDatasPadraoMesAtual = () => {
  // Usar data local para evitar problemas de fuso horário
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth() // 0-11 (Janeiro = 0, Dezembro = 11)
  
  // Criar datas usando construtor local para evitar problemas de fuso horário
  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0) // Dia 0 do próximo mês = último dia do mês atual
  
  // Formatar as datas manualmente para garantir formato correto
  const formatarData = (data) => {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }
  
  const resultado = {
    dataInicial: formatarData(primeiroDia),
    dataFinal: formatarData(ultimoDia)
  }
  
  return resultado
}

// Estado global dos filtros - inicializar vazio
const filtrosGlobais = reactive({
  empresaSelecionada: '',
  dataInicial: '',
  dataFinal: ''
})

const STORAGE_KEY = 'conciliacao:filtros-globais'
let persistenciaInicializada = false
let filtrosHidratadosDoStorage = false

// Event Bus para comunicação entre componentes
const eventBus = ref(new Map())

export const useGlobalFilters = () => {
  const normalizarFiltros = (dados = {}) => ({
    empresaSelecionada: dados.empresaSelecionada ?? '',
    dataInicial: dados.dataInicial ?? '',
    dataFinal: dados.dataFinal ?? ''
  })

  const salvarFiltrosNoStorage = () => {
    if (!process.client) return

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizarFiltros(filtrosGlobais)))
    } catch (error) {
      console.error('Erro ao salvar filtros no storage:', error)
    }
  }

  const restaurarFiltrosDoStorage = () => {
    if (!process.client || filtrosHidratadosDoStorage) {
      return { ...filtrosGlobais }
    }

    filtrosHidratadosDoStorage = true

    try {
      const filtrosSalvos = window.localStorage.getItem(STORAGE_KEY)
      if (!filtrosSalvos) {
        return { ...filtrosGlobais }
      }

      const filtrosParseados = JSON.parse(filtrosSalvos)
      Object.assign(filtrosGlobais, normalizarFiltros(filtrosParseados))
    } catch (error) {
      console.error('Erro ao restaurar filtros do storage:', error)
    }

    return { ...filtrosGlobais }
  }

  const inicializarPersistencia = () => {
    if (!process.client || persistenciaInicializada) return

    restaurarFiltrosDoStorage()

    watch(
      filtrosGlobais,
      () => {
        salvarFiltrosNoStorage()
      },
      { deep: true }
    )

    persistenciaInicializada = true
  }

  const atualizarFiltros = (dadosFiltros = {}) => {
    const filtrosAtualizados = {
      empresaSelecionada: dadosFiltros.empresaSelecionada !== undefined ? dadosFiltros.empresaSelecionada : filtrosGlobais.empresaSelecionada,
      dataInicial: dadosFiltros.dataInicial !== undefined && dadosFiltros.dataInicial !== null ? dadosFiltros.dataInicial : filtrosGlobais.dataInicial,
      dataFinal: dadosFiltros.dataFinal !== undefined && dadosFiltros.dataFinal !== null ? dadosFiltros.dataFinal : filtrosGlobais.dataFinal
    }

    Object.assign(filtrosGlobais, filtrosAtualizados)
    return filtrosAtualizados
  }

  const executarCallbacksEvento = async (nomeEvento, dados) => {
    try {
      const callbacks = [...(eventBus.value.get(nomeEvento) || [])]

      await Promise.allSettled(callbacks.map(async (callback) => {
        try {
          return await callback(dados)
        } catch (error) {
          console.error(`Erro ao executar callback para evento ${nomeEvento}:`, error)
          return null
        }
      }))
    } catch (error) {
      console.error(`Erro ao emitir evento ${nomeEvento}:`, error)
    }
  }

  // Função para aplicar filtros
  const aplicarFiltros = async (dadosFiltros) => {
    // Atualiza o estado global preservando as datas se fornecidas
    const filtrosAtualizados = atualizarFiltros(dadosFiltros)
    
    // ✅ NOVO: Emite eventos para VENDAS, PAGAMENTOS e CONTROLADORIA simultaneamente
    if (process.client) {
      // Aguarda as três páginas principais concluírem suas buscas antes de liberar o loading global
      await Promise.allSettled([
        executarCallbacksEvento('filtrar-vendas', filtrosAtualizados),
        executarCallbacksEvento('filtrar-pagamentos', filtrosAtualizados),
        executarCallbacksEvento('filtrar-bancos', filtrosAtualizados),
        executarCallbacksEvento('filtrar-taxas', filtrosAtualizados),
        executarCallbacksEvento('filtrar-senhas', filtrosAtualizados)
      ])

      emitirEvento('filtrar-controladoria-vendas', filtrosAtualizados)
      emitirEvento('filtrar-controladoria-recebimentos', filtrosAtualizados)
      emitirEvento('filtrar-dashboard', filtrosAtualizados)

      // Também emitir para outras páginas se necessário
      const rota = useRoute()
      const paginaAtual = rota.name
      
      // Define os eventos específicos para outras páginas
      const outrosEventos = {
        'index': 'filtrar-dashboard', // Mantido para retrocompatibilidade
        'cadastro': 'filtrar-taxas',
        'bancos': 'filtrar-bancos'
      }
      
      const eventoEspecifico = outrosEventos[paginaAtual]
      
      // Se for dashboard (index), já emitimos acima. Evitar duplicidade não é crítico, mas bom.
      // O dashboard é a página 'index' ou 'dashboard' dependendo da rota.
      // Vamos garantir que 'filtrar-dashboard' seja sempre emitido.
      
      if (eventoEspecifico && !['filtrar-dashboard', 'filtrar-bancos'].includes(eventoEspecifico)) {
        emitirEvento(eventoEspecifico, filtrosAtualizados)
      }
      
      // Evento global para todas as páginas
      emitirEvento('filtros-aplicados', filtrosAtualizados)
    }
  }
  
  // Função para emitir eventos
  const emitirEvento = async (nomeEvento, dados) => {
    await executarCallbacksEvento(nomeEvento, dados)
  }
  
  // Função para escutar eventos
  const escutarEvento = (nomeEvento, callback) => {
    if (!eventBus.value.has(nomeEvento)) {
      eventBus.value.set(nomeEvento, [])
    }
    eventBus.value.get(nomeEvento).push(callback)
    
    // Retorna função para remover o listener
    return () => {
      try {
        const callbacks = eventBus.value.get(nomeEvento)
        if (callbacks) {
          const index = callbacks.indexOf(callback)
          if (index > -1) {
            callbacks.splice(index, 1)
          }
        }
      } catch (error) {
        console.error(`Erro ao remover listener para evento ${nomeEvento}:`, error)
      }
    }
  }
  
  // Função para remover listener
  const removerEvento = (nomeEvento, callback) => {
    try {
      const callbacks = eventBus.value.get(nomeEvento)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    } catch (error) {
      console.error(`Erro ao remover evento ${nomeEvento}:`, error)
    }
  }
  
  // Função para limpar todos os listeners de um evento
  const limparEventos = (nomeEvento) => {
    try {
      if (eventBus.value.has(nomeEvento)) {
        eventBus.value.set(nomeEvento, [])
      }
    } catch (error) {
      console.error(`Erro ao limpar eventos ${nomeEvento}:`, error)
    }
  }
  
  // Função para obter filtros atuais
  const obterFiltros = () => {
    return { ...filtrosGlobais }
  }
  
  // Função para limpar filtros
  const limparFiltros = () => {
    atualizarFiltros({
      empresaSelecionada: '',
      dataInicial: '',
      dataFinal: ''
    })
    emitirEvento('filtros-limpos', {})
  }
  
  // Função para reinicializar datas padrão (só se não houver datas já definidas)
  const reinicializarDatasPadrao = (forcar = false) => {
    // Se as datas estão vazias (primeira inicialização), aplicar datas padrão
    // Se forçar = false e já há datas definidas, manter as existentes
    if (!forcar && filtrosGlobais.dataInicial && filtrosGlobais.dataFinal) {
      return {
        dataInicial: filtrosGlobais.dataInicial,
        dataFinal: filtrosGlobais.dataFinal
      }
    }
    
    // Se as datas estão vazias ou se forçado, aplicar datas padrão
    const novasDatasPadrao = obterDatasPadraoMesAtual()
    
    atualizarFiltros({
      dataInicial: novasDatasPadrao.dataInicial,
      dataFinal: novasDatasPadrao.dataFinal
    })
    
    return novasDatasPadrao
  }
  
  // Função para debug - listar todos os listeners ativos
  const debugListeners = () => {
    for (const [_evento, _callbacks] of eventBus.value.entries()) {
      // silencioso
    }
  }
  
  return {
    filtrosGlobais, // Removido readonly para permitir modificações diretas
    atualizarFiltros,
    aplicarFiltros,
    emitirEvento,
    escutarEvento,
    removerEvento,
    limparEventos,
    obterFiltros,
    limparFiltros,
    reinicializarDatasPadrao,
    restaurarFiltrosDoStorage,
    inicializarPersistencia,
    debugListeners
  }
}
