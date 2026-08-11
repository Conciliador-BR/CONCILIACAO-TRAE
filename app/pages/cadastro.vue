<template>
  <div class="page-fluid min-h-screen bg-[#F4F8FC]">
    <div class="w-full max-w-none mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-5 sm:py-6 space-y-6">
      <div class="rounded-[28px] border border-[#DCE7F3] bg-white shadow-[0_20px_50px_rgba(16,42,67,0.10)] overflow-hidden">
        <div class="h-1.5 bg-gradient-to-r from-[#5EC06B] via-[#83D487] to-[#B7E8BC]"></div>
        <div class="bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] px-5 sm:px-7 xl:px-10 py-6 sm:py-7 border-b border-[#244b77]">
          <div class="space-y-3">
              <span class="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
                Central de Cadastros
              </span>
              <div>
                <h1 class="text-2xl sm:text-3xl xl:text-4xl font-bold tracking-tight text-white">Cadastro</h1>
                <p class="mt-2 max-w-3xl text-sm sm:text-base text-[#D9E8F5]">
                  Organize taxas, acessos bancarios e configuracoes operacionais em um ambiente mais claro e consistente.
                </p>
              </div>
          </div>
        </div>

        <div class="bg-gradient-to-b from-[#F8FBFE] to-white px-4 sm:px-6 xl:px-10 py-5 sm:py-6">
          <div class="rounded-[24px] border border-[#DCE7F3] bg-white/90 p-2 shadow-[0_14px_30px_rgba(16,42,67,0.07)]">
            <nav class="grid gap-2 md:grid-cols-2">
              <NuxtLink
                to="/cadastro/cadastro-taxas"
                @click="registrarVisitaAba('taxas')"
                class="group rounded-[20px] border px-4 sm:px-5 py-4 transition-all duration-200"
                :class="$route.path === '/cadastro/cadastro-taxas' || $route.path === '/cadastro'
                  ? 'border-[#244b77] bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white shadow-lg shadow-[#102a43]/20'
                  : 'border-transparent bg-[#F7FAFC] text-[#486581] hover:border-[#C7D7E8] hover:bg-white hover:text-[#102A43] hover:shadow-md'"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-bold transition-colors"
                    :class="$route.path === '/cadastro/cadastro-taxas' || $route.path === '/cadastro'
                      ? 'border-white/20 bg-white/12 text-white'
                      : 'border-[#D8E4F0] bg-white text-[#1f4f77] group-hover:border-[#BFD3E6]'"
                  >
                    TX
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm sm:text-base font-semibold">Cadastro de Taxas</p>
                    <p
                      class="mt-1 text-xs sm:text-sm"
                      :class="$route.path === '/cadastro/cadastro-taxas' || $route.path === '/cadastro' ? 'text-white/75' : 'text-[#6B7C93]'"
                    >
                      Configure adquirentes, modalidades, parcelas e regras de cobranca.
                    </p>
                  </div>
                </div>
              </NuxtLink>

              <NuxtLink
                to="/cadastro/cadastro-senhas"
                @click="registrarVisitaAba('senhas')"
                class="group rounded-[20px] border px-4 sm:px-5 py-4 transition-all duration-200"
                :class="$route.path === '/cadastro/cadastro-senhas'
                  ? 'border-[#244b77] bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] text-white shadow-lg shadow-[#102a43]/20'
                  : 'border-transparent bg-[#F7FAFC] text-[#486581] hover:border-[#C7D7E8] hover:bg-white hover:text-[#102A43] hover:shadow-md'"
              >
                <div class="flex items-start gap-3">
                  <div
                    class="flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-bold transition-colors"
                    :class="$route.path === '/cadastro/cadastro-senhas'
                      ? 'border-white/20 bg-white/12 text-white'
                      : 'border-[#D8E4F0] bg-white text-[#1f4f77] group-hover:border-[#BFD3E6]'"
                  >
                    SB
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm sm:text-base font-semibold">Cadastro de Senhas e Bancos</p>
                    <p
                      class="mt-1 text-xs sm:text-sm"
                      :class="$route.path === '/cadastro/cadastro-senhas' ? 'text-white/75' : 'text-[#6B7C93]'"
                    >
                      Centralize dados de acesso, portais bancarios e informacoes operacionais.
                    </p>
                  </div>
                </div>
              </NuxtLink>
            </nav>
          </div>
        </div>
      </div>

      <div class="rounded-[28px] border border-[#DCE7F3] bg-white shadow-[0_18px_40px_rgba(16,42,67,0.08)] overflow-visible">
        <div class="h-1 bg-gradient-to-r from-[#5EC06B] via-[#83D487] to-[#B7E8BC]"></div>
        <div class="p-2 sm:p-4 lg:p-5 xl:p-6 2xl:p-8">
          <NuxtPage />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

// Configurações da página
useHead({
  title: 'Cadastro - MRF CONCILIAÇÃO',
  meta: [
    { name: 'description', content: 'Gestão de cadastros e configurações' }
  ]
})

// Composable para navegação do cadastro
const useCadastroNavigation = () => {
  const STORAGE_KEY = 'cadastro_ultima_aba'

  const carregarUltimaAba = () => {
    if (process.client) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && ['taxas', 'senhas'].includes(saved)) {
        return saved
      }
    }
    return 'taxas' // padrão
  }

  const salvarUltimaAba = (aba) => {
    if (process.client && ['taxas', 'senhas'].includes(aba)) {
      localStorage.setItem(STORAGE_KEY, aba)
    }
  }

  const obterRotaUltimaAba = () => {
    const aba = carregarUltimaAba()
    if (aba === 'senhas') return '/cadastro/cadastro-senhas'
    return '/cadastro/cadastro-taxas'
  }

  return {
    carregarUltimaAba,
    salvarUltimaAba,
    obterRotaUltimaAba
  }
}

const { carregarUltimaAba, salvarUltimaAba, obterRotaUltimaAba } = useCadastroNavigation()
const route = useRoute()

// Função para registrar visita a uma aba
const registrarVisitaAba = (aba) => {
  salvarUltimaAba(aba)
}

// Redirecionar para a última aba visitada se estiver na rota raiz
onMounted(() => {
  if (route.path === '/cadastro') {
    const rotaDestino = obterRotaUltimaAba()
    console.log('🔄 [CADASTRO] Redirecionando para última aba visitada:', rotaDestino)
    navigateTo(rotaDestino)
  }
})
</script>
