import { useCallback, useEffect, useState } from 'react'
import {
  NoSlotsError,
  fetchOpeningHours,
  saveOpeningHours,
  setTemporaryClosure,
  type OpeningHours,
  type Slot,
  type Weekday,
} from './api'

export type LoadState = 'loading' | 'ready' | 'failed'

const byOpening = (a: Slot, b: Slot) => a.opensAt.localeCompare(b.opensAt)

export function useOpeningHours() {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [hours, setHours] = useState<OpeningHours | null>(null)
  const [errorDays, setErrorDays] = useState<Weekday[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoadState('loading')
    fetchOpeningHours().then(
      (loaded) => {
        setHours(loaded)
        setLoadState('ready')
      },
      () => setLoadState('failed'),
    )
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [message])

  const edit = (weekday: Weekday, change: (slots: Slot[]) => Slot[]) => {
    setHours((current) => {
      if (!current) return current
      const slots = change(current.days[weekday].slots).sort(byOpening)
      setErrorDays((days) => (slots.length > 0 ? days.filter((d) => d !== weekday) : days))
      return { ...current, days: { ...current.days, [weekday]: { slots } } }
    })
  }

  const addSlot = (weekday: Weekday, slot: Slot) => edit(weekday, (slots) => [...slots, slot])
  const removeSlot = (weekday: Weekday, index: number) =>
    edit(weekday, (slots) => slots.filter((_, i) => i !== index))

  const save = async () => {
    if (!hours) return
    setBusy(true)
    setActionError(null)
    try {
      await saveOpeningHours(hours.days)
      setErrorDays([])
      setMessage('Hours saved.')
    } catch (error) {
      if (error instanceof NoSlotsError) setErrorDays(error.weekdays)
      else setActionError('Your hours were not saved. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const setClosed = async (closed: boolean) => {
    setBusy(true)
    setActionError(null)
    try {
      const updated = await setTemporaryClosure(closed)
      setHours((current) => (current ? { ...current, temporarilyClosed: updated.temporarilyClosed } : current))
      setMessage(
        closed
          ? 'Restaurant closed to new orders. Placed orders are not cancelled.'
          : 'Restaurant reopened. Your saved hours apply again.',
      )
    } catch {
      setActionError(closed ? 'The restaurant was not closed. Try again.' : 'The restaurant was not reopened. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return { loadState, hours, errorDays, busy, message, actionError, load, addSlot, removeSlot, save, setClosed }
}
