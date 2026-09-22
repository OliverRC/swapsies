<script setup lang="ts">
import { ChartColumn, Hand, Link, LockOpen, Megaphone, Plus, Repeat } from '@lucide/vue'
import stickers from '~~/stickers.json'

const code = useRoute().params.code as string
const { toast, oops } = useToast()
const { data: group, refresh, error } = await useFetch(`/api/groups/${code}`)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Group not found', fatal: true })
useHead({ title: () => `${group.value?.name} · Swapsies` })

const books = computed(() => [...group.value!.books].sort((a, b) => Number(b.mine) - Number(a.mine)))
const hasMine = computed(() => books.value.some(b => b.mine))

// class board: per sticker, how many kids still need it vs. spares floating around
const board = computed(() => {
  const by = new Map(group.value!.board.map(r => [r.no, r]))
  return stickers.map((s) => {
    const have = by.get(s.no)?.have ?? 0
    const spare = by.get(s.no)?.spare ?? 0
    // nobody has it: greyed out · somebody has it but no spares: rare
    return { ...s, need: group.value!.books.length - have, spare, missing: have === 0, rare: have > 0 && spare === 0 }
  })
})

const groupUrl = () => `${location.origin}/g/${code}`

// The link goes inside `text` on its own last line. Passing it as a separate `url` makes the
// macOS share sheet's Copy glue "url text" into one un-navigable string.
async function share() {
  const text = `Let's swap spare stickers! Add your child's sticker book to "${group.value!.name}" on Swapsies and see who can swap with who. No sign-up needed.\n${groupUrl()}`
  try {
    if (navigator.share) await navigator.share({ text })
    else { await navigator.clipboard.writeText(text); toast('Invite copied! Paste it in the class chat') }
  }
  catch { /* share sheet dismissed */ }
}

async function copyLink() {
  try { await navigator.clipboard.writeText(groupUrl()); toast('Link copied!') }
  catch { toast(groupUrl()) } // clipboard blocked: at least show it
}

const childName = ref('')
const pin = ref('')
const busy = ref(false)
async function addBook() {
  busy.value = true
  try {
    const { bookId } = await $fetch(`/api/groups/${code}/books`, { method: 'POST', body: { childName: childName.value, pin: pin.value } })
    await navigateTo(`/g/${code}/b/${bookId}`)
  }
  catch (e) { oops(e) }
  busy.value = false
}

onMounted(() => window.addEventListener('focus', () => refresh()))
</script>

<template>
  <div v-if="group" class="stack">
    <div class="topbar">
      <NuxtLink to="/" class="logo"><Repeat /> Swapsies</NuxtLink>
      <span class="row" style="gap: 6px">
        <button class="small ghost" aria-label="Copy group link" title="Copy link" @click="copyLink"><Link /></button>
        <button class="small orange" @click="share"><Megaphone /> Share</button>
      </span>
    </div>

    <h1>{{ group.name }}</h1>

    <div v-if="$route.query.new" class="card" style="border-color: var(--teal)">
      <b>Group created!</b> Tap <b>Share</b> and post it in the class chat, then add your own sticker book below.
    </div>

    <NuxtLink v-for="b in books" :key="b.id" :to="`/g/${code}/b/${b.id}`" class="card link">
      <div class="avatar" :style="{ background: avatarColor(b.childName) }">{{ b.childName[0]?.toUpperCase() }}</div>
      <div class="grow">
        <div class="row" style="justify-content: space-between">
          <b>{{ b.childName }}</b>
          <span>
            <span v-if="b.mine" class="badge teal"><LockOpen /> yours</span>
            <span v-if="b.swaps" class="badge orange" style="margin-left: 4px">{{ b.swaps }} to swap</span>
          </span>
        </div>
        <div class="row" style="margin-top: 6px">
          <div class="bar grow"><i :style="{ width: `${b.got / stickers.length * 100}%` }" /></div>
          <span class="muted">{{ b.got }} / {{ stickers.length }}</span>
        </div>
      </div>
    </NuxtLink>
    <p v-if="!books.length" class="muted center">No sticker books yet. Be the first!</p>

    <details class="card" :open="!hasMine">
      <summary><Plus /> Add my sticker book</summary>
      <form class="stack" @submit.prevent="addBook">
        <label>Child's first name
          <input v-model="childName" required maxlength="40" placeholder="First name" autocomplete="off">
        </label>
        <label>Choose a 4-digit PIN <span class="muted">(share it with your co-parent)</span>
          <input v-model="pin" class="pin" required inputmode="numeric" pattern="\d{4}" maxlength="4" autocomplete="off" placeholder="••••">
        </label>
        <button class="wide" :disabled="busy">Add book</button>
      </form>
    </details>

    <details v-if="books.length" class="card">
      <summary><ChartColumn /> Class board</summary>
      <ul class="legend">
        <li><span class="tile need swatch"><StickerIcon :no="1" /></span> Nobody has it yet</li>
        <li><span class="tile got rare swatch" style="--c: var(--pink)"><StickerIcon :no="1" /></span> Someone has it, no spares</li>
        <li><span class="tile got swatch" style="--c: var(--teal)"><StickerIcon :no="1" /></span> Spares to swap</li>
        <li><span class="swatch plain"><Hand /></span> Kids who still need it</li>
        <li><span class="swatch plain"><span class="plus">+2</span></span> Spares in the class</li>
      </ul>
      <div class="grid">
        <div v-for="s in board" :key="s.no" class="tile" :class="[s.missing ? 'need' : 'got', { rare: s.rare, golden: s.golden }]" :style="{ '--c': s.color }" :title="s.name">
          <span class="no">{{ s.no }}</span>
          <StickerIcon :no="s.no" />
          <span class="stat"><Hand />{{ s.need }}</span>
          <span v-if="s.spare" class="plus">+{{ s.spare }}</span>
        </div>
      </div>
    </details>

    <p class="center muted"><NuxtLink :to="`/g/${code}/admin`">Group admin</NuxtLink> · lost a PIN? Ask whoever made the group.</p>
  </div>
</template>
