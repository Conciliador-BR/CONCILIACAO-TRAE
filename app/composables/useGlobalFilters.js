import { ref, reactive, readonly } from 'vue'

// Estado global dos filtros
const filtrosGlobais = reactive({
  empresaSelecionada: '',
  dataInicial: '',
  dataFinal: ''
})

// Event Bus para comunicação entre componentes
const eventBus = ref(new Map())

export const useGlobalFilters = () => {
  // Função para aplicar filtros
  const aplicarFiltros = (dadosFiltros) => {
    // Atualiza o estado global
    Object.assign(filtrosGlobais, dadosFiltros)
    
    // Emite eventos específicos para cada página
    if (process.client) {
      const rota = useRoute()
      const paginaAtual = rota.name
      
      // Define os eventos específicos para cada página
      const eventosEspecificos = {
        'index': 'filtrar-dashboard',
        'vendas': 'filtrar-vendas',
        'controladoria-vendas': 'filtrar-controladoria-vendas',
        'controladoria-recebimentos': 'filtrar-controladoria-recebimentos',
        'taxas': 'filtrar-taxas',
        'bancos': 'filtrar-bancos',
        'pagamentos': 'filtrar-pagamentos'
      }
      
      const eventoEspecifico = eventosEspecificos[paginaAtual]
      
      if (eventoEspecifico) {
        emitirEvento(eventoEspecifico, dadosFiltros)
      }
      
      // Evento global para todas as páginas
      emitirEvento('filtros-aplicados', dadosFiltros)
    }
  }
  
  // Função para emitir eventos
  const emitirEvento = (nomeEvento, dados) => {
    try {
      const callbacks = eventBus.value.get(nomeEvento) || []
      callbacks.forEach(callback => {
        try {
          callback(dados)
        } catch (error) {
          console.error(`Erro ao executar callback para evento ${nomeEvento}:`, error)
        }
      })
    } catch (error) {
      console.error(`Erro ao emitir evento ${nomeEvento}:`, error)
    }
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
    Object.assign(filtrosGlobais, {
      empresaSelecionada: '',
      dataInicial: '',
      dataFinal: ''
    })
    emitirEvento('filtros-limpos', {})
  }
  
  // Função para debug - listar todos os listeners ativos
  const debugListeners = () => {
    console.log('🔍 Listeners ativos no eventBus:')
    for (const [evento, callbacks] of eventBus.value.entries()) {
      console.log(`- ${evento}: ${callbacks.length} listeners`)
    }
  }
  
  return {
    filtrosGlobais: readonly(filtrosGlobais),
    aplicarFiltros,
    escutarEvento,
    removerEvento,
    limparEventos,
    obterFiltros,
    limparFiltros,
    debugListeners
  }
}