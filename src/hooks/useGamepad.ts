import { useEffect, useRef, useSyncExternalStore } from 'react'
import { KEYBOARD, readPressed } from '../lib/buttons'
import type { PsButton } from '../lib/types'

export type InputFrame = { pressed: Set<PsButton>; justPressed: Set<PsButton> }
type Listener = (frame: InputFrame) => void

/**
 * Bucle único de lectura del mando (Gamepad API) + teclado como alternativa.
 * Solo corre mientras haya algún componente escuchando.
 */
const listeners = new Set<Listener>()
const keys = new Set<PsButton>()
let prev = new Set<PsButton>()
let raf = 0
let padName: string | null = null
const padSubs = new Set<() => void>()

function currentPad(): Gamepad | null {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return null
  return navigator.getGamepads().find((g): g is Gamepad => !!g && g.connected) ?? null
}

function setPadName(name: string | null) {
  if (name === padName) return
  padName = name
  padSubs.forEach((f) => f())
}

function loop() {
  const pad = currentPad()
  setPadName(pad?.id ?? null)
  const pressed = pad ? readPressed(pad.buttons, pad.axes) : new Set<PsButton>()
  keys.forEach((k) => pressed.add(k))
  const justPressed = new Set([...pressed].filter((b) => !prev.has(b)))
  // Solo notificar si hay algo pulsado o se acaba de soltar todo
  const changed = pressed.size > 0 || prev.size > 0
  prev = pressed
  if (changed) {
    const frame = { pressed, justPressed }
    listeners.forEach((l) => l(frame))
  }
  raf = requestAnimationFrame(loop)
}

const isTyping = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
}
const onKeyDown = (e: KeyboardEvent) => {
  const b = KEYBOARD[e.key.toLowerCase()]
  if (b && !isTyping(e)) keys.add(b)
}
const onKeyUp = (e: KeyboardEvent) => {
  const b = KEYBOARD[e.key.toLowerCase()]
  if (b) keys.delete(b)
}
const onBlur = () => keys.clear()

function subscribe(l: Listener) {
  listeners.add(l)
  if (listeners.size === 1) {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    raf = requestAnimationFrame(loop)
  }
  return () => {
    listeners.delete(l)
    if (listeners.size === 0) {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      keys.clear()
      prev = new Set()
    }
  }
}

/** Llama a `onFrame` en cada fotograma con los botones pulsados. `enabled=false` detiene la escucha. */
export function useControllerInput(onFrame: Listener, enabled = true) {
  const ref = useRef(onFrame)
  useEffect(() => {
    ref.current = onFrame
  })
  useEffect(() => {
    if (!enabled) return
    return subscribe((f) => ref.current(f))
  }, [enabled])
}

function subscribePad(cb: () => void) {
  padSubs.add(cb)
  const refresh = () => setPadName(currentPad()?.id ?? null)
  window.addEventListener('gamepadconnected', refresh)
  window.addEventListener('gamepaddisconnected', refresh)
  refresh()
  return () => {
    padSubs.delete(cb)
    window.removeEventListener('gamepadconnected', refresh)
    window.removeEventListener('gamepaddisconnected', refresh)
  }
}

/** Nombre del mando conectado o null */
export const useGamepadName = () => useSyncExternalStore(subscribePad, () => padName, () => null)
