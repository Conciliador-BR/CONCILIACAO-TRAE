<template>
  <header
    ref="headerRef"
    class="landing-header"
    :class="{
      'header--compact': isCompact,
      'header--menu-open': isMobileMenuOpen,
      'landing-header--in-hero': inHero,
      'landing-header--floating': floating
    }"
  >
    <div class="header-inner">
      <div class="header-bar">
        <a href="/" class="header-brand" aria-label="Economic Card">
          <img
            src="/economic-card-logo.png"
            alt="Economic Card"
            class="header-brand__logo"
          >
        </a>

        <nav class="header-nav" aria-label="Navegacao principal">
          <a href="#solucoes" class="header-link" @click.prevent="scrollToSection('solucoes')">
            Quem Somos
          </a>
          <a href="#operacao" class="header-link" @click.prevent="scrollToSection('operacao')">
            Solucoes
          </a>
          <a href="#operacao" class="header-link" @click.prevent="scrollToSection('operacao')">
            Consultoria
          </a>
          <a href="#showcase" class="header-link" @click.prevent="scrollToSection('showcase')">
            Sistema
          </a>
        </nav>

        <div class="header-actions">
          <a href="/login" class="header-portal">
            Acessar Portal
          </a>
          <a
            href="https://wa.me/5528999463616?text=Ol%C3%A1%2C%20quero%20uma%20demonstra%C3%A7%C3%A3o%20da%20Economic%20Card"
            target="_blank"
            rel="noopener noreferrer"
            class="header-cta"
          >
            <span>Falar com especialista</span>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M7 5l5 5-5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9" />
            </svg>
          </a>
        </div>

        <button
          type="button"
          class="mobile-menu-button"
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
      </div>

      <div v-if="isMobileMenuOpen" class="mobile-menu">
        <div class="mobile-menu__panel">
          <a href="#solucoes" class="mobile-menu-link" @click.prevent="scrollToSection('solucoes')">
            Quem Somos
          </a>
          <a href="#operacao" class="mobile-menu-link" @click.prevent="scrollToSection('operacao')">
            Solucoes
          </a>
          <a href="#operacao" class="mobile-menu-link" @click.prevent="scrollToSection('operacao')">
            Consultoria
          </a>
          <a href="#showcase" class="mobile-menu-link" @click.prevent="scrollToSection('showcase')">
            Sistema
          </a>
          <a href="/login" class="mobile-menu-link">
            Acessar Portal
          </a>
          <a
            href="https://wa.me/5528999463616?text=Ol%C3%A1%2C%20quero%20uma%20demonstra%C3%A7%C3%A3o%20da%20Economic%20Card"
            target="_blank"
            rel="noopener noreferrer"
            class="mobile-menu-cta"
          >
            Falar com especialista
          </a>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  inHero: {
    type: Boolean,
    default: false
  },
  floating: {
    type: Boolean,
    default: false
  }
})

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
.landing-header {
  position: sticky;
  top: 0;
  z-index: 40;
  padding: 1rem 0 0;
  background: linear-gradient(180deg, rgba(3, 7, 13, 0.8), rgba(3, 7, 13, 0));
  backdrop-filter: blur(12px);
  transition: padding 0.3s ease;
}

.landing-header--in-hero {
  position: absolute;
  inset: 0 0 auto;
  z-index: 30;
  padding-top: 1.35rem;
  background: none;
  backdrop-filter: none;
}

.landing-header--floating {
  position: relative;
  width: 100%;
  padding-top: 1.35rem;
  background: none;
  backdrop-filter: none;
}

.landing-header--in-hero .header-inner,
.landing-header--floating .header-inner {
  padding: 0 1.1rem;
}

.landing-header--floating .header-inner {
  max-width: min(1480px, calc(100vw - 1.4rem));
  transition:
    max-width 0.35s ease,
    padding 0.35s ease;
}

