<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo e Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Conciliação e Consultoria</h1>
        <p class="text-blue-200">Sistema Inteligente de Conciliação Financeira</p>
      </div>

      <!-- Card de Login -->
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 shadow-2xl">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-blue-200">
              E-mail
            </label>
            <div class="relative">
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="seu@email.com"
                :disabled="loading"
              />
              <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label for="password" class="block text-sm font-medium text-blue-200">
              Senha
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                :disabled="loading"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Mensagem de Erro -->
          <LoginErrorMessage v-if="error" :message="error" />

          <!-- Botão de Login -->
          <button
            type="submit"
            :disabled="loading || !email || !password"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <LoginSpinner v-if="loading" />
            <span>{{ loading ? 'Entrando...' : 'Entrar' }}</span>
          </button>

          <!-- Links Adicionais -->
  <div class="text-center space-y-2">
    <button
      type="button"
      @click="handleForgotPassword"
      class="text-blue-300 hover:text-blue-200 text-sm transition-colors duration-200"
    >
      Esqueceu sua senha?
    </button>
    <div>
      <button
        type="button"
        @click="showSignUpModal = true"
        class="text-blue-300 hover:text-blue-200 text-sm transition-colors duration-200"
      >
        Não tem conta? Criar conta
      </button>
    </div>
  </div>
        </form>

        <!-- Features do Sistema -->
        <div class="mt-8 pt-6 border-t border-white/20">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div class="space-y-1">
              <div class="w-8 h-8 bg-blue-600 rounded-lg mx-auto flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-xs text-blue-300">Conciliação Automática</p>
            </div>
            <div class="space-y-1">
              <div class="w-8 h-8 bg-blue-600 rounded-lg mx-auto flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p class="text-xs text-blue-300">Relatórios DRE</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de Recuperação de Senha -->
  <ForgotPasswordModal
    v-if="showForgotModal"
    @close="showForgotModal = false"
    @reset="handlePasswordReset"
  />
  <SignUpModal
    v-if="showSignUpModal"
    @close="showSignUpModal = false"
    @signup="handleSignUp"
  />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import LoginErrorMessage from '~/components/auth/LoginErrorMessage.vue'
import LoginSpinner from '~/components/auth/LoginSpinner.vue'
import ForgotPasswordModal from '~/components/auth/ForgotPasswordModal.vue'
import SignUpModal from '~/components/auth/SignUpModal.vue'

// Estado
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const showForgotModal = ref(false)
const showSignUpModal = ref(false)
const loading = ref(false)
const error = ref('')

// Composables
const { login } = useAuth()
const router = useRouter()

// Handlers
const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const result = await login(email.value, password.value)
    
    if (result.success) {
      router.push('/dashboard')
    } else {
      error.value = result.error
    }
  } catch (err) {
    error.value = 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
}

const handleForgotPassword = () => {
  showForgotModal.value = true
}

const handlePasswordReset = async (resetEmail) => {
  try {
    const { resetPassword } = useAuth()
    const result = await resetPassword(resetEmail)
    
    if (result.success) {
      alert('E-mail de recuperação enviado com sucesso!')
    } else {
      alert('Erro ao enviar e-mail: ' + result.error)
    }
  } catch (err) {
    alert('Erro ao enviar e-mail de recuperação')
  }
}

const handleSignUp = async ({ email: signupEmail, password: signupPassword }) => {
  try {
    const { signUp } = useAuth()
    const result = await signUp(signupEmail, signupPassword)
    if (result.success) {
      showSignUpModal.value = false
      alert('Cadastro realizado! Se necessário, confirme seu e-mail para acessar.')
    } else {
      alert('Erro no cadastro: ' + result.error)
    }
  } catch (err) {
    alert('Erro ao cadastrar usuário')
  }
}

// SEO
useHead({
  title: 'Login - MRF Conciliações e Consultoria',
  meta: [
    { name: 'description', content: 'Acesse o sistema inteligente de conciliação financeira' }
  ]
})
</script>