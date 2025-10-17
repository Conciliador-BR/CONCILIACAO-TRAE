<template>
  <nav class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-6">
      <div class="flex space-x-8">
        <NuxtLink 
          v-for="tab in tabs" 
          :key="tab.id"
          :to="tab.route"
          :prefetch="false"
          class="flex items-center px-4 py-4 cursor-pointer border-b-2 transition-all duration-200"
          :class="{
            'border-blue-500 text-blue-600': $route.path === tab.route,
            'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300': $route.path !== tab.route
          }"
        >
          <component :is="tab.icon" class="w-5 h-5 mr-2" />
          <span class="font-medium">{{ tab.name }}</span>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { 
  ChartBarIcon,
  CurrencyDollarIcon, 
  DocumentTextIcon,
  PercentBadgeIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon
} from '@heroicons/vue/24/outline'

const tabs = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: ChartBarIcon,
    route: '/'
  },
  {
    id: 'vendas',
    name: 'Vendas',
    icon: CurrencyDollarIcon,
    route: '/vendas'
  },
  {
    id: 'controladoria',
    name: 'Controladoria',
    icon: ClipboardDocumentListIcon,
    route: '/controladoria'
  },
  {
    id: 'taxas',
    name: 'Taxas',
    icon: PercentBadgeIcon,
    route: '/taxas'
  },
  {
    id: 'pagamentos',
    name: 'Pagamentos',
    icon: DocumentTextIcon,
    route: '/pagamentos'
  },
  {
    id: 'bancos',
    name: 'Bancos',
    icon: BanknotesIcon,
    route: '/bancos'
  }
]
</script>