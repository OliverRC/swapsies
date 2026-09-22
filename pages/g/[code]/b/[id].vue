<script setup lang="ts">
import { ArrowLeft, ArrowLeftRight, Ban, BookOpen, Check, Clock, Handshake, Heart, Lock, Mail, Motorbike, Repeat, Scale, Send, ThumbsUp, X } from '@lucide/vue'
import stickers from '~~/stickers.json'

const { code, id } = useRoute().params as { code: string, id: string }
const { toast, oops } = useToast()
const byNo = Object.fromEntries(stickers.map(s => [s.no, s]))

const { data: book, refresh: refreshBook } = await useFetch(`/api/books/${id}`)
if (!book.value) throw createError({ statusCode: 404, statusMessage: 'Sticker book not found', fatal: true })
useHead({ title: () => `${book.value?.childName}'s stickers · Swapsies` })
const unlocked = computed(() => !!book.value?.unlocked)

const { data: matches, refresh: refreshMatches } = useLazyFetch(`/api/books/${id}/matches`, { server: false, default: () => [] })
const { data: trades, refresh: refreshTrades } = useLazyFetch(`/api/books/${id}/trades`, { server: false, immediate: unlocked.value, default: () => [] })

const tab = ref<'book' | 'friends' | 'trades'>('book')
const todo = computed(() => trades.value.filter(t => (t.status === 'offered' && !t.sent) || t.status === 'accepted').length)

function refreshAll() {
  refreshBook()
  refreshMatches()
  if (unlocked.value) refreshTrades()
}
// freshness: refetch on focus, poll the trades inbox every 20s while the tab is visible
onMounted(() => {
  window.addEventListener('focus', refreshAll)
  const timer = setInterval(() => unlocked.value && !document.hidden && refreshTrades(), 20_000)
  onBeforeUnmount(() => { window.removeEventListener('focus', refreshAll); clearInterval(timer) })
})

// --- my book --------------------------------------------------------------
const counts = ref<Record<number, number>>({})
watch(() => book.value?.holdings, h => (counts.value = { ...h }), { immediate: true })
const got = computed(() => stickers.filter(s => counts.value[s.no]).length)
watch(got, (now, before) => {
  if ([10, 25, stickers.length].some(m => before < m && now >= m)) celebrate()
})

async function setCount(no: number, count: number) {
  if (!unlocked.value || count < 0 || count > 99) return
  const before = counts.value[no] ?? 0
  counts.value[no] = count // optimistic: parents are tapping through a pile
  try { await $fetch(`/api/books/${id}/holdings`, { method: 'PUT', body: { stickerNo: no, count } }) }
  catch (e) { counts.value[no] = before; oops(e) }
}

// --- unlock / lock --------------------------------------------------------
const pin = ref('')
async function unlock() {
  try {
    await $fetch(`/api/books/${id}/unlock`, { method: 'POST', body: { pin: pin.value } })
    await refreshBook()
    refreshTrades()
  }
  catch (e) { oops(e) }
  pin.value = ''
}
async function lock() {
  await $fetch(`/api/books/${id}/lock`, { method: 'POST' })
  await navigateTo(`/g/${code}`)
}

// --- trade window ---------------------------------------------------------
type Match = { id: string, childName: string, theyCanGive: number[], iCanGive: number[], perfect: boolean }
const dialog = ref<HTMLDialogElement>()
const friend = ref<Match>()
const give = ref<number[]>([])
const get = ref<number[]>([])

function openTrade(m: Match) {
  friend.value = m
  const fair = Math.min(m.iCanGive.length, m.theyCanGive.length) // best fair swap: one for one
  give.value = m.iCanGive.slice(0, fair)
  get.value = m.theyCanGive.slice(0, fair)
  dialog.value!.showModal()
}
const toggle = (list: number[], no: number) => list.includes(no) ? list.splice(list.indexOf(no), 1) : list.push(no)

async function sendOffer() {
  try {
    await $fetch('/api/trades', { method: 'POST', body: { fromBook: id, toBook: friend.value!.id, give: give.value, get: get.value } })
    dialog.value!.close()
    toast(`Offer sent to ${friend.value!.childName}`)
    tab.value = 'trades'
    refreshTrades()
  }
  catch (e) { oops(e) }
}

