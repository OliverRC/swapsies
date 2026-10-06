<script setup lang="ts">
const { msg } = useToast()
const route = useRoute()
useHead({ link: [{ rel: 'manifest', href: () => route.params.code ? `/manifest.webmanifest?g=${route.params.code}` : '/manifest.webmanifest' }] })
</script>

<template>
  <main>
    <NuxtPage />
    <Celebration />
    <div v-if="msg" class="toast" role="status">{{ msg }}</div>
  </main>
</template>
