<script setup lang="ts">
import { Gift } from '@lucide/vue'

// images: public/stickers/{no}.webp, cropped from the promo banner
defineProps<{ no?: number }>()
</script>

<template>
  <img v-if="no" :src="`/stickers/${no}.webp`" class="sticker-icon" alt="" width="192" height="192" loading="lazy" decoding="async">
  <Gift v-else class="sticker-icon" aria-hidden="true" />
</template>
