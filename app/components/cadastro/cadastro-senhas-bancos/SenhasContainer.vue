<template>
  <div class="w-full max-w-none overflow-hidden rounded-[28px] border border-[#DCE7F3] bg-white shadow-[0_20px_50px_rgba(16,42,67,0.10)]">
    <SenhasHeader
      :total-senhas="senhas.length"
      :empresa-label="empresaHeaderLabel"
      @adicionar-senha="abrirSeletorGrupo"
      @salvar="handleSalvar"
    />

    <div class="space-y-4 bg-gradient-to-b from-[#FBFDFF] via-white to-[#F7FAFC] px-2 sm:px-3 lg:px-4 py-4 sm:py-5">
      <!-- Mensagem de sucesso -->
      <div v-if="mensagemSucesso" class="flex items-center rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-green-800 shadow-sm">
        <svg class="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      <strong>✅ Sucesso!</strong> {{ mensagemSucesso }}
      </div>
    
      <!-- Mensagem de erro -->
      <div v-if="erroSupabase" class="flex items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow-sm">
        <svg class="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>
      <strong>❌ Erro!</strong> Falha ao enviar para o Supabase: {{ erroSupabase }}
      </div>
    
      <!-- Loading indicator -->
      <div v-if="salvandoSenhas" class="flex items-center rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 shadow-sm">
        <svg class="mr-2 w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <strong>🔄 Enviando...</strong> Salvando senhas no Supabase...
      </div>

      <!-- Mensagem de status detalhado -->
      <div v-if="ultimoResultado" class="rounded-2xl px-4 py-3 shadow-sm" :class="ultimoResultado.ok ? 'border border-green-200 bg-green-50 text-green-800' : 'border border-yellow-200 bg-yellow-50 text-yellow-800'">
        <div class="mb-2 flex items-center">
          <span v-if="ultimoResultado.ok" class="text-green-600">✅</span>
          <span v-else class="text-yellow-600">⚠️</span>
          <strong class="ml-2">Resultado do Envio:</strong>
        </div>
        <div class="text-sm">
          <p><strong>Processadas:</strong> {{ ultimoResultado.processadas }}</p>
          <p><strong>Sucesso:</strong> {{ ultimoResultado.sucesso }}</p>
          <p><strong>Falhas:</strong> {{ ultimoResultado.falha }}</p>
          <div v-if="ultimoResultado.erros && ultimoResultado.erros.length > 0" class="mt-2">
            <p><strong>Erros:</strong></p>
            <ul class="list-disc list-inside text-xs">
              <li v-for="(erro, index) in ultimoResultado.erros.slice(0, 3)" :key="index">{{ erro }}</li>
              <li v-if="ultimoResultado.erros.length > 3" class="text-gray-600">... e mais {{ ultimoResultado.erros.length - 3 }} erros</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-[28px] border border-[#DCE7F3] bg-white shadow-[0_14px_30px_rgba(16,42,67,0.07)]">
        <SenhasTable
          :senhas="paginatedSenhas"
          :page-start-index="pageStartIndex"
          :visible-columns="visibleColumns"
          :column-titles="columnTitles"
          :responsive-column-widths="responsiveColumnWidths"
          :dragged-column="draggedColumn"
          :column-order="columnOrder"
          :empresas="empresas"
          :is-editing="isEditing"
          :selected-empresa-nome="selectedEmpresaNome"
          :selected-empresa-ec="selectedEmpresaEC"
          :render-count="itemsPerPage"
          @update-senha="updateSenha"
          @remover-senha="removerSenha"
          @editar-senha="handleEditar"
          @drag-start="onDragStart"
          @drag-over="onDragOver"
          @drag-drop="onDrop"
          @drag-end="onDragEnd"
          @start-resize="startResize"
        />
      </div>

      <div class="flex flex-col gap-3 rounded-[24px] border border-[#DCE7F3] bg-white px-4 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div class="text-sm text-[#486581]">
          Pagina <span class="font-semibold text-[#102A43]">{{ currentPage }}</span> de
          <span class="font-semibold text-[#102A43]">{{ totalPages }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-xl border border-[#D5E3F1] bg-[#F7FAFC] px-4 py-2 text-sm font-semibold text-[#486581] transition-colors hover:bg-white hover:text-[#102A43] disabled:cursor-not-allowed disabled:opacity-50"
            @click="prevPage"
            :disabled="currentPage === 1"
          >
            Anterior
          </button>
          <button
            class="rounded-xl bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#102a43]/20 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            @click="nextPage"
            :disabled="currentPage === totalPages"
          >
            Proxima
          </button>
        </div>
      </div>

      <div class="rounded-[24px] border border-[#DCE7F3] bg-white p-4 shadow-sm">
        <SenhasFooter
          :total-senhas="senhas.length"
        />
      </div>
    </div>

    <div
      v-if="mostrarSeletorGrupo"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-[#102A43]/45 px-4 py-6 backdrop-blur-[2px]"
      @click.self="fecharSeletorGrupo"
    >
      <div class="w-full max-w-3xl overflow-hidden rounded-[30px] border border-[#DCE7F3] bg-white shadow-[0_24px_60px_rgba(16,42,67,0.22)]">
        <div class="border-b border-[#DCE7F3] bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-6 py-5 text-white">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Novo Cadastro</p>
              <h3 class="mt-2 text-2xl font-bold tracking-tight">Como deseja cadastrar esta senha?</h3>
              <p class="mt-2 text-sm text-white/80">
                Escolha o grupo para organizar melhor os acessos entre autorizadoras e vouchers.
              </p>
            </div>
            <button
              class="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg font-semibold text-white transition-colors hover:bg-white/20"
              @click="fecharSeletorGrupo"
            >
              ×
            </button>
          </div>
        </div>

        <div class="grid gap-4 p-6 md:grid-cols-2">
          <button
            class="group rounded-[26px] border border-[#D5E3F1] bg-gradient-to-b from-white to-[#F8FBFE] p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#BFD3E6] hover:shadow-lg"
            @click="selecionarGrupoNovaSenha('AUTORIZADORA')"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F1FB] text-[#1f4f77] shadow-sm">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M7 9h10" />
                <path d="M7 13h6" />
              </svg>
            </div>
            <div class="mt-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#829AB1]">Grupo 01</p>
              <h4 class="mt-2 text-xl font-bold text-[#102A43]">Autorizadora</h4>
              <p class="mt-2 text-sm leading-relaxed text-[#486581]">
                Use para adquirentes e acessos principais de operadoras.
              </p>
            </div>
          </button>

          <button
            class="group rounded-[26px] border border-[#D5E3F1] bg-gradient-to-b from-white to-[#F8FBFE] p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#BFD3E6] hover:shadow-lg"
            @click="selecionarGrupoNovaSenha('VOUCHERS')"
          >
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF7EE] text-[#1F7A35] shadow-sm">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 7h16v10H4z" />
                <path d="M8 7v10" />
                <path d="M12 10h4" />
                <path d="M12 14h3" />
              </svg>
            </div>
            <div class="mt-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#829AB1]">Grupo 02</p>
              <h4 class="mt-2 text-xl font-bold text-[#102A43]">Vouchers</h4>
              <p class="mt-2 text-sm leading-relaxed text-[#486581]">
                Separe os acessos de beneficios e vouchers em um grupo proprio.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Importar composables
import { useResponsiveColumns } from '~/composables/useResponsiveColumns'
import { useSenhasSupabase } from '~/composables/PageTaxas/cadastro-senhas-bancos/index.js'

// Importar componentes filhos
import SenhasHeader from './SenhasHeader.vue'
import SenhasTable from './SenhasTable.vue'
import SenhasFooter from './SenhasFooter.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  empresaSelecionada: {
    type: [Object, String, Number],
    default: null
  },
  empresas: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue','salvou-senhas'])

// Usar o composable do Supabase
const { 
  salvarSenhasNoSupabase, 
  loading: salvandoSenhas, 
  success: mensagemSucesso,
  error: erroSupabase,
  resumo,
  removerSenha: removerSenhaSupabase
} = useSenhasSupabase()

// Estado para mostrar resultado detalhado
const ultimoResultado = ref(null)

// Estado para controle de edição
const isEditing = ref(-1) // -1: nenhuma linha editável, ou o índice da linha em edição
const mostrarSeletorGrupo = ref(false)
const STORAGE_KEY_GRUPOS = 'senhas-grupo-cadastro'

const handleSalvar = async () => {
  // Limpar resultado anterior
  ultimoResultado.value = null
  
  if (!selectedEmpresaId.value || !selectedEmpresaNome.value || selectedEmpresaEC.value === null) {
    ultimoResultado.value = {
      ok: false,
      processadas: 0,
      sucesso: 0,
      falha: senhas.value.length || 1,
      erros: ['Selecione uma empresa com EC valido antes de salvar.']
    }
    return
  }

  senhas.value = senhas.value.map((senha) => ({
    ...senha,
    empresaId: selectedEmpresaId.value,
    empresa: selectedEmpresaNome.value,
    ec: selectedEmpresaEC.value
  }))

  // Desabilitar edição após salvar
  isEditing.value = -1
  
  console.log('🚀 Iniciando envio das senhas para o Supabase...')
  
  // Salvar no Supabase
  const resultado = await salvarSenhasNoSupabase(senhas.value)
  
  // Armazenar resultado para exibição
  ultimoResultado.value = resultado
  
  if (resultado.ok) {
    console.log('✅ Senhas enviadas com sucesso para o Supabase!')
    console.log('📊 Estatísticas:', {
      processadas: resultado.processadas,
      sucesso: resultado.sucesso,
      falhas: resultado.falha
    })

    // Limpar mensagem após 5 segundos
    setTimeout(() => {
      ultimoResultado.value = null
    }, 5000)
    emit('salvou-senhas')
  } else {
    console.error('❌ Erro ao enviar senhas para o Supabase:')
    console.error('📋 Detalhes do erro:', resultado)
    
    // Manter mensagem de erro por mais tempo
    setTimeout(() => {
      ultimoResultado.value = null
    }, 10000)
  }
}

const handleEditar = (index) => {
  isEditing.value = index // Libera apenas esta linha para edição
}

// Usar composable responsivo
const {
  screenSize,
  windowWidth,
  getVisibleTaxasColumns,
  getResponsiveColumnWidths,
  initializeResponsive
} = useResponsiveColumns()

const senhas = ref(props.modelValue.length > 0 ? [...props.modelValue] : [])
const currentPage = ref(1)
const itemsPerPage = computed(() => {
  const count = senhas.value.length
  if (count <= 10) return 10
  if (count <= 15) return count
  return 15
})
const totalPages = computed(() => {
  const ipp = itemsPerPage.value
  return Math.max(1, Math.ceil(senhas.value.length / ipp))
})
const paginatedSenhas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return senhas.value.slice(start, end)
})
const pageStartIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }

const selectedEmpresa = computed(() => {
  if (props.empresaSelecionada && typeof props.empresaSelecionada === 'object' && props.empresaSelecionada.id) {
    return props.empresaSelecionada
  }

  const val = props.empresaSelecionada
  if (!val) return null
  const byId = props.empresas.find(e => e.id == val)
  if (byId) return byId
  const valStr = String(val).trim().toLowerCase()
  return props.empresas.find(e => (e.nome && e.nome.trim().toLowerCase() === valStr) || (e.displayName && e.displayName.trim().toLowerCase() === valStr)) || null
})

const selectedEmpresaId = computed(() => selectedEmpresa.value?.id ?? null)
const selectedEmpresaNome = computed(() => (selectedEmpresa.value && selectedEmpresa.value.nome) ? selectedEmpresa.value.nome : '')
const selectedEmpresaEC = computed(() => {
  const texto = String(selectedEmpresa.value?.matriz ?? '').trim()
  if (!texto) return null

  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : texto
})

const empresaHeaderLabel = computed(() => selectedEmpresaNome.value || 'Todas as empresas')

const carregarMapaGrupos = () => {
  if (!import.meta.client) return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_GRUPOS) || '{}')
  } catch {
    return {}
  }
}

