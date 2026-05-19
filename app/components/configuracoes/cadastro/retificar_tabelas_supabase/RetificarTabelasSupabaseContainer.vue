<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-5 sm:py-6">
      <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Retificar Tabelas no Supabase</h2>
      <p class="mt-1 text-xs sm:text-sm text-gray-600">Exclua tabelas da empresa em lote e retifique vendas/recebimentos por mês.</p>
    </div>

    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div class="px-4 sm:px-6 lg:px-8 xl:px-10 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900">1) Excluir Tabelas da Empresa</h3>
      </div>
      <div class="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-5">
        <SeletorEmpresaRetificacao
          v-model="empresaSelecionada"
          :empresas="empresas"
          :loading="loading"
          @buscar="buscarTabelas"
        />

        <ListaTabelasEmpresa
          v-if="tabelasEmpresa.length > 0"
          :tabelas="tabelasEmpresa"
          :selecionadas="tabelasSelecionadas"
          :todos-selecionados="todosSelecionados"
          @toggle-item="toggleTabela"
          @toggle-all="toggleTodas"
        />

        <div class="flex justify-end">
          <BotaoExcluirTabelas
            :loading="loading"
            :disabled="tabelasSelecionadas.length === 0"
            @click="confirmarEExcluirTabelas"
          />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div class="px-4 sm:px-6 lg:px-8 xl:px-10 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900">2) Excluir Vendas/Recebimentos por Adquirente e Mês</h3>
      </div>
      <div class="p-4 sm:p-6 lg:p-8 xl:p-10">
        <ExclusaoMovimentosForm
          :mes-referencia-atual="mesReferenciaAtual"
          :meses-selecionados="mesesSelecionados"
          :tipos="tiposSelecionados"
          :opcoes-adquirentes="opcoesAdquirentes"
          :adquirentes-selecionados="adquirentesSelecionados"
          :disabled="!podeExcluirMovimentos"
          :loading="loading"
          @update:mesReferenciaAtual="mesReferenciaAtual = $event"
          @adicionar-mes="adicionarMes"
          @remover-mes="removerMes"
          @toggle-tipo="toggleTipo"
          @toggle-adquirente="toggleAdquirente"
          @excluir="confirmarEExcluirMovimentos"
        />
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div class="px-4 sm:px-6 lg:px-8 xl:px-10 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900">3) Excluir Depósitos por Banco e Mês</h3>
      </div>
      <div class="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div class="md:col-span-4">
            <label class="block text-xs font-medium text-gray-700">Mês de referência (múltiplo)</label>
            <div class="mt-1 flex gap-2">
              <input
                :value="mesDepositoAtual"
                type="month"
                class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900"
                @input="mesDepositoAtual = $event.target.value"
              />
              <button
                type="button"
                class="rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-4 py-2 text-sm font-medium hover:bg-blue-100"
                @click="adicionarMesDeposito"
              >
                Adicionar
              </button>
            </div>
            <div v-if="mesesDepositoSelecionados.length > 0" class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="mes in mesesDepositoSelecionados"
                :key="mes"
                class="inline-flex items-center gap-2 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs text-gray-700"
              >
                {{ mes }}
                <button type="button" class="text-red-600" @click="removerMesDeposito(mes)">x</button>
              </span>
            </div>
          </div>
          <div class="md:col-span-8">
            <label class="block text-xs font-medium text-gray-700">Bancos</label>
            <div class="mt-2 max-h-36 overflow-auto border border-gray-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <label v-for="banco in opcoesBancos" :key="banco" class="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  :checked="bancosSelecionados.includes(banco)"
                  @change="toggleBanco(banco, $event.target.checked)"
                />
                {{ banco }}
              </label>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <button
            type="button"
            :disabled="!podeExcluirDepositos || loading"
            class="bg-amber-600 text-white px-5 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="confirmarEExcluirDepositos"
          >
            {{ loading ? 'Excluindo...' : 'Excluir Depósitos dos Meses' }}
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div class="px-4 sm:px-6 lg:px-8 xl:px-10 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900">4) Excluir Cadastro de Cliente (Tabela Empresas)</h3>
      </div>
      <div class="p-4 sm:p-6 lg:p-8 xl:p-10">
        <p class="text-sm text-gray-600 mb-4">
          Exclui todos os registros da empresa selecionada na tabela <span class="font-mono">empresas</span>.
        </p>
        <div class="flex justify-end">
          <button
            type="button"
            :disabled="!podeExcluirCadastro || loading"
            class="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="confirmarEExcluirCadastroCliente"
          >
            {{ loading ? 'Excluindo...' : 'Excluir Cadastro do Cliente' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="erro" class="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
      {{ erro }}
    </div>
    <div v-if="resultado" class="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
      Operação concluída com sucesso.
    </div>

    <RetificarConfirmacaoModal
      :open="modalAberto"
      :title="modalTitulo"
      :subtitle="modalSubtitulo"
      :message="modalMensagem"
      :confirm-label="modalAcaoLabel"
      :variant="modalVariante"
      :loading="loading"
      :require-password="modalRequerSenha"
      :password="modalSenha"
      :password-error="modalErroSenha"
      @cancel="fecharModalConfirmacao"
      @confirm="executarAcaoConfirmada"
      @update:password="modalSenha = $event"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useEmpresas } from '~/composables/useEmpresas'
import { useRetificarTabelasSupabase } from '~/composables/configuracoes/cadastro/retificar_tabelas_supabase/useRetificarTabelasSupabase'
import SeletorEmpresaRetificacao from './SeletorEmpresaRetificacao.vue'
import ListaTabelasEmpresa from './ListaTabelasEmpresa.vue'
import BotaoExcluirTabelas from './BotaoExcluirTabelas.vue'
import ExclusaoMovimentosForm from './ExclusaoMovimentosForm.vue'
import RetificarConfirmacaoModal from './RetificarConfirmacaoModal.vue'

const { empresas, fetchEmpresas } = useEmpresas()
const {
  loading,
  erro,
  resultado,
  normalizeIdentifier,
  listarTabelasEmpresa,
  listarTabelasPorNomes,
  excluirTabelas,
  excluirMovimentosPorMes,
  excluirDepositosPorBancoEMes,
  excluirCadastroCliente
} = useRetificarTabelasSupabase()

const empresaSelecionada = ref('')
const tabelasEmpresa = ref([])
const tabelasSelecionadas = ref([])
const mesReferenciaAtual = ref('')
const mesesSelecionados = ref([])
const tiposSelecionados = ref(['vendas', 'recebimento'])
const adquirentesSelecionados = ref([])
const mesDepositoAtual = ref('')
const mesesDepositoSelecionados = ref([])
const bancosSelecionados = ref([])
const SENHA_EXCLUSAO_CADASTRO = '848678'
const modalAberto = ref(false)
const modalTitulo = ref('')
const modalSubtitulo = ref('')
const modalMensagem = ref('')
const modalAcaoLabel = ref('Confirmar')
const modalVariante = ref('danger')
const modalRequerSenha = ref(false)
const modalSenha = ref('')
const modalErroSenha = ref('')
const acaoPendente = ref(null)
const buscaTabelasRequestId = ref(0)
const empresaReferenciaTabelas = ref('')

const uniqStrings = (values) => {
  const seen = new Set()
  const out = []
  for (const value of values || []) {
    const item = String(value || '').trim()
    if (!item) continue
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

const splitListInput = (raw) => {
  return uniqStrings(
    String(raw || '')
      .split(/[,\n;|/]+/g)
      .map(item => item.trim())
      .filter(Boolean)
  )
}

const empresaSelecionadaDetalhes = computed(() => {
  const nome = String(empresaSelecionada.value || '').trim()
  if (!nome) return null
  return (empresas.value || []).find(empresa => String(empresa?.nome || '').trim() === nome) || null
})

const candidatosBuscaEmpresa = computed(() => {
  const empresa = empresaSelecionadaDetalhes.value
  return uniqStrings([
    empresaSelecionada.value,
    empresa?.nome,
    empresa?.nomeMatriz,
    empresa?.matriz,
    empresa?.displayName
  ])
})

const opcoesAdquirentes = computed(() => {
  const candidatosNorm = uniqStrings([
    empresaReferenciaTabelas.value,
    ...candidatosBuscaEmpresa.value
  ])
    .map(item => normalizeIdentifier(item))
    .filter(Boolean)

  const out = new Set()
  for (const item of tabelasEmpresa.value || []) {
    const tableName = String(item?.table_name || '')
    for (const empNorm of candidatosNorm) {
      if (tableName.startsWith(`vendas_${empNorm}_`)) {
        out.add(tableName.replace(`vendas_${empNorm}_`, ''))
        break
      }
      if (tableName.startsWith(`recebimento_${empNorm}_`)) {
        out.add(tableName.replace(`recebimento_${empNorm}_`, ''))
        break
      }
    }
  }
  return Array.from(out).sort()
})

const opcoesBancos = computed(() => {
  const candidatosNorm = uniqStrings([
    empresaReferenciaTabelas.value,
    ...candidatosBuscaEmpresa.value
  ])
    .map(item => normalizeIdentifier(item))
    .filter(Boolean)

  const out = new Set()
  for (const item of tabelasEmpresa.value || []) {
    const tableName = String(item?.table_name || '')
    if (String(item?.category || '') !== 'banco') continue
    for (const empNorm of candidatosNorm) {
      const suffix = `_${empNorm}`
      if (tableName.startsWith('banco_') && tableName.endsWith(suffix)) {
        const banco = tableName.slice('banco_'.length, tableName.length - suffix.length)
        if (banco) out.add(banco)
        break
      }
    }
  }
  return Array.from(out).sort()
})

const todosSelecionados = computed(() => {
  return tabelasEmpresa.value.length > 0 && tabelasSelecionadas.value.length === tabelasEmpresa.value.length
})

const podeExcluirMovimentos = computed(() => {
  return !!empresaSelecionada.value && mesesSelecionados.value.length > 0 && tiposSelecionados.value.length > 0 && adquirentesSelecionados.value.length > 0
})

const podeExcluirDepositos = computed(() => {
  return !!empresaSelecionada.value && mesesDepositoSelecionados.value.length > 0 && bancosSelecionados.value.length > 0
})

const podeExcluirCadastro = computed(() => {
  return !!empresaSelecionada.value
})

const limparSelecoesEmpresa = () => {
  tabelasSelecionadas.value = []
  adquirentesSelecionados.value = []
  bancosSelecionados.value = []
  empresaReferenciaTabelas.value = ''
}

const buildTabelasFallback = () => {
  const empresa = empresaSelecionadaDetalhes.value
  const empresasNorm = uniqStrings(candidatosBuscaEmpresa.value)
    .map(item => normalizeIdentifier(item))
    .filter(Boolean)

  const providersNorm = uniqStrings([
    ...splitListInput(empresa?.autorizadoras),
    ...splitListInput(empresa?.adquirentes)
  ])
    .map(item => normalizeIdentifier(item))
    .filter(Boolean)

  const bancosNorm = splitListInput(empresa?.bancos)
    .map(item => normalizeIdentifier(item))
    .filter(Boolean)

  const out = new Set()

  for (const emp of empresasNorm) {
    out.add(`vendas_pix_${emp}`)
    out.add(`recebimento_pix_${emp}`)

    for (const provider of providersNorm) {
      out.add(`vendas_${emp}_${provider}`)
      out.add(`recebimento_${emp}_${provider}`)
    }

    for (const banco of bancosNorm) {
      out.add(`banco_${banco}_${emp}`)
    }
  }

  return Array.from(out)
}

const buscarTabelas = async (empresa = empresaSelecionada.value) => {
  const empresaAtual = String(empresa || '').trim()
  const requestId = ++buscaTabelasRequestId.value

  limparSelecoesEmpresa()
  tabelasEmpresa.value = []

  if (!empresaAtual) return

  const mapasTabelas = new Map()
  let referenciaEncontrada = ''

  for (const candidato of candidatosBuscaEmpresa.value) {
    const tabelas = await listarTabelasEmpresa(candidato)
    if (requestId !== buscaTabelasRequestId.value) return
    if (empresaAtual !== String(empresaSelecionada.value || '').trim()) return

    if (!referenciaEncontrada && Array.isArray(tabelas) && tabelas.length > 0) {
      referenciaEncontrada = candidato
    }

    for (const tabela of Array.isArray(tabelas) ? tabelas : []) {
      const tableName = String(tabela?.table_name || '').trim()
      if (!tableName) continue
      if (!mapasTabelas.has(tableName)) {
        mapasTabelas.set(tableName, tabela)
      }
    }
  }

  if (mapasTabelas.size === 0) {
    const tabelasFallback = await listarTabelasPorNomes(buildTabelasFallback())
    if (requestId !== buscaTabelasRequestId.value) return
    if (empresaAtual !== String(empresaSelecionada.value || '').trim()) return

    if (!referenciaEncontrada && tabelasFallback.length > 0) {
      referenciaEncontrada = empresaAtual
    }

    for (const tabela of tabelasFallback) {
      const tableName = String(tabela?.table_name || '').trim()
      if (!tableName) continue
      if (!mapasTabelas.has(tableName)) {
        mapasTabelas.set(tableName, tabela)
      }
    }
  }

  if (requestId !== buscaTabelasRequestId.value) return
  if (empresaAtual !== String(empresaSelecionada.value || '').trim()) return

  empresaReferenciaTabelas.value = referenciaEncontrada || empresaAtual
  tabelasEmpresa.value = Array.from(mapasTabelas.values())
}

const toggleTabela = (tableName, checked) => {
  if (checked) {
    if (!tabelasSelecionadas.value.includes(tableName)) {
      tabelasSelecionadas.value.push(tableName)
    }
  } else {
    tabelasSelecionadas.value = tabelasSelecionadas.value.filter(t => t !== tableName)
  }
}

const toggleTodas = (checked) => {
  tabelasSelecionadas.value = checked ? tabelasEmpresa.value.map(t => t.table_name) : []
}

const confirmarEExcluirTabelas = async () => {
  abrirModalConfirmacao({
    titulo: 'Excluir tabelas da empresa',
    subtitulo: 'Ação irreversível',
    mensagem: `Tem certeza que deseja excluir ${tabelasSelecionadas.value.length} tabela(s) no Supabase?`,
    acaoLabel: 'Excluir Tabelas',
    variante: 'danger',
    requerSenha: true,
    onConfirm: async () => {
      await excluirTabelas(tabelasSelecionadas.value)
      await buscarTabelas()
    }
  })
}

const toggleTipo = (tipo, checked) => {
  if (checked) {
    if (!tiposSelecionados.value.includes(tipo)) tiposSelecionados.value.push(tipo)
  } else {
    tiposSelecionados.value = tiposSelecionados.value.filter(t => t !== tipo)
  }
}

const toggleAdquirente = (adquirente, checked) => {
  if (checked) {
    if (!adquirentesSelecionados.value.includes(adquirente)) adquirentesSelecionados.value.push(adquirente)
  } else {
    adquirentesSelecionados.value = adquirentesSelecionados.value.filter(a => a !== adquirente)
  }
}

const confirmarEExcluirMovimentos = async () => {
  abrirModalConfirmacao({
    titulo: 'Excluir vendas/recebimentos',
    subtitulo: 'Retificação por adquirente e mês',
    mensagem: `Confirma a exclusão dos movimentos para ${mesesSelecionados.value.length} mês(es) selecionados?`,
    acaoLabel: 'Excluir Movimentos',
    variante: 'danger',
    requerSenha: true,
    onConfirm: async () => {
      await excluirMovimentosPorMes({
        empresa: empresaReferenciaTabelas.value || empresaSelecionada.value,
        adquirentes: adquirentesSelecionados.value,
        mesesReferencia: mesesSelecionados.value,
        tipos: tiposSelecionados.value
      })
    }
  })
}

const adicionarMes = () => {
  const mes = String(mesReferenciaAtual.value || '').trim()
  if (!mes) return
  if (!mesesSelecionados.value.includes(mes)) {
    mesesSelecionados.value.push(mes)
    mesesSelecionados.value.sort()
  }
  mesReferenciaAtual.value = ''
}

const removerMes = (mes) => {
  mesesSelecionados.value = mesesSelecionados.value.filter(m => m !== mes)
}

const adicionarMesDeposito = () => {
  const mes = String(mesDepositoAtual.value || '').trim()
  if (!mes) return
  if (!mesesDepositoSelecionados.value.includes(mes)) {
    mesesDepositoSelecionados.value.push(mes)
    mesesDepositoSelecionados.value.sort()
  }
  mesDepositoAtual.value = ''
}

const removerMesDeposito = (mes) => {
  mesesDepositoSelecionados.value = mesesDepositoSelecionados.value.filter(m => m !== mes)
}

const toggleBanco = (banco, checked) => {
  if (checked) {
    if (!bancosSelecionados.value.includes(banco)) bancosSelecionados.value.push(banco)
  } else {
    bancosSelecionados.value = bancosSelecionados.value.filter(b => b !== banco)
  }
}

const confirmarEExcluirDepositos = async () => {
  abrirModalConfirmacao({
    titulo: 'Excluir depósitos por banco',
    subtitulo: 'Retificação de extratos bancários',
    mensagem: `Confirma a exclusão dos depósitos para ${mesesDepositoSelecionados.value.length} mês(es) selecionados?`,
    acaoLabel: 'Excluir Depósitos',
    variante: 'danger',
    requerSenha: true,
    onConfirm: async () => {
      await excluirDepositosPorBancoEMes({
        empresa: empresaReferenciaTabelas.value || empresaSelecionada.value,
        bancos: bancosSelecionados.value,
        mesesReferencia: mesesDepositoSelecionados.value
      })
    }
  })
}

const confirmarEExcluirCadastroCliente = async () => {
  abrirModalConfirmacao({
    titulo: 'Excluir cadastro do cliente',
    subtitulo: 'Tabela empresas',
    mensagem: 'Tem certeza que deseja excluir o cadastro da empresa selecionada na tabela empresas?',
    acaoLabel: 'Excluir Cadastro',
    variante: 'danger',
    requerSenha: true,
    onConfirm: async () => {
      await excluirCadastroCliente({
        empresa: empresaSelecionada.value
      })
      await fetchEmpresas()
    }
  })
}

const abrirModalConfirmacao = ({
  titulo,
  subtitulo = '',
  mensagem,
  acaoLabel = 'Confirmar',
  variante = 'danger',
  requerSenha = false,
  onConfirm
}) => {
  modalTitulo.value = titulo
  modalSubtitulo.value = subtitulo
  modalMensagem.value = mensagem
  modalAcaoLabel.value = acaoLabel
  modalVariante.value = variante
  modalRequerSenha.value = !!requerSenha
  modalSenha.value = ''
  modalErroSenha.value = ''
  acaoPendente.value = onConfirm
  modalAberto.value = true
}

const fecharModalConfirmacao = () => {
  if (loading.value) return
  modalAberto.value = false
  modalSenha.value = ''
  modalErroSenha.value = ''
  acaoPendente.value = null
}

const executarAcaoConfirmada = async () => {
  if (modalRequerSenha.value && String(modalSenha.value || '').trim() !== SENHA_EXCLUSAO_CADASTRO) {
    modalErroSenha.value = 'Senha incorreta.'
    return
  }

  modalErroSenha.value = ''
  if (typeof acaoPendente.value === 'function') {
    await acaoPendente.value()
  }
  if (!erro.value) {
    fecharModalConfirmacao()
  }
}

onMounted(async () => {
  await fetchEmpresas()
})

watch(empresaSelecionada, async (novaEmpresa, empresaAnterior) => {
  if (novaEmpresa === empresaAnterior) return
  await buscarTabelas(novaEmpresa)
})
</script>
