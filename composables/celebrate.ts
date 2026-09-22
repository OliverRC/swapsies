// Confetti (+ optional swap cards and a little delivery scooter). Rendered by components/Celebration.vue.
type Fx = { key: number, swap?: [number?, number?], pieces: Record<string, string>[] }
export const useCelebration = () => useState<Fx | null>('fx', () => null)

export function celebrate(swap?: [number?, number?]) {
  if (!import.meta.client) return
  const fx = useCelebration()
  const colors = ['#14b8a6', '#fb923c', '#f472b6', '#fbbf24']
  const key = Date.now()
  fx.value = {
    key,
    swap,
    pieces: Array.from({ length: 60 }, (_, i) => ({
      'left': `${Math.random() * 100}%`,
      'background': colors[i % colors.length]!,
      'border-radius': i % 3 ? '3px' : '50%',
      '--x': `${Math.random() * 120 - 60}px`,
      '--r': `${Math.random() * 720 - 360}deg`,
      '--d': `${1.6 + Math.random() * 1.6}s`,
      '--w': `${Math.random() * 0.5}s`,
    })),
  }
  setTimeout(() => fx.value?.key === key && (fx.value = null), 3600)
}

export const useToast = () => {
  const msg = useState<string>('toast', () => '')
  let timer: ReturnType<typeof setTimeout>
  const toast = (m: string) => { msg.value = m; clearTimeout(timer); timer = setTimeout(() => (msg.value = ''), 3500) }
  // pull the friendly message out of a failed $fetch
  const oops = (e: any) => toast(e?.data?.message ?? 'Something went wrong. Try again?')
  return { msg, toast, oops }
}

export const avatarColor = (name: string) => ['#14b8a6', '#fb923c', '#f472b6'][[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 3]
