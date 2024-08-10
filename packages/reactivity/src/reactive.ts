import { def, isObject, toRawType } from '@vue/shared'
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
  shallowReadonlyHandlers,
} from './baseHandlers'
import { ReactiveFlags } from './constants'
import { warn } from './warning'

export const reactiveMap = new WeakMap()
export const shallowReactiveMap = new WeakMap()
export const readonlyMap = new WeakMap()
export const shallowReadonlyMap = new WeakMap()

enum TargetType {
  INVALID = 0,
  COMMON = 1,
}

function targetTypeMap(rawType) {
  switch (rawType) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON
    default:
      return TargetType.INVALID
  }
}

function getTargetType(value) {
  // isExtensible: Returns a value that indicates whether new properties can be added to an object.
  return value[ReactiveFlags.IS_SKIP] || !Object.isExtensible(value)
    ? TargetType.INVALID
    : targetTypeMap(toRawType(value))
}

export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers, reactiveMap)
}

export function shallowReactive(target) {
  return createReactiveObject(
    target,
    false,
    shallowReactiveHandlers,
    shallowReactiveMap
  )
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers, readonlyMap)
}

export function shallowReadonly(target) {
  return createReactiveObject(
    target,
    true,
    shallowReadonlyHandlers,
    shallowReadonlyMap
  )
}

function createReactiveObject(target, isReadonly, baseHandlers, proxyMap) {
  // only object can be made reactive
  if (!isObject(target)) {
    warn(
      `value cannot be made ${isReadonly ? 'readonly' : 'reactive'}: ${String(
        target
      )}`
    )
    return target
  }
  // target is already a Proxy, return it.
  // exception: calling readonly() on a reactive object
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target
  }
  // target already has corresponding Proxy
  let existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  // only specific value types can be observed.
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) {
    return target
  }
  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy)
  return proxy
}
// only reactive object can be readonly
export const isReactive = (value) => {
  if (isReadonly(value)) {
    return isReactive(value[ReactiveFlags.RAW])
  }
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}
export const isReadonly = (value) => {
  return !!(value && value[ReactiveFlags.IS_READONLY])
}
export const isShallow = (value) => {
  return !!(value && value[ReactiveFlags.IS_SHALLOW])
}
export const isProxy = (value) => {
  return value ? !!value[ReactiveFlags.RAW] : false
}
export function toRaw(observed) {
  const raw = observed && observed[ReactiveFlags.RAW]
  return raw ? toRaw(raw) : observed
}

export function markRaw(value) {
  if (Object.isExtensible(value)) {
    def(value, ReactiveFlags.IS_SKIP, true)
  }
  return value
}

export const toReactive = (value) => (isObject(value) ? reactive(value) : value)
export const toReadonly = (value) => (isObject(value) ? readonly(value) : value)