const salvarMapaGrupos = (lista) => {
  if (!import.meta.client) return
  const mapa = {}
  for (const item of lista) {
    if (item?.id && item?.grupoCadastro) {
      mapa[item.id] = item.grupoCadastro
    }
  }
  localStorage.setItem(STORAGE_KEY_GRUPOS, JSON.stringify(mapa))
}

const ehVoucherPorNome = (valor) => {
  const texto = String(valor || '').toUpperCase()
  if (!texto) return false
  return [
    'ALELO',
    'VR ',
    ' VR',
    'TICKET',
    'PLUXEE',
    'SODEXO',
    'LECARD',
    'VEROCARD',
    'VALE CARD',
    'VALECARD',
    'GREEN CARD',
    'GOOD CARD',
    'BIG CARD',
    'UP BRASIL',
    'COMPROCARD',
    'BEN VISA',
    'NUTRICASH',
    'BIQ',
    'TOP CARD',
    'BK CARD'
  ].some(chave => texto.includes(chave))
}

const inferirGrupoCadastro = (senha) => {
  const grupoExistente = String(senha?.grupoCadastro || '').trim().toUpperCase()
  if (grupoExistente === 'AUTORIZADORA' || grupoExistente === 'VOUCHERS') return grupoExistente

  const mapa = carregarMapaGrupos()
  const grupoSalvo = String(mapa[senha?.id] || '').trim().toUpperCase()
  if (grupoSalvo === 'AUTORIZADORA' || grupoSalvo === 'VOUCHERS') return grupoSalvo

  if (ehVoucherPorNome(senha?.adquirente)) return 'VOUCHERS'
  return 'AUTORIZADORA'
}

