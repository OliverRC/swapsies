<script setup lang="ts">
import { Motorbike, Wind } from '@lucide/vue'

const fx = useCelebration()
</script>

<template>
  <div v-if="fx" :key="fx.key" class="fx" aria-hidden="true">
    <i v-for="(p, i) in fx.pieces" :key="i" :style="p" />
    <template v-if="fx.swap">
      <div class="swapcard a"><StickerIcon :no="fx.swap[0]" /></div>
      <div class="swapcard b"><StickerIcon :no="fx.swap[1]" /></div>
      <div class="scooter">
        <StickerIcon :no="fx.swap[0]" /><StickerIcon :no="fx.swap[1]" /><Motorbike class="bike" /><Wind />
      </div>
    </template>
  </div>
</template>
