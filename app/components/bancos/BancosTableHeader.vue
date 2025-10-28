<template>
  <thead class="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900">
    <tr class="border-b border-blue-700/50">
      <th 
        v-for="(column, index) in visibleColumns" 
        :key="column"
        class="group relative px-6 py-6 text-center cursor-pointer transition-all duration-300 hover:bg-white/5"
        draggable="true"
        @dragstart="$emit('drag-start', $event, column, index)"
        @dragover="$emit('drag-over', $event)"
        @drop="$emit('drag-drop', $event, index)"
        @dragend="$emit('drag-end')"
      >
        <!-- Subtle background pattern -->
        <div class="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <!-- Content -->
        <div class="relative">
          <!-- Column title -->
          <div class="text-base font-bold text-white group-hover:text-blue-200 transition-colors duration-300 tracking-wide">
            {{ columnTitles[column] }}
          </div>
          
          <!-- Subtle underline -->
          <div class="mt-1 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        <!-- Active state indicator -->
        <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-12 transition-all duration-300 rounded-t-full"></div>
        
        <!-- Side glow effect -->
        <div class="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div class="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </th>
    </tr>
  </thead>
</template>

<script setup>
defineProps({
  visibleColumns: Array,
  columnTitles: Object,
  draggedColumn: Object
})

defineEmits(['drag-start', 'drag-over', 'drag-drop', 'drag-end', 'start-resize'])

const getHeaderClasses = (column) => {
  const baseClasses = 'px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer transition-all duration-300 group relative';
  
  if (column === 'credito' || column === 'previsto') {
    return `${baseClasses} hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 hover:text-emerald-700`;
  } else if (column === 'debito') {
    return `${baseClasses} hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-700`;
  } else if (column === 'saldo') {
    return `${baseClasses} hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700`;
  } else if (column === 'status') {
    return `${baseClasses} hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 hover:text-purple-700`;
  }
  
  return `${baseClasses} hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:text-gray-800`;
}

const getColumnIcon = (column) => {
  const icons = {
    empresa: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    banco: 'M12 2l3.09 6.26L22 9l-5 4.87L18.18 21 12 17.77 5.82 21 7 13.87 2 9l6.91-.74L12 2z',
    agencia: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    conta: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    data: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    credito: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    debito: 'M20 12H4',
    previsto: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    saldo: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
    status: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  }
  
  return icons[column] || null
}
</script>