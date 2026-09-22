<script setup lang="ts">
import { Candy, Citrus, PartyPopper, Repeat } from '@lucide/vue'
const { oops } = useToast()
const name = ref('')
const adminPin = ref('')
const busy = ref(false)

async function create() {
  busy.value = true
  try {
    const { joinCode } = await $fetch('/api/groups', { method: 'POST', body: { name: name.value, adminPin: adminPin.value } })
    await navigateTo(`/g/${joinCode}?new=1`)
  }
  catch (e) { oops(e) }
  busy.value = false
}
</script>

<template>
  <div class="stack">
    <div class="center" style="padding: 26px 0 8px">
      <div class="hero-icons"><Citrus style="color: var(--orange)" /><Repeat style="color: var(--teal)" /><Candy style="color: var(--pink)" /></div>
      <h1>Swapsies</h1>
      <p class="muted" style="font-size: 1.05rem">Swap your spare stickers with your class.<br>No sign-ups. Just a link for the class chat.</p>
    </div>

    <form class="card stack" @submit.prevent="create">
      <h2>Start a class group</h2>
      <label>Group name
        <input v-model="name" required maxlength="40" placeholder="e.g. Grade 1 Dolphins">
      </label>
      <label>Admin PIN <span class="muted">(4 digits, for fixing things later)</span>
        <input v-model="adminPin" class="pin" required inputmode="numeric" pattern="\d{4}" maxlength="4" autocomplete="off" placeholder="••••">
      </label>
      <button class="wide" :disabled="busy"><PartyPopper /> Create group</button>
    </form>

    <p class="muted center">Already in a group? Open the link from your class chat.</p>
    <p class="muted center" style="font-size: .75rem">A parent-made helper. Not affiliated with any retailer or brand.</p>
  </div>
</template>
