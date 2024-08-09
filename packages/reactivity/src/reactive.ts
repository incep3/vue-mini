import { baseHandlers } from './baseHandlers'

export function reactive(target) {
  return createReactiveObject(target, baseHandlers)
}

function createReactiveObject(target, baseHandlers) {
  const proxy = new Proxy(target, baseHandlers)

  return proxy
}
