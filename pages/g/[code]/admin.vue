<script setup lang="ts">
import { ArrowLeft, Trash2 } from '@lucide/vue'
const code = useRoute().params.code as string
const { toast, oops } = useToast()
const { data: group, refresh } = await useFetch(`/api/groups/${code}`)
if (!group.value) throw createError({ statusCode: 404, statusMessage: 'Group not found', fatal: true })

const adminPin = ref('')
const superKey = ref('')
const name = ref(group.value.name)
const newPins = reactive<Record<string, string>>({})

// one wrapper: run the call, refresh, toast
async function run(fn: () => Promise<unknown>, ok: string) {
  try { await fn(); await refresh(); toast(ok) }
  catch (e) { oops(e) }
}
const unlock = () => run(() => $fetch(`/api/groups/${code}/admin/unlock`, { method: 'POST', body: superKey.value ? { superKey: superKey.value } : { adminPin: adminPin.value } }), 'Admin unlocked')
const rename = () => run(() => $fetch(`/api/admin/groups/${code}`, { method: 'PATCH', body: { name: name.value } }), 'Renamed')
const resetPin = (id: string) => run(async () => { await $fetch(`/api/admin/books/${id}/reset-pin`, { method: 'POST', body: { newPin: newPins[id] } }); newPins[id] = '' }, 'PIN reset. Pass the new one on')
const remove = (id: string, who: string) => confirm(`Remove ${who}'s book and all its trades? This can't be undone.`)
  && run(() => $fetch(`/api/admin/books/${id}`, { method: 'DELETE' }), 'Book removed')
</script>

<template>
  <div v-if="group" class="stack">
    <div class="topbar">
      <NuxtLink :to="`/g/${code}`" class="logo"><ArrowLeft /> {{ group.name }}</NuxtLink>
    </div>
    <h1>Group admin</h1>

    <form v-if="!group.isAdmin" class="card stack" @submit.prevent="unlock">
      <label>Admin PIN
        <input v-model="adminPin" class="pin" inputmode="numeric" pattern="\d{4}" maxlength="4" autocomplete="off" placeholder="••••" :required="!superKey">
      </label>
      <details>
        <summary class="muted">Lost the admin PIN?</summary>
        <label>Super-admin key <input v-model="superKey" type="password" autocomplete="off"></label>
      </details>
      <button class="wide">Unlock admin</button>
    </form>

    <template v-else>
      <form class="card stack" @submit.prevent="rename">
        <label>Group name <input v-model="name" required maxlength="40"></label>
        <button class="small">Rename</button>
      </form>

      <div v-for="b in group.books" :key="b.id" class="card stack">
        <div class="row" style="justify-content: space-between">
          <b>{{ b.childName }}</b>
          <button class="small ghost" @click="remove(b.id, b.childName)"><Trash2 /> Remove</button>
        </div>
        <form class="row" @submit.prevent="resetPin(b.id)">
          <input v-model="newPins[b.id]" class="pin grow" style="margin: 0" required inputmode="numeric" pattern="\d{4}" maxlength="4" autocomplete="off" placeholder="new PIN" :aria-label="`New PIN for ${b.childName}`">
          <button class="small pink">Reset PIN</button>
        </form>
      </div>
      <p v-if="!group.books.length" class="muted center">No books yet.</p>
    </template>
  </div>
</template>
