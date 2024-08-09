import { baseHandlers } from './baseHandlers'
import { ReactiveFlags } from './constants'

export function reactive(target) {
  return createReactiveObject(target, baseHandlers)
}

function createReactiveObject(target, baseHandlers) {
  const proxy = new Proxy(target, baseHandlers)

  return proxy
}

export function toRaw(observed) {
  const raw = observed && observed[ReactiveFlags.RAW]
  return raw ? raw : observed
}