async function act(t: { id: string, iGive: number[], iGet: number[] }, action: 'accept' | 'decline' | 'cancel' | 'done') {
  try {
    await $fetch(`/api/trades/${t.id}/${action}`, { method: 'POST' })
    if (action === 'done') celebrate([t.iGive[0], t.iGet[0]])
  }
  catch (e) { oops(e) }
  refreshAll()
}

// badge per state; an incoming offer is its own state ("new") because it needs an answer
const statusBadge = {
  new: { label: 'New offer!', icon: Mail },
  offered: { label: 'Waiting…', icon: Clock },
  accepted: { label: 'Agreed! Swap at school', icon: Handshake },
  done: { label: 'Swapped', icon: Check },
  declined: { label: 'No thanks', icon: X },
  cancelled: { label: 'Cancelled', icon: Ban },
}
const badgeKey = (t: { status: string, sent: boolean }) => (t.status === 'offered' && !t.sent ? 'new' : t.status) as keyof typeof statusBadge
</script>

<template>
  <div v-if="book" class="stack">
    <div class="topbar">
      <NuxtLink :to="`/g/${code}`" class="logo"><ArrowLeft /> {{ book.groupName }}</NuxtLink>
      <button v-if="unlocked" class="small ghost" title="Lock this book on this device" @click="lock"><Lock /> Lock</button>
    </div>

    <div>
      <h1>{{ book.childName }}'s stickers</h1>
      <div class="row" style="margin-top: 6px">
        <div class="bar grow"><i :style="{ width: `${got / stickers.length * 100}%` }" /></div>
        <b class="count">{{ got }} / {{ stickers.length }}</b>
      </div>
    </div>

    <form v-if="!unlocked" class="card row" @submit.prevent="unlock">
      <label class="grow">Your book? Enter its PIN to edit
        <input v-model="pin" class="pin" required inputmode="numeric" pattern="\d{4}" maxlength="4" autocomplete="off" placeholder="••••">
      </label>
      <button style="align-self: end">Unlock</button>
    </form>

    <!-- My Book -->
    <template v-if="tab === 'book'">
      <p v-if="unlocked" class="muted center">Tap a sticker to add one · tap − to take one away</p>
      <div class="grid">
        <div v-for="s in stickers" :key="s.no" class="tile" :class="[counts[s.no] ? 'got' : 'need', { golden: s.golden }]" :style="{ '--c': s.color }">
          <button class="hit" :disabled="!unlocked" :aria-label="`${s.name}, number ${s.no}: have ${counts[s.no] ?? 0}. Add one`" @click="setCount(s.no, (counts[s.no] ?? 0) + 1)">
            <span class="no">{{ s.no }}</span>
            <StickerIcon :no="s.no" />
            <span class="name">{{ s.name }}</span>
          </button>
          <span v-if="counts[s.no] > 1" :key="counts[s.no]" class="plus">+{{ counts[s.no] - 1 }}</span>
          <button v-if="unlocked && counts[s.no]" class="minus" :aria-label="`Remove one ${s.name}`" @click="setCount(s.no, counts[s.no] - 1)">−</button>
        </div>
      </div>
    </template>

    <!-- Friends -->
    <template v-else-if="tab === 'friends'">
      <p v-if="!matches.length" class="muted center">No friends in this group yet. Share the group link!</p>
      <div v-for="m in matches" :key="m.id" class="card stack">
        <div class="row">
          <div class="avatar" :style="{ background: avatarColor(m.childName) }">{{ m.childName[0]?.toUpperCase() }}</div>
          <b class="grow">{{ m.childName }}</b>
          <span v-if="m.perfect" class="badge perfect"><Heart /> Perfect match!</span>
        </div>
        <p class="muted">
          Can give you <b>{{ m.theyCanGive.length }}</b> · needs <b>{{ m.iCanGive.length }}</b> of your swaps
        </p>
        <button v-if="unlocked && (m.theyCanGive.length || m.iCanGive.length)" class="orange wide" @click="openTrade(m)"><Repeat /> Trade with {{ m.childName }}</button>
      </div>
    </template>

    <!-- Trades -->
    <template v-else>
      <p v-if="!trades.length" class="muted center">No trades yet. Find a friend and send an offer!</p>
      <div v-for="t in trades" :key="t.id" class="card stack" :class="{ finished: ['done', 'declined', 'cancelled'].includes(t.status) }">
        <div class="row" style="justify-content: space-between">
          <b>{{ t.sent ? `To ${t.friendName}` : `From ${t.friendName}` }}</b>
          <span class="badge" :class="`s-${badgeKey(t)}`"><component :is="statusBadge[badgeKey(t)].icon" /> {{ statusBadge[badgeKey(t)].label }}</span>
        </div>
        <div class="panels">
          <div class="panel mine">
            <p class="muted">You give</p>
            <div class="chips"><span v-for="no in t.iGive" :key="no" class="chip static on" :style="{ '--c': byNo[no]?.color }"><StickerIcon :no="no" /> #{{ no }}</span></div>
          </div>
          <ArrowLeftRight class="arrows" />
          <div class="panel theirs">
            <p class="muted">You get</p>
            <div class="chips"><span v-for="no in t.iGet" :key="no" class="chip static on" :style="{ '--c': byNo[no]?.color }"><StickerIcon :no="no" /> #{{ no }}</span></div>
          </div>
        </div>
        <div v-if="t.status === 'offered' && !t.sent" class="row">
          <button class="grow" @click="act(t, 'accept')"><ThumbsUp /> Accept</button>
          <button class="ghost" @click="act(t, 'decline')">No thanks</button>
        </div>
        <button v-else-if="t.status === 'offered'" class="ghost small" @click="act(t, 'cancel')">Cancel offer</button>
        <div v-else-if="t.status === 'accepted'" class="row">
          <button class="pink grow" @click="act(t, 'done')"><Motorbike /> Swapped!</button>
          <button class="ghost" @click="act(t, 'cancel')">Cancel</button>
        </div>
      </div>
    </template>

    <!-- Pokémon-style trade window -->
    <dialog ref="dialog" @click.self="dialog!.close()">
      <form v-if="friend" class="stack" @submit.prevent="sendOffer">
        <h2 class="center">Trade with {{ friend.childName }}</h2>
        <div class="panels">
          <div class="panel mine">
            <p class="muted">{{ book.childName }} gives</p>
            <div class="chips">
              <button v-for="no in friend.iCanGive" :key="no" type="button" class="chip" :class="{ on: give.includes(no) }" :style="{ '--c': byNo[no]?.color }" :aria-pressed="give.includes(no)" :title="byNo[no]?.name" @click="toggle(give, no)">
                <StickerIcon :no="no" /> #{{ no }}
              </button>
            </div>
            <p v-if="!friend.iCanGive.length" class="muted">Nothing they need yet</p>
          </div>
          <ArrowLeftRight class="arrows" />
          <div class="panel theirs">
            <p class="muted">{{ friend.childName }} gives</p>
            <div class="chips">
              <button v-for="no in friend.theyCanGive" :key="no" type="button" class="chip" :class="{ on: get.includes(no) }" :style="{ '--c': byNo[no]?.color }" :aria-pressed="get.includes(no)" :title="byNo[no]?.name" @click="toggle(get, no)">
                <StickerIcon :no="no" /> #{{ no }}
              </button>
            </div>
            <p v-if="!friend.theyCanGive.length" class="muted">No spares you need yet</p>
          </div>
        </div>
        <p class="center muted">{{ give.length }} for {{ get.length }}<template v-if="give.length && give.length === get.length"> · <Scale /> fair swap</template></p>
        <div class="row">
          <button type="button" class="ghost" @click="dialog!.close()">Close</button>
          <button class="orange grow" :disabled="!give.length && !get.length"><Send /> Send offer</button>
        </div>
      </form>
    </dialog>

    <nav v-if="unlocked" class="tabs">
      <button :class="{ on: tab === 'book' }" @click="tab = 'book'"><BookOpen /> My Book</button>
      <button :class="{ on: tab === 'friends' }" @click="tab = 'friends'; refreshMatches()"><Handshake /> Friends</button>
      <button :class="{ on: tab === 'trades' }" @click="tab = 'trades'; refreshTrades()"><Mail /> Trades<span v-if="todo" class="dot">{{ todo }}</span></button>
    </nav>
  </div>
</template>
