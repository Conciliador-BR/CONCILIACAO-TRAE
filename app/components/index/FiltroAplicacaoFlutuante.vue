<template>
  <Transition
    enter-active-class="transition duration-250 ease-out"
    enter-from-class="scale-95 opacity-0"
    enter-to-class="scale-100 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="scale-100 opacity-100"
    leave-to-class="scale-95 opacity-0"
  >
    <div
      v-if="open"
      class="pointer-events-none fixed inset-0 z-[1200] flex items-center justify-center px-4"
    >
      <div class="absolute inset-0 bg-slate-950/28 backdrop-blur-[4px]"></div>

      <div class="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[#D8E5F2] bg-white shadow-[0_30px_90px_rgba(16,42,67,0.28)]">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#73c77d] via-[#8ad795] to-[#244b77]"></div>
        <div class="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#DCEEFF] blur-3xl"></div>
        <div class="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-[#DBF5E1] blur-3xl"></div>

        <div class="relative p-6 sm:p-7">
          <div class="flex items-start gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#102a43] via-[#163a5a] to-[#1f4f77] shadow-lg ring-4 ring-[#EAF3FF]">
              <div class="h-6 w-6 animate-spin rounded-full border-[2.5px] border-white/25 border-t-white"></div>
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#486581]">
                Filtro Global
              </p>
              <p class="mt-1 text-lg font-bold text-[#102A43] sm:text-xl">{{ titulo }}</p>
              <p class="mt-2 text-sm leading-6 text-[#486581]">{{ descricao }}</p>
            </div>
          </div>

          <div class="relative mt-5 overflow-hidden rounded-2xl border border-[#D6E4F2] bg-white px-4 py-3 shadow-sm">
            <div class="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#F1F7FF] to-transparent"></div>
            <div class="relative flex items-center justify-between gap-4">
              <div class="flex items-center gap-2 text-xs font-medium text-[#334E68]">
                <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2F9E44]"></span>
                <span>Somos a melhor conciliadora do brasil</span>
              </div>
              <div class="flex items-end gap-1">
                <span class="h-2 w-1.5 animate-pulse rounded-full bg-[#244b77]"></span>
                <span class="h-3.5 w-1.5 animate-pulse rounded-full bg-[#3C74B2]" style="animation-delay: 0.15s"></span>
                <span class="h-5 w-1.5 animate-pulse rounded-full bg-[#73c77d]" style="animation-delay: 0.3s"></span>
                <span class="h-3.5 w-1.5 animate-pulse rounded-full bg-[#3C74B2]" style="animation-delay: 0.45s"></span>
                <span class="h-2 w-1.5 animate-pulse rounded-full bg-[#244b77]" style="animation-delay: 0.6s"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  titulo: { type: String, default: 'Aplicando filtros' },
  descricao: { type: String, default: 'Carregando dados...' }
})
</script>
