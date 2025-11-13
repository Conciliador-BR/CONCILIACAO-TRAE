<template>
  <div>
    <button
      class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-60"
      :disabled="sending"
      @click="handleSend"
    >
      <span v-if="!sending">Enviar Auditoria</span>
      <span v-else>Enviando...</span>
    </button>
    <ProgressModal
      :visible="visible"
      :percent="percent"
      :sent="sent"
      :skipped="skipped"
      :errors="errors"
      :message="message"
      title="Enviando Auditoria"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useEnviarAuditoriaComProgresso } from '~/composables/analytics-financeiro/useEnviarAuditoriaComProgresso'
import ProgressModal from '~/components/ui/ProgressModal.vue'

const sending = ref(false)
const { enviarAuditoriaComProgresso, visible, percent, sent, skipped, errors, message } = useEnviarAuditoriaComProgresso()

const handleSend = async () => {
  if (sending.value) return
  sending.value = true
  try {
    const res = await enviarAuditoriaComProgresso()
    const msg = `Auditoria enviada. Atualizados: ${res.updated}, Ignorados: ${res.skipped}, Erros: ${res.errors}`
    alert(msg)
  } catch (e) {
    alert('Erro ao enviar auditoria')
  } finally {
    sending.value = false
  }
}
</script>
