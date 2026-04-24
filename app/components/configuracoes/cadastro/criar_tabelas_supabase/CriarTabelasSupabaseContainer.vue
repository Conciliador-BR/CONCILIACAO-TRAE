<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-5 sm:py-6">
      <div class="flex flex-col gap-2">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Criar Tabelas no Supabase</h2>
            <p class="mt-1 text-xs sm:text-sm text-gray-600">Gera automaticamente tabelas para adquirentes, vouchers e bancos.</p>
          </div>
          <div class="hidden sm:flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
            Importar → Admin
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <div class="xl:col-span-8 space-y-6">
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div class="px-4 sm:px-6 lg:px-8 xl:px-10 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900">Formulário</h3>
            <p class="mt-1 text-xs sm:text-sm text-gray-600">Responda as perguntas para definir quais tabelas serão criadas.</p>
          </div>

          <div class="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div class="lg:col-span-7">
                <label class="block text-xs font-medium text-gray-700">Nome da empresa</label>
                <select
                  v-model="empresa"
                  class="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                >
                  <option value="">Selecione uma empresa cadastrada</option>
                  <option v-for="item in empresas" :key="item.id" :value="item.nome">
                    {{ item.displayName || item.nome }}
                  </option>
                </select>
                <p class="mt-2 text-xs text-gray-500">Lista baseada na tabela de empresas cadastradas.</p>
                <p v-if="empresas.length === 0" class="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Nenhuma empresa cadastrada encontrada. Cadastre em "Cadastro do Cliente".
                </p>
              </div>

              <div class="lg:col-span-5">
                <label class="block text-xs font-medium text-gray-700">Prévia da empresa</label>
                <div class="mt-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p class="text-sm font-semibold text-gray-900">{{ empresaPreview }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ empresaNormalizada || 'empresa_nao_informada' }}</p>
                </div>
              </div>
            </div>

            <MultiSelectChips
              v-model="adquirentes"
              titulo="1) Qual adquirente a empresa trabalha?"
              descricao="Ex: Rede, Stone, Única, PagSeguro, Cielo"
              :opcoes="opcoesAdquirentes"
              permitir-personalizado
            />

            <MultiSelectChips
              v-model="vouchers"
              titulo="2) Quais vouchers a empresa trabalha?"
              descricao="Ex: Pluxee, Up Brasil, Comprocard, Alelo, Ticket"
              :opcoes="opcoesVouchers"
              permitir-personalizado
            />

            <MultiSelectChips
              v-model="bancos"
              titulo="3) Quais bancos a empresa trabalha?"
              descricao="Ex: Itaú, Sicoob, Caixa, Bradesco, Santander"
              :opcoes="opcoesBancos"
              permitir-personalizado
            />

            <div class="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-gray-900">4) Deseja criar tabelas PIX no Supabase?</p>
                  <p class="mt-1 text-xs text-gray-600">Se ativado, serão criadas as tabelas `vendas_pix_empresa` e `recebimento_pix_empresa`.</p>
                </div>
                <label class="inline-flex items-center gap-2 text-xs font-medium text-gray-700 select-none">
                  <input v-model="criarPix" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-200" />
                  Criar PIX
                </label>
              </div>
            </div>

            <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-gray-900">Confirmação</p>
                  <p class="mt-1 text-xs text-gray-600">Ao criar, serão geradas tabelas no banco do Supabase.</p>
                </div>
                <label class="inline-flex items-center gap-2 text-xs font-medium text-gray-700 select-none">
                  <input v-model="confirmacao" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-200" />
                  Entendi e quero criar
                </label>
              </div>
            </div>

            <ActionBar
              :disabled="!podeCriar"
              :loading="loading"
              @criar="handleCriar"
            />

            <ResultPanel
              :resultado="resultado"
              :erro="erro"
            />
          </div>
        </div>
      </div>

      <div class="xl:col-span-4">
        <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div class="px-4 sm:px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
            <h3 class="text-base sm:text-lg font-semibold text-gray-900">Prévia</h3>
            <p class="mt-1 text-xs sm:text-sm text-gray-600">Veja exatamente o que será criado.</p>
          </div>
          <div class="p-4 sm:p-6">
            <PreviewTabelas
              :empresa="empresa"
              :adquirentes="adquirentes"
              :vouchers="vouchers"
              :bancos="bancos"
              :pix="criarPix"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import MultiSelectChips from '~/components/configuracoes/cadastro/criar_tabelas_supabase/MultiSelectChips.vue'