const normalizarSenhaVisual = (senha) => ({
  ...senha,
  grupoCadastro: inferirGrupoCadastro(senha)
})

// Preencher empresa e EC apenas para linhas novas (sem valor definido)
watch([selectedEmpresaId, selectedEmpresaNome, selectedEmpresaEC], ([id, nome, ec]) => {
  if (!id || !nome || ec === null) return

  senhas.value = senhas.value.map((senha) => ({
    ...senha,
    empresaId: id,
    empresa: nome,
    ec
  }))
}, { immediate: false })

// Todas as colunas disponíveis
const allColumns = ref(['id', 'empresa', 'ec', 'adquirente', 'portal', 'login', 'senha', 'banco', 'agencia', 'conta'])

// Ordem das colunas (para drag and drop)
const columnOrder = computed(() => {
  if (import.meta.client) {
    const savedOrder = localStorage.getItem('senhas-column-order')
    if (savedOrder) {
      const parsed = JSON.parse(savedOrder)
      let order = parsed.filter(col => allColumns.value.includes(col) && col !== 'id')
      order.unshift('id')
      allColumns.value.forEach(col => { if (!order.includes(col)) order.push(col) })
      
      // Garantir que empresa e ec fiquem juntos
      const idxEmp = order.indexOf('empresa')
      const idxEc = order.indexOf('ec')
      if (idxEmp !== -1) {
        const desiredIdx = idxEmp + 1
        if (idxEc === -1) {
          order.splice(desiredIdx, 0, 'ec')
        } else if (idxEc !== desiredIdx) {
          const [ecCol] = order.splice(idxEc, 1)
          order.splice(desiredIdx, 0, ecCol)
        }
      }

      // Garantir que login e senha fiquem ao lado de portal
      const idxPortal = order.indexOf('portal')
      const idxLogin = order.indexOf('login')
      const idxSenha = order.indexOf('senha')
      if (idxPortal !== -1) {
        const desiredLoginIdx = idxPortal + 1
        if (idxLogin === -1) {
          order.splice(desiredLoginIdx, 0, 'login')
        } else if (idxLogin !== desiredLoginIdx) {
          const [loginCol] = order.splice(idxLogin, 1)
          order.splice(desiredLoginIdx, 0, loginCol)
        }

        const idxLoginAtual = order.indexOf('login')
        const idxSenhaAtual = order.indexOf('senha')
        const desiredSenhaIdx = idxLoginAtual + 1
        if (idxSenhaAtual === -1) {
          order.splice(desiredSenhaIdx, 0, 'senha')
        } else if (idxSenhaAtual !== desiredSenhaIdx) {
          const [senhaCol] = order.splice(idxSenhaAtual, 1)
          order.splice(desiredSenhaIdx, 0, senhaCol)
        }
      }

      return order
    }
  }
  
  const base = [...allColumns.value]
  
  // Garantir que empresa e ec fiquem juntos
  const idxEmp = base.indexOf('empresa')
  const idxEc = base.indexOf('ec')
  if (idxEmp !== -1 && idxEc !== -1 && idxEc !== idxEmp + 1) {
    const [ecCol] = base.splice(idxEc, 1)
    base.splice(idxEmp + 1, 0, ecCol)
  }
  // Garantir que portal fique após adquirente
  const idxAdq = base.indexOf('adquirente')
  const idxPortal = base.indexOf('portal')
  if (idxAdq !== -1 && idxPortal !== idxAdq + 1) {
    const [portalCol] = base.splice(idxPortal, 1)
    base.splice(idxAdq + 1, 0, portalCol)
  }

  // Garantir que login e senha fiquem ao lado de portal
  const idxLogin = base.indexOf('login')
  const idxSenha = base.indexOf('senha')
  const idxPortalAtual = base.indexOf('portal')
  if (idxPortalAtual !== -1) {
    const desiredLoginIdx = idxPortalAtual + 1
    if (idxLogin === -1) {
      base.splice(desiredLoginIdx, 0, 'login')
    } else if (idxLogin !== desiredLoginIdx) {
      const [loginCol] = base.splice(idxLogin, 1)
      base.splice(desiredLoginIdx, 0, loginCol)
    }

    const idxLoginAtual = base.indexOf('login')
    const desiredSenhaIdx = idxLoginAtual + 1
    if (idxSenha === -1) {
      base.splice(desiredSenhaIdx, 0, 'senha')
    } else if (idxSenha !== desiredSenhaIdx) {
      const [senhaCol] = base.splice(idxSenha, 1)
      base.splice(desiredSenhaIdx, 0, senhaCol)
    }
  }

  // Garantir ordem banco, agencia, conta após senha
  const idxBanco = base.indexOf('banco')
  const idxAgencia = base.indexOf('agencia')
  const idxConta = base.indexOf('conta')
  const idxSenhaAtual = base.indexOf('senha')
  if (idxSenhaAtual !== -1) {
    const afterSenha = idxSenhaAtual + 1
    if (idxBanco !== -1 && idxBanco !== afterSenha) {
      const [bancoCol] = base.splice(idxBanco, 1)
      base.splice(afterSenha, 0, bancoCol)
    }
    const desiredAg = base.indexOf('banco') + 1
    if (idxAgencia !== -1 && idxAgencia !== desiredAg) {
      const [agCol] = base.splice(idxAgencia, 1)
      base.splice(desiredAg, 0, agCol)
    }
    const desiredCt = base.indexOf('agencia') + 1
    if (idxConta !== -1 && idxConta !== desiredCt) {
      const [ctCol] = base.splice(idxConta, 1)
      base.splice(desiredCt, 0, ctCol)
    }
  }
  
  return base
})

