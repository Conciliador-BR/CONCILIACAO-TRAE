<template>
  <div class="min-h-screen bg-[#eef2f6]">
    <LandingHeader />
    <main>
      <LandingHero />
      <LandingTrustStrip />
      <LandingFeatureGrid />
      <LandingLogosMarquee />
      <LandingMiddleQuote />
      <LandingWorkflow />
      <LandingShowcase />
      <LandingFooterCta />
      <LandingEcosystemStrip />
    </main>
  </div>
</template>

<script setup>
import LandingEcosystemStrip from '~/components/apresentacao/LandingEcosystemStrip.vue'
import LandingFeatureGrid from '~/components/apresentacao/LandingFeatureGrid.vue'
import LandingFooterCta from '~/components/apresentacao/LandingFooterCta.vue'
import LandingHeader from '~/components/apresentacao/LandingHeader.vue'
import LandingHero from '~/components/apresentacao/LandingHero.vue'
import LandingLogosMarquee from '~/components/apresentacao/LandingLogosMarquee.vue'
import LandingMiddleQuote from '~/components/apresentacao/LandingMiddleQuote.vue'
import LandingShowcase from '~/components/apresentacao/LandingShowcase.vue'
import LandingTrustStrip from '~/components/apresentacao/LandingTrustStrip.vue'
import LandingWorkflow from '~/components/apresentacao/LandingWorkflow.vue'
</script>

<style scoped>
:global(html) {
  scroll-behavior: smooth;
}
</style>
