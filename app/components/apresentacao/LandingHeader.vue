<template>
  <header ref="headerRef" class="sticky top-0 z-30 border-b border-[#244b77] bg-gradient-to-r from-[#102a43] via-[#163a5a] to-[#1f4f77] backdrop-blur-xl transition-all duration-300" :class="{ 'header--compact': isCompact }">
    <div class="header-inner relative flex w-full items-center justify-between gap-6 px-8 py-7 transition-all duration-300 lg:px-12 2xl:px-16">
      <button
        type="button"
        class="mobile-menu-button inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white md:hidden"
        :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
        aria-label="Abrir menu"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <svg v-if="!isMobileMenuOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5">
          <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5">
          <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
        </svg>
      </button>

      <div class="header-logo-wrap">
        <img src="/economic-card-logo.png" alt="Economic Card" class="header-logo h-auto w-72 object-contain transition-all duration-300 sm:w-80 lg:w-96" />
      </div>

      <div class="header-actions flex min-h-[60px] min-w-0 items-center justify-end gap-7 transition-all duration-300 xl:gap-9">
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
          <span class="header-cta-text">
            <span>Fale com</span>
            <span>um</span>
            <span>Especialista</span>
          </span>
        </a>
      </div>
    </div>

    <div v-if="isMobileMenuOpen" class="mobile-menu border-t border-white/10 px-4 pb-5 pt-3 md:hidden">
      <div class="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-[#102a43]/70 p-4 backdrop-blur-md">
        <a href="#solucoes" class="mobile-menu-link" @click.prevent="scrollToSection('solucoes')">
          Quem Somos
        </a>
        <a href="#prova-social" class="mobile-menu-link" @click.prevent="scrollToSection('prova-social')">
          Prova Social
        </a>
        <a href="#operacao" class="mobile-menu-link" @click.prevent="scrollToSection('operacao')">
          Consultoria
        </a>
        <a href="/login" class="mobile-menu-link">
          Acessar Portal
        </a>
        <a
          href="https://wa.me/5528999463616?text=Ol%C3%A1%2C%20quero%20uma%20demonstra%C3%A7%C3%A3o%20da%20Economic%20Card"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#163a5a]"
        >
          <span class="header-cta-text">
            <span>Fale com</span>
            <span>um</span>
            <span>Especialista</span>
          </span>
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
const isMobileMenuOpen = ref(false)

const handleScroll = () => {
  isCompact.value = window.scrollY > 24
}

const scrollToSection = async (id) => {
  const target = document.getElementById(id)
  if (!target) return
  isMobileMenuOpen.value = false

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
  display: flex;
  flex: 0 1 auto;
  justify-content: flex-start;
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

.header-cta-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.05;
  text-align: center;
}

.header-actions {
  flex: 1 1 auto;
  justify-self: end;
  justify-self: end;
}

.mobile-menu-button {
  justify-self: start;
}

.mobile-menu-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.9rem;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  font-weight: 600;
}

@media (max-width: 1380px) {
  .header-inner {
    gap: 1.25rem;
  }

  .header-logo {
    width: clamp(13.5rem, 19vw, 19rem);
  }

  .header-actions {
    min-width: 0;
    gap: 1rem;
  }

  .header-link {
    font-size: 0.9rem;
  }

  .header-cta {
    margin-left: 0.5rem;
    padding-left: 1.15rem;
    padding-right: 1.15rem;
    font-size: 0.9rem;
  }
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .header--compact .header-inner {
    padding-top: 0.8rem;
    padding-bottom: 0.8rem;
  }

  .header-logo {
    width: 15rem;
  }

  .header--compact .header-logo {
    width: 11rem;
  }

  .header-actions {
    display: none;
  }

  .header-logo-wrap {
    pointer-events: auto;
    flex: 1;
    justify-content: flex-start;
  }
}
</style>