// Colunas visíveis baseadas na resolução
const visibleColumns = computed(() => getVisibleTaxasColumns(columnOrder.value))

// Títulos das colunas
const columnTitles = {
  id: 'ID',
  empresa: 'Empresa',
  ec: 'EC',
  adquirente: 'Adquirente',
  portal: 'Portal',
  banco: 'Banco',
  agencia: 'Agência',
  conta: 'Conta',
  login: 'Login',
  senha: 'Senha'
}

// Larguras base das colunas
const baseColumnWidths = ref({
  id: 36,
  empresa: 160,
  ec: 90,
  adquirente: 150,
  portal: 230,
  banco: 190,
  agencia: 150,
  conta: 180,
  login: 220,
  senha: 220,
  acoes: 110
})

// Larguras responsivas das colunas
const responsiveColumnWidths = computed(() => {
  return getResponsiveColumnWidths(baseColumnWidths.value, 'senhas')
})

// Variáveis para redimensionamento
const isResizing = ref(false)
const currentColumn = ref('')
const startX = ref(0)
const startWidth = ref(0)

// Variáveis para drag and drop de colunas
const draggedColumn = ref('')
const draggedIndex = ref(-1)

const updateSenha = (index, column, value) => {
  const columnFieldMap = {
    empresa: 'empresa',
    ec: 'ec',
    adquirente: 'adquirente',
    portal: 'portal',
    banco: 'banco',
    agencia: 'agencia',
    conta: 'conta',
    login: 'login',
    senha: 'senha'
  }
  
  const field = columnFieldMap[column] || column
  senhas.value[index][field] = value
  if (field === 'senha' && value) {
    senhas.value[index].temSenha = false
  }
  senhas.value[index].grupoCadastro = inferirGrupoCadastro(senhas.value[index])
  salvarSenhas()
}

