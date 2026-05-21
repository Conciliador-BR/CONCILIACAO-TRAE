<template>
  <div class="min-h-screen bg-[linear-gradient(180deg,#081525_0%,#0d1d30_24%,#f5f9fd_24%,#ffffff_100%)]">
    <LandingHeader />
    <main>
      <LandingHero />
      <LandingTrustStrip />
      <LandingFeatureGrid />
      <LandingWorkflow />
      <LandingShowcase />
      <LandingFooterCta />
    </main>
  </div>
</template>

<script setup>
import LandingFeatureGrid from '~/components/apresentacao/LandingFeatureGrid.vue'
import LandingFooterCta from '~/components/apresentacao/LandingFooterCta.vue'
import LandingHeader from '~/components/apresentacao/LandingHeader.vue'
import LandingHero from '~/components/apresentacao/LandingHero.vue'
import LandingShowcase from '~/components/apresentacao/LandingShowcase.vue'
import LandingTrustStrip from '~/components/apresentacao/LandingTrustStrip.vue'
import LandingWorkflow from '~/components/apresentacao/LandingWorkflow.vue'
</script>
