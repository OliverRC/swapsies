<script setup lang="ts">
const { msg } = useToast()
</script>

<template>
  <main>
    <NuxtPage />
    <Celebration />
    <div v-if="msg" class="toast" role="status">{{ msg }}</div>
  </main>
</template>
