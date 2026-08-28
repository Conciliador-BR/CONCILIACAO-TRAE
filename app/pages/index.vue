<template>
  <div class="landing-index relative min-h-screen overflow-x-hidden bg-[#eef2f6]">
    <div class="landing-index__header">
      <LandingHeader floating />
    </div>

    <main class="relative z-10">
      <LandingHero />
      <LandingShowcase />
      <LandingWorkflow />
      <LandingFeatureGrid />
      <LandingLogosMarquee />
      <LandingFooterCta />
      <LandingSocialProof />
      <LandingMiddleQuote />
      <LandingMarketLogosCard />
    </main>
  </div>
</template>

<script setup>
import LandingFeatureGrid from '~/components/apresentacao/LandingFeatureGrid.vue'
import LandingFooterCta from '~/components/apresentacao/LandingFooterCta.vue'
import LandingHeader from '~/components/apresentacao/LandingHeader.vue'
import LandingHero from '~/components/apresentacao/LandingHero.vue'
import LandingLogosMarquee from '~/components/apresentacao/LandingLogosMarquee.vue'
import LandingMarketLogosCard from '~/components/apresentacao/LandingMarketLogosCard.vue'
import LandingMiddleQuote from '~/components/apresentacao/LandingMiddleQuote.vue'
import LandingShowcase from '~/components/apresentacao/LandingShowcase.vue'
import LandingSocialProof from '~/components/apresentacao/LandingSocialProof.vue'
import LandingWorkflow from '~/components/apresentacao/LandingWorkflow.vue'

const siteUrl = 'https://economiccard.app.br/'
const title = 'Economic Card | Conciliacao de cartoes para supermercados'
const description = 'Sistema e consultoria de conciliacao de cartoes para supermercados. Confira vendas, recebimentos, bancos, taxas e divergencias em um so lugar.'
const ogImage = `${siteUrl}economic-card-logo.png`

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: siteUrl,
  ogSiteName: 'Economic Card',
  ogLocale: 'pt_BR',
  ogImage,
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: ogImage
})

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Source+Sans+3:wght@400;500;600;700;800&display=swap'
    },
    { rel: 'canonical', href: siteUrl }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Economic Card',
        url: siteUrl,
        logo: ogImage,
        sameAs: [],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'sales',
            telephone: '+55-28-99946-3616',
            areaServed: 'BR',
            availableLanguage: ['pt-BR']
          }
        ]
      })
    }
  ]
})
</script>

<style scoped>
:global(html) {
  scroll-behavior: smooth;
}

:global(.landing-index) {
  position: relative;
  font-family: 'Source Sans 3', 'Segoe UI', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

:global(.landing-index__header) {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  pointer-events: none;
}

:global(.landing-index__header > *) {
  pointer-events: auto;
}

:global(.landing-index .font-landing-display) {
  font-family: 'Fraunces', Georgia, 'Times New Roman', serif;
  letter-spacing: -0.02em;
}
</style>
