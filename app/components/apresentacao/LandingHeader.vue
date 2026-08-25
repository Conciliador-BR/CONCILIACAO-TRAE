<template>
  <header ref="headerRef" class="sticky top-0 z-30 border-b border-[#244b77] bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] backdrop-blur-xl transition-all duration-300" :class="{ 'header--compact': isCompact }">
    <div class="relative flex w-full items-center justify-between gap-6 px-8 py-7 transition-all duration-300 lg:px-12 2xl:px-16 header-inner">
      <div class="header-spacer flex min-w-0 flex-1" />

      <div class="header-logo-wrap">
        <img src="/economic-card-logo.png" alt="Economic Card" class="header-logo h-auto w-72 object-contain transition-all duration-300 sm:w-80 lg:w-96" />
      </div>

      <div class="header-actions flex min-h-[60px] shrink-0 items-center justify-end gap-7 transition-all duration-300 xl:gap-9">
        <a href="#solucoes" class="header-link hidden items-center whitespace-nowrap text-center text-sm font-semibold text-blue-100/85 transition hover:text-white md:inline-flex" @click.prevent="scrollToSection('solucoes')">
          Quem Somos
        </a>
        <a href="#prova-social" class="header-link hidden items-center whitespace-nowrap text-center text-sm font-semibold text-blue-100/85 transition hover:text-white md:inline-flex" @click.prevent="scrollToSection('prova-social')">
          Prova Social
        </a>
        <a href="#operacao" class="header-link hidden items-center whitespace-nowrap text-center text-sm font-semibold text-blue-100/85 transition hover:text-white md:inline-flex" @click.prevent="scrollToSection('operacao')">
          Consultoria
        </a>
        <a href="/login" class="header-link hidden items-center whitespace-nowrap text-center text-sm font-semibold text-white/80 transition hover:text-white lg:inline-flex">
          Acessar Portal
        </a>
        <a
          href="https://wa.me/5528999463616?text=Ol%C3%A1%2C%20quero%20uma%20demonstra%C3%A7%C3%A3o%20da%20Economic%20Card"
          target="_blank"
          rel="noopener noreferrer"
          class="header-cta ml-2 inline-flex items-center justify-center text-center rounded-full bg-white px-6 py-3 text-sm font-semibold leading-tight text-[#163a5a] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md xl:ml-4"
        >
          Fale com um especialista
        </a>
      </div>
    </div>
    <div class="h-1 bg-gradient-to-r from-[#73c77d] via-[#7ece89] to-[#8ad795]"></div>
  </header>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const isCompact = ref(false)
const headerRef = ref(null)

const handleScroll = () => {
  isCompact.value = window.scrollY > 24
}

const scrollToSection = async (id) => {
  const target = document.getElementById(id)
  if (!target) return

  // Compacta o header antes do scroll para o alinhamento final ficar rente ao titulo.
  isCompact.value = true
  await nextTick()

  requestAnimationFrame(() => {
    const headerHeight = headerRef.value?.offsetHeight ?? 0
    const extraGap = 8
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - extraGap

    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: 'smooth'
    })

    if (window.history?.replaceState) {
      window.history.replaceState(null, '', `#${id}`)
    }
  })
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.header--compact .header-inner {
  padding-top: 0.65rem;
  padding-bottom: 0.65rem;
}

.header-logo-wrap {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.header--compact .header-logo {
  width: clamp(11rem, 16vw, 15rem);
}

.header--compact .header-actions {
  min-height: 46px;
  gap: 1.1rem;
}

.header--compact .header-link {
  font-size: 0.82rem;
}

.header--compact .header-cta {
  padding: 0.6rem 1.1rem;
  font-size: 0.82rem;
}

.header-cta {
  min-width: 5.9rem;
}

.header-actions {
  margin-left: auto;
}

a {
  position: relative;
}

a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -0.35rem;
  width: 100%;
  height: 2px;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
  background: linear-gradient(90deg, #73c77d, #a7e7af);
}

a:hover::after {
  transform: scaleX(1);
}

@media (max-width: 768px) {
  .header-inner {
    justify-content: center;
  }

  .header--compact .header-inner {
    padding-top: 0.8rem;
    padding-bottom: 0.8rem;
  }

  .header--compact .header-logo {
    width: 11rem;
  }

  .header-actions {
    display: none;
  }

  .header-logo-wrap {
    position: static;
    transform: none;
    pointer-events: auto;
  }
}
</style>
