<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-lg font-semibold mb-4">Leitura de PDF - Sicoob</h3>
    <div class="border-2 border-dashed rounded-lg p-6 text-center">
      <input ref="fileInput" type="file" accept=".pdf" class="hidden" @change="handleFile" />
      <div v-if="!arquivo">
        <p class="text-sm mb-3">Selecione o extrato em PDF do Sicoob</p>
        <button class="bg-green-600 text-white px-4 py-2 rounded" @click="$refs.fileInput.click()">Selecionar PDF</button>
      </div>
      <div v-else class="text-left">
        <p class="text-sm font-medium">{{ arquivo.name }}</p>
        <p class="text-xs text-gray-500">{{ formatSize(arquivo.size) }}</p>
        <div class="mt-3 flex gap-2">
          <button class="bg-green-600 text-white px-3 py-1 rounded" :disabled="processando" @click="processar">Processar</button>
          <button class="bg-gray-200 text-gray-700 px-3 py-1 rounded" @click="remover">Remover</button>
        </div>
      </div>
    </div>

    <div v-if="status === 'erro'" class="mt-4 text-red-600 text-sm">{{ mensagemErro }}</div>

    <div v-if="transacoes.length > 0" class="mt-6">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-md font-semibold">Transações</h4>
        <span class="text-sm">Total: {{ transacoes.length }}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full text-xs">
          <thead>
            <tr class="text-left bg-gray-50">
              <th class="px-2 py-2">Data</th>
              <th class="px-2 py-2">Descrição</th>
              <th class="px-2 py-2">Adquirente</th>
              <th class="px-2 py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(t, i) in transacoes" :key="i" class="border-b">
              <td class="px-2 py-1">{{ t.data }}</td>
              <td class="px-2 py-1">{{ t.descricao }}</td>
              <td class="px-2 py-1">{{ t.adquirente }}</td>
              <td class="px-2 py-1 text-right" :class="t.valorNumerico >= 0 ? 'text-green-700' : 'text-red-700'">{{ t.valor }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <DetectadorAdquirentesSicoob v-if="transacoes.length > 0" :transacoes="transacoes" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSicoob } from '~/composables/importacao/importacao_bancos/useSicoob'
import DetectadorAdquirentesSicoob from './DetectadorAdquirentesSicoob.vue'

const arquivo = ref(null)
const status = ref('idle')
const mensagemErro = ref('')
const transacoes = ref([])
const { processarPDF, processando } = useSicoob()

const handleFile = (e) => {
  arquivo.value = e.target.files[0] || null
  status.value = 'idle'
  mensagemErro.value = ''
  transacoes.value = []
}

const remover = () => {
  arquivo.value = null
  status.value = 'idle'
  mensagemErro.value = ''
  transacoes.value = []
}

const processar = async () => {
  if (!arquivo.value) return
  status.value = 'processando'
  try {
    const resultado = await processarPDF(arquivo.value)
    if (resultado.sucesso) {
      transacoes.value = resultado.transacoes
      status.value = 'sucesso'
      emit('processado', { transacoes: resultado.transacoes, total: resultado.total })
    } else {
      throw new Error(resultado.erro || 'Falha ao processar PDF')
    }
  } catch (err) {
    mensagemErro.value = err.message
    status.value = 'erro'
  }
}

const emit = defineEmits(['processado'])

const formatSize = (bytes) => {
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