.landing-header--in-hero .header-bar,
.landing-header--floating .header-bar {
  min-height: 4.7rem;
  padding: 0.88rem 1.05rem 0.88rem 1.15rem;
  border-radius: 1.7rem;
  border-color: rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(180deg, rgba(13, 17, 25, 0.94), rgba(8, 11, 18, 0.96)),
    radial-gradient(circle at 78% 50%, rgba(115, 199, 125, 0.12), transparent 24%),
    radial-gradient(circle at 24% 0%, rgba(34, 100, 163, 0.12), transparent 28%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 18px 44px rgba(2, 6, 12, 0.3),
    0 0 0 1px rgba(9, 18, 31, 0.22);
}

.header-inner {
  position: relative;
  width: min(100%, 1440px);
  margin: 0 auto;
  padding: 0 0.75rem;
}

.header-bar {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 1rem;
  min-height: 4.4rem;
  padding: 0.8rem 0.95rem 0.8rem 1rem;
  border-radius: 1.55rem;
  border: 1px solid rgba(129, 148, 168, 0.18);
  background:
    linear-gradient(180deg, rgba(14, 18, 26, 0.95), rgba(8, 11, 17, 0.95)),
    radial-gradient(circle at top, rgba(115, 199, 125, 0.08), transparent 42%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 24px 60px rgba(2, 6, 12, 0.34);
  transition:
    min-height 0.3s ease,
    padding 0.3s ease,
    border-radius 0.3s ease,
    box-shadow 0.3s ease;
}

.header-brand {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  text-decoration: none;
}

.header-brand__logo {
  display: block;
  width: auto;
  height: 3rem;
  max-width: min(18rem, 32vw);
  object-fit: contain;
}

.header-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.header-link,
.header-portal {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.7rem;
  padding: 0 1rem;
  border-radius: 9999px;
  color: rgba(231, 239, 248, 0.82);
  font-size: 0.94rem;
  font-weight: 600;
  text-decoration: none;
  transition:
    color 0.25s ease,
    background-color 0.25s ease,
    transform 0.25s ease;
}

.header-link:hover,
.header-portal:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.header-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.55rem;
}

.header-portal {
  color: rgba(255, 255, 255, 0.92);
}

.header-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2.95rem;
  padding: 0 1.4rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #75d27f, #5cbf71);
  color: #0c1a18;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 18px 34px rgba(115, 199, 125, 0.24);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    filter 0.25s ease;
}

.header-cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 24px 38px rgba(115, 199, 125, 0.3);
}

.header-cta svg {
  width: 0.95rem;
  height: 0.95rem;
}

.mobile-menu-button {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.95rem;
  height: 2.95rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(128, 149, 171, 0.18);
  background: rgba(255, 255, 255, 0.04);
  color: #f8fbff;
}

.mobile-menu {
  padding-top: 0.75rem;
}

.mobile-menu__panel {
  display: grid;
  gap: 0.7rem;
  padding: 1rem;
  border-radius: 1.45rem;
  border: 1px solid rgba(128, 149, 171, 0.18);
  background: linear-gradient(180deg, rgba(14, 18, 26, 0.96), rgba(8, 11, 17, 0.96));
  box-shadow: 0 24px 60px rgba(2, 6, 12, 0.34);
}

.mobile-menu-link,
.mobile-menu-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  border-radius: 9999px;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 700;
}

.mobile-menu-link {
  border: 1px solid rgba(128, 149, 171, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: #eff7ff;
}

.mobile-menu-cta {
  background: linear-gradient(135deg, #75d27f, #5cbf71);
  color: #0c1a18;
}

.header--compact {
  padding-top: 0.6rem;
}

.landing-header--floating.header--compact .header-inner {
  max-width: min(1240px, calc(100vw - 5rem));
}

.header--compact .header-bar {
  min-height: 3.85rem;
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
  border-radius: 1.35rem;
}

.landing-header--floating.header--compact .header-bar {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 14px 34px rgba(2, 6, 12, 0.26),
    0 0 0 1px rgba(9, 18, 31, 0.16);
}

.header--compact .header-brand__logo {
  height: 2.55rem;
}

.header--compact .header-link,
.header--compact .header-portal {
  min-height: 2.45rem;
  font-size: 0.88rem;
}

.header--compact .header-cta {
  min-height: 2.7rem;
  font-size: 0.9rem;
}

@media (max-width: 1180px) {
  .header-bar {
    grid-template-columns: auto 1fr auto;
  }

  .header-nav {
    gap: 0.15rem;
  }

  .header-link,
  .header-portal {
    padding: 0 0.8rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 960px) {
  .landing-header--in-hero,
  .landing-header--floating {
    padding-top: 1rem;
  }

  .landing-header--floating .header-inner,
  .landing-header--floating.header--compact .header-inner {
    max-width: calc(100vw - 1.25rem);
  }

  .header-bar {
    grid-template-columns: auto auto;
    justify-content: space-between;
  }

  .header-nav,
  .header-actions {
    display: none;
  }

  .mobile-menu-button {
    display: inline-flex;
  }
}

@media (max-width: 640px) {
  .landing-header {
    padding-top: 0.7rem;
  }

  .landing-header--in-hero,
  .landing-header--floating {
    padding-top: 0.85rem;
  }

  .header-inner {
    padding: 0 0.6rem;
  }

  .header-bar {
    min-height: 4rem;
    padding-left: 0.8rem;
    padding-right: 0.8rem;
    border-radius: 1.25rem;
  }

  .header-brand__logo {
    height: 2.5rem;
    max-width: 13.5rem;
  }
}
</style>
