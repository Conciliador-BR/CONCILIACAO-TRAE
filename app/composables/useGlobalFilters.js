import { ref, reactive, readonly } from 'vue'

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

// Event Bus para comunicação entre componentes
const eventBus = ref(new Map())

export const useGlobalFilters = () => {
  // Função para aplicar filtros
  const aplicarFiltros = (dadosFiltros) => {
    
    // Atualiza o estado global preservando as datas se fornecidas
    const filtrosAtualizados = {
      empresaSelecionada: dadosFiltros.empresaSelecionada !== undefined ? dadosFiltros.empresaSelecionada : filtrosGlobais.empresaSelecionada,
      dataInicial: dadosFiltros.dataInicial !== undefined && dadosFiltros.dataInicial !== null ? dadosFiltros.dataInicial : filtrosGlobais.dataInicial,
      dataFinal: dadosFiltros.dataFinal !== undefined && dadosFiltros.dataFinal !== null ? dadosFiltros.dataFinal : filtrosGlobais.dataFinal
    }
    
    Object.assign(filtrosGlobais, filtrosAtualizados)
    
    // ✅ NOVO: Emite eventos para VENDAS, PAGAMENTOS e CONTROLADORIA simultaneamente
    if (process.client) {
      // Sempre emitir eventos para páginas principais, independente da página atual
      emitirEvento('filtrar-vendas', dadosFiltros)
      emitirEvento('filtrar-pagamentos', dadosFiltros)
      emitirEvento('filtrar-controladoria-vendas', dadosFiltros)
      emitirEvento('filtrar-controladoria-recebimentos', dadosFiltros)
      emitirEvento('filtrar-dashboard', dadosFiltros) // Emitir SEMPRE para o dashboard

      
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
      
      if (eventoEspecifico && eventoEspecifico !== 'filtrar-dashboard') {
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
    
    filtrosGlobais.dataInicial = novasDatasPadrao.dataInicial
    filtrosGlobais.dataFinal = novasDatasPadrao.dataFinal
    
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
    aplicarFiltros,
    escutarEvento,
    removerEvento,
    limparEventos,
    obterFiltros,
    limparFiltros,
    reinicializarDatasPadrao,
    debugListeners
  }
}
