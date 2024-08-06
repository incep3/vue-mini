const targetMap = new WeakMap()

export function track(target, key) {
  // 没有 activeEffect，直接 return
  if (!activeEffect) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }

  deps.add(activeEffect)
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const effects = depsMap.get(key)

  effects && effects.forEach((fn) => fn())
}

export let activeEffect
export function effect(fn) {
  activeEffect = fn
  fn()
}