const removerSenha = async (index) => {
  const item = senhas.value[index]
  try {
    await removerSenhaSupabase(item, { criterio: 'chave_composta' })
  } catch (e) {
    console.error('Erro ao remover senha no Supabase:', e)
  }
  senhas.value.splice(index, 1)
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  salvarSenhas()
  emit('salvou-senhas')
}

const abrirSeletorGrupo = () => {
  mostrarSeletorGrupo.value = true
}

const fecharSeletorGrupo = () => {
  mostrarSeletorGrupo.value = false
}

const selecionarGrupoNovaSenha = (grupo) => {
  adicionarSenha(grupo)
  fecharSeletorGrupo()
}

const adicionarSenha = (grupo = 'AUTORIZADORA') => {
  // Gerar ID único baseado no timestamp e índice
  const novoId = `senha_${Date.now()}_${senhas.value.length + 1}`
  
  const novaSenha = {
    id: novoId,
    empresaId: selectedEmpresaId.value || null,
    empresa: selectedEmpresaNome.value || '',
    ec: selectedEmpresaEC.value ?? '',
    adquirente: '',
    portal: '',
    banco: '',
    agencia: '',
    conta: '',
    login: '',
    senha: '',
    temSenha: false,
    grupoCadastro: grupo
  }
  senhas.value.push(novaSenha)
  isEditing.value = senhas.value.length - 1
  const ipp = itemsPerPage.value
  const tp = Math.max(1, Math.ceil(senhas.value.length / ipp))
  currentPage.value = tp
  salvarSenhas()
}

