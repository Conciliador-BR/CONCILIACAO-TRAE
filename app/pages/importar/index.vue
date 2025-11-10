<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="bg-gradient-to-r from-gray-50 to-white px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 border-b border-gray-200">
          <h1 class="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-gray-900">Importação</h1>
          <p class="text-xs sm:text-sm lg:text-sm xl:text-base text-gray-600 mt-1">Importação de dados de vendas e bancos</p>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
          <nav class="flex flex-wrap gap-4 sm:gap-6 lg:gap-8">
            <button
              @click="abaAtiva = 'vendas'"
              :class="[
                'py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap',
                abaAtiva === 'vendas'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              ]"
            >
              Importação de Vendas
            </button>
            <button
              @click="abaAtiva = 'bancos'"
              :class="[
                'py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap',
                abaAtiva === 'bancos'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              ]"
            >
              Importação de Bancos
            </button>
            <!-- NOVO: Recebimentos -->
            <button
              @click="abaAtiva = 'recebimentos'"
              :class="[
                'py-3 px-4 sm:px-5 lg:px-6 rounded-lg font-medium text-xs sm:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap',
                abaAtiva === 'recebimentos'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              ]"
            >
              Importação de Recebimentos
            </button>
          </nav>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div class="p-4 sm:p-6 lg:p-8 xl:p-12">
          <div v-if="abaAtiva === 'vendas'">
            <Vendas />
          </div>
          <div v-if="abaAtiva === 'bancos'">
            <Bancos />
          </div>
          <!-- NOVO bloco -->
          <div v-if="abaAtiva === 'recebimentos'">
            <Recebimentos />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Vendas from './importar-vendas.vue'
import Bancos from './importar-bancos.vue'
import Recebimentos from './importar-recebimentos.vue'

const abaAtiva = ref('vendas')
</script>