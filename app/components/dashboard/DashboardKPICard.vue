<template>
  <div :class="`bg-gradient-to-r ${gradient} text-white p-6 rounded-xl shadow-lg`">
    <div class="flex items-center justify-between">
      <div>
        <p :class="`text-${getColorClass()}-100 text-sm`">{{ title }}</p>
        <p class="text-2xl font-bold">{{ value }}</p>
        <div class="flex items-center mt-1" v-if="change">
          <span :class="getChangeClass()">{{ getChangeText() }}</span>
          <component :is="getChangeIcon()" class="w-4 h-4 ml-1" :class="getChangeClass()" />
        </div>
      </div>
      <component :is="getIcon()" :class="`w-12 h-12 text-${getColorClass()}-200`" />
    </div>
  </div>
</template>

<script setup>
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  PercentBadgeIcon, 
  BanknotesIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  change: {
    type: [Number, String],
    default: null
  },
  changeType: {
    type: String,
    default: 'positive' // positive, negative, status
  },
  icon: {
    type: String,
    required: true
  },
  gradient: {
    type: String,
    required: true
  }
})

const getIcon = () => {
  const icons = {
    currency: CurrencyDollarIcon,
    'trending-up': ArrowTrendingUpIcon,
    percent: PercentBadgeIcon,
    banknotes: BanknotesIcon
  }
  return icons[props.icon] || CurrencyDollarIcon
}

const getColorClass = () => {
  if (props.gradient.includes('blue')) return 'blue'
  if (props.gradient.includes('green')) return 'green'
  if (props.gradient.includes('purple')) return 'purple'
  if (props.gradient.includes('orange')) return 'orange'
  return 'blue'
}

const getChangeClass = () => {
  if (props.changeType === 'positive') return 'text-green-300 text-sm'
  if (props.changeType === 'negative') return 'text-red-300 text-sm'
  if (props.changeType === 'status') return 'text-yellow-300 text-sm'
  return 'text-green-300 text-sm'
}

const getChangeIcon = () => {
  if (props.changeType === 'positive') return ChevronUpIcon
  if (props.changeType === 'negative') return ChevronDownIcon
  if (props.changeType === 'status') return CheckCircleIcon
  return ChevronUpIcon
}

const getChangeText = () => {
  if (props.changeType === 'status') return props.change
  if (props.changeType === 'positive') return `+${props.change}%`
  if (props.changeType === 'negative') return `-${props.change}%`
  return `${props.change}%`
}
</script>