// Funções de redimensionamento
const startResize = (event, column) => {
  event.preventDefault()
  event.stopPropagation()
  
  if (!visibleColumns.value.includes(column)) {
    console.warn(`Coluna ${column} não está visível`)
    return
  }
  
  isResizing.value = true
  currentColumn.value = column
  startX.value = event.clientX
  startWidth.value = baseColumnWidths.value[column] || 150
  
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  
  console.log(`Iniciando redimensionamento da coluna: ${column}, largura inicial: ${startWidth.value}px`)
}

const onResize = (event) => {
  if (!isResizing.value || !currentColumn.value) return
  
  const diff = event.clientX - startX.value
  const newWidth = Math.max(80, startWidth.value + diff)
  
  baseColumnWidths.value[currentColumn.value] = newWidth
  baseColumnWidths.value = { ...baseColumnWidths.value }
}

const stopResize = () => {
  if (!isResizing.value) return
  
  console.log(`Finalizando redimensionamento da coluna: ${currentColumn.value}, nova largura: ${baseColumnWidths.value[currentColumn.value]}px`)
  
  isResizing.value = false
  currentColumn.value = ''
  
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  if (import.meta.client) {
    localStorage.setItem('senhas-column-widths', JSON.stringify(baseColumnWidths.value))
  }
}

// Funções de drag and drop para reordenar colunas
const onDragStart = (event, column, index) => {
  if (isResizing.value) {
    event.preventDefault()
    return
  }
  
  draggedColumn.value = column
  draggedIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/html', column)
}

const onDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

const onDrop = (event, targetIndex) => {
  event.preventDefault()
  
  if (draggedIndex.value !== -1 && draggedIndex.value !== targetIndex) {
    const newColumnOrder = [...columnOrder.value]
    const draggedItem = newColumnOrder.splice(draggedIndex.value, 1)[0]
    newColumnOrder.splice(targetIndex, 0, draggedItem)
    
    allColumns.value.splice(0, allColumns.value.length, ...newColumnOrder)
    
    if (import.meta.client) {
      localStorage.setItem('senhas-column-order', JSON.stringify(newColumnOrder))
    }
  }
}

const onDragEnd = () => {
  draggedColumn.value = ''
  draggedIndex.value = -1
}

const salvarSenhas = () => {
  salvarMapaGrupos(senhas.value)
  emit('update:modelValue', senhas.value)
}

const aplicarLargurasCompactas = (largura) => {
  if (largura >= 1800) {
    baseColumnWidths.value.id = 40
    baseColumnWidths.value.adquirente = 170
    return
  }

  if (largura >= 1440) {
    baseColumnWidths.value.id = 38
    baseColumnWidths.value.adquirente = 160
    return
  }

  baseColumnWidths.value.id = 34
  baseColumnWidths.value.adquirente = 145
}