import PreviewTabelas from '~/components/configuracoes/cadastro/criar_tabelas_supabase/PreviewTabelas.vue'
import ActionBar from '~/components/configuracoes/cadastro/criar_tabelas_supabase/ActionBar.vue'
import ResultPanel from '~/components/configuracoes/cadastro/criar_tabelas_supabase/ResultPanel.vue'
import { useCriarTabelasSupabase } from '~/composables/configuracoes/cadastro/criar_tabelas_supabase/useCriarTabelasSupabase.js'
import { useEmpresas } from '~/composables/useEmpresas'

const empresa = ref('')
const adquirentes = ref([])
const vouchers = ref([])
const bancos = ref([])
const criarPix = ref(false)
const confirmacao = ref(false)

const opcoesAdquirentes = [
  { id: 'rede', label: 'Rede' },
  { id: 'stone', label: 'Stone' },
  { id: 'unica', label: 'Única' },
  { id: 'pagseguro', label: 'PagSeguro' },
  { id: 'cielo', label: 'Cielo' },
  { id: 'sipag', label: 'Sipag' },
  { id: 'azulzinha', label: 'Azulzinha' },
  { id: 'getnet', label: 'Getnet' }
]

const opcoesVouchers = [
  { id: 'pluxee', label: 'Pluxee' },
  { id: 'up_brasil', label: 'Up Brasil' },
  { id: 'comprocard', label: 'Comprocard' },
  { id: 'le_card', label: 'Le Card' },
  { id: 'alelo', label: 'Alelo' },
  { id: 'ticket', label: 'Ticket' },
  { id: 'vr', label: 'VR' },
  { id: 'verocard', label: 'Verocard' },
  { id: 'green_card', label: 'Green Card' },
  { id: 'big_card', label: 'Big Card' },
  { id: 'brasilcard', label: 'Brasilcard' },
  { id: 'cabal', label: 'Cabal' },
  { id: 'nutricash', label: 'Nutricash' }
]

const opcoesBancos = [
  { id: 'itau', label: 'Itaú' },
  { id: 'sicoob', label: 'Sicoob' },
  { id: 'caixa', label: 'Caixa' },
  { id: 'sicredi', label: 'Sicredi' },
  { id: 'bradesco', label: 'Bradesco' },
  { id: 'banestes', label: 'Banestes' },
  { id: 'nordeste', label: 'Nordeste' },
  { id: 'santander', label: 'Santander' },
  { id: 'tribanco', label: 'Tribanco' }
]

const { normalizeIdentifier, criarTabelas, loading, erro, resultado, resetResultado } = useCriarTabelasSupabase()
const { empresas, fetchEmpresas } = useEmpresas()

const empresaNormalizada = computed(() => normalizeIdentifier(empresa.value))
const empresaPreview = computed(() => (empresa.value || 'Não informado'))

const podeCriar = computed(() => {
  const temEmpresa = empresaNormalizada.value.length > 0
  const temAlgumaSelecao = adquirentes.value.length + vouchers.value.length + bancos.value.length > 0 || criarPix.value
  return temEmpresa && temAlgumaSelecao && confirmacao.value && !loading.value
})

const handleCriar = async () => {
  resetResultado()
  await criarTabelas({
    empresa: empresa.value,
    adquirentes: adquirentes.value,
    vouchers: vouchers.value,
    bancos: bancos.value,
    pix: criarPix.value
  })
}

onMounted(async () => {
  await fetchEmpresas()
})
</script>
