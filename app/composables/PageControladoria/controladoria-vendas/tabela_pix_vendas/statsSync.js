import { ref } from 'vue'

export const pixVendasStatsVersion = ref(0)

export const notifyPixVendasStatsChanged = () => {
  pixVendasStatsVersion.value += 1
}