const ajustarLargurasParaTela = () => {
  const largura = Number(windowWidth.value || (import.meta.client ? window.innerWidth : 0))

  if (!largura) return

  if (largura >= 1800) {
    baseColumnWidths.value = {
      ...baseColumnWidths.value,
      id: 40,
      empresa: 175,
      ec: 95,
      adquirente: 170,
      portal: 260,
      banco: 210,
      agencia: 150,
      conta: 190,
      login: 240,
      senha: 240,
      acoes: 120
    }
    return
  }

  if (largura >= 1440) {
    baseColumnWidths.value = {
      ...baseColumnWidths.value,
      id: 38,
      empresa: 165,
      ec: 92,
      adquirente: 160,
      portal: 225,
      banco: 185,
      agencia: 145,
      conta: 175,
      login: 215,
      senha: 215,
      acoes: 110
    }
    return
  }

  baseColumnWidths.value = {
    ...baseColumnWidths.value,
    id: 34,
    empresa: 150,
    ec: 86,
    adquirente: 145,
    portal: 210,
    banco: 170,
    agencia: 140,
    conta: 165,
    login: 195,
    senha: 195,
    acoes: 100
  }
}

// Watch para sincronizar com props
watch(() => props.modelValue, (newValue) => {
  senhas.value = Array.isArray(newValue) ? newValue.map(normalizarSenhaVisual) : []

  if (senhas.value.length === 0) {
    currentPage.value = 1
    isEditing.value = -1
    ultimoResultado.value = null
    mostrarSeletorGrupo.value = false
  }
}, { deep: true })

// Watch para emitir mudanças
watch(senhas, (newSenhas) => {
  if (JSON.stringify(newSenhas) !== JSON.stringify(props.modelValue)) {
    emit('update:modelValue', newSenhas)
  }
}, { deep: true })

// Carregar dados salvos
onMounted(() => {
  initializeResponsive()
  ajustarLargurasParaTela()

  if (props.modelValue.length > 0) {
    senhas.value = props.modelValue.map(normalizarSenhaVisual)
  }
  
  const largurasSalvas = localStorage.getItem('senhas-column-widths')
  if (largurasSalvas) {
    Object.assign(baseColumnWidths.value, JSON.parse(largurasSalvas))
    aplicarLargurasCompactas(Number(windowWidth.value || window.innerWidth || 0))
  }
  
  const ordemSalva = localStorage.getItem('senhas-column-order')
  if (ordemSalva) {
    const parsed = JSON.parse(ordemSalva)
    const validSaved = parsed.filter(col => allColumns.value.includes(col))
    const missing = allColumns.value.filter(col => !validSaved.includes(col))
    const merged = [...validSaved, ...missing]
    
    // Garantir que empresa e ec fiquem juntos
    const idxEmp = merged.indexOf('empresa')
    const idxEc = merged.indexOf('ec')
    if (idxEmp !== -1) {
      const desiredIdx = idxEmp + 1
      if (idxEc === -1) {
        merged.splice(desiredIdx, 0, 'ec')
      } else if (idxEc !== desiredIdx) {
        const [ecCol] = merged.splice(idxEc, 1)
        merged.splice(desiredIdx, 0, ecCol)
      }
    }

    // Garantir que login e senha fiquem ao lado de portal
    const idxPortal = merged.indexOf('portal')
    const idxLogin = merged.indexOf('login')
    const idxSenha = merged.indexOf('senha')
    if (idxPortal !== -1) {
      const desiredLoginIdx = idxPortal + 1
      if (idxLogin === -1) {
        merged.splice(desiredLoginIdx, 0, 'login')
      } else if (idxLogin !== desiredLoginIdx) {
        const [loginCol] = merged.splice(idxLogin, 1)
        merged.splice(desiredLoginIdx, 0, loginCol)
      }

      const idxLoginAtual = merged.indexOf('login')
      const desiredSenhaIdx = idxLoginAtual + 1
      if (idxSenha === -1) {
        merged.splice(desiredSenhaIdx, 0, 'senha')
      } else if (idxSenha !== desiredSenhaIdx) {
        const [senhaCol] = merged.splice(idxSenha, 1)
        merged.splice(desiredSenhaIdx, 0, senhaCol)
      }
    }
    
    allColumns.value.splice(0, allColumns.value.length, ...merged)
  }
})

watch(windowWidth, () => {
  if (!import.meta.client) return
  ajustarLargurasParaTela()
  aplicarLargurasCompactas(Number(windowWidth.value || window.innerWidth || 0))
})
</script>
