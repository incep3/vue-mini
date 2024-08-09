import { isObject, toRawType } from '@vue/shared'
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReactiveHandlers,
} from './baseHandlers'
import { ReactiveFlags } from './constants'
import { warn } from './warning'

export const reactiveMap = new WeakMap()
export const shallowReactiveMap = new WeakMap()
export const readonlyMap = new WeakMap()

enum TargetType {
  INVALID = 0,
  COMMON = 1,
}

function targetTypeMap(rawType) {
  switch (rawType) {
    case 'Object':
      return TargetType.COMMON
    default:
      return TargetType.INVALID
  }
}

function getTargetType(value) {
  // isExtensible: Returns a value that indicates whether new properties can be added to an object.
  return !Object.isExtensible(value)
    ? TargetType.INVALID
    : targetTypeMap(toRawType(value))
}

export function reactive(target) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

export function shallowReactive(target) {
  return createReactiveObject(
    target,
    shallowReactiveHandlers,
    shallowReactiveMap
  )
}

export function readonly(target) {
  return createReactiveObject(target, readonlyHandlers, readonlyMap)
}

function createReactiveObject(target, baseHandlers, proxyMap) {
  // only object can be made reactive
  if (!isObject(target)) {
    warn('target should be Object.')
    return target
  }
  // target is already a Proxy, return it.
  if (target[ReactiveFlags.RAW]) {
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

export function toRaw(observed) {
  const raw = observed && observed[ReactiveFlags.RAW]
  return raw ? raw : observed
}